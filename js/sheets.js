/**
 * Módulo para interactuar con Google Sheets
 * Usa la API de exportación CSV de Google Sheets para lectura
 * y Google Apps Script para escritura
 */
const SheetsAPI = {
    sheetId: null,
    sheetName: null,
    webAppUrl: null,
    data: [],
    headers: [],
    codeIndexMap: null,

    /**
     * Extrae el ID del sheet desde la URL
     * @param {string} url - URL de Google Sheets
     * @returns {string|null} ID del sheet
     */
    extractSheetId(url) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : null;
    },

    /**
     * Inicializa la conexión con el sheet
     * @param {string} url - URL del Google Sheet
     * @param {string} sheetName - Nombre de la hoja
     * @param {string} webAppUrl - URL de la Apps Script para lectura remota
     * @returns {Promise<boolean>} true si la conexión fue exitosa
     */
    async init(url, sheetName, webAppUrl) {
        this.sheetId = this.extractSheetId(url);
        this.sheetName = sheetName || 'Hoja1';
        this.webAppUrl = webAppUrl || CONFIG.defaults.webAppUrl;

        if (!this.sheetId) {
            throw new Error(CONFIG.messages.invalidUrl);
        }

        // Guardar webAppUrl en Storage para usar en actualizaciones
        Storage.setWebAppUrl(this.webAppUrl);

        // Intentar cargar los datos
        await this.fetchData();
        return true;
    },

    /**
     * Obtiene los datos del sheet como CSV
     * Intenta primero con Apps Script (CORS compatible en producción)
     * @returns {Promise<Array>} Datos del sheet
     */
    async fetchData() {
        try {
            // Intentar primero con Apps Script (mejor para producción)
            if (this.webAppUrl && !this.webAppUrl.includes('undefined') && !this.webAppUrl.includes('null')) {
                try {
                    console.log('🌐 Intentando obtener datos vía Apps Script...');
                    const response = await fetch(this.webAppUrl + '?action=read&sheet=' + encodeURIComponent(this.sheetName), {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Accept': 'text/csv'
                        }
                    });
                    
                    if (response.ok) {
                        const csvText = await response.text();
                        
                        // Si Apps Script devolvió datos válidos, usarlos
                        if (csvText && csvText.trim().length > 0) {
                            const parsed = this.parseCSV(csvText);
                            
                            if (parsed.length > 1) { // Al menos headers + 1 fila
                                this.data = parsed;
                                this.headers = this.data[0];
                                this.codeIndexMap = null;
                                console.log(`✅ Datos cargados vía Apps Script: ${this.data.length - 1} filas`);
                                
                                // Cachear los datos
                                Storage.setCachedData({
                                    data: this.data,
                                    headers: this.headers,
                                    sheetId: this.sheetId,
                                    sheetName: this.sheetName
                                });
                                
                                return this.data;
                            } else {
                                console.warn('⚠️ Apps Script devolvió datos vacíos, intentando acceso directo...');
                            }
                        } else {
                            console.warn('⚠️ Apps Script devolvió CSV vacío, intentando acceso directo...');
                        }
                    } else {
                        console.warn('⚠️ Apps Script respondió con error HTTP, intentando acceso directo...');
                    }
                } catch (appsScriptError) {
                    console.warn('⚠️ Apps Script no disponible, intentando acceso directo...', appsScriptError.message);
                }
            }
            
            // Fallback: Acceso directo a Google Sheets (siempre funciona si está compartido públicamente)
            const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(this.sheetName)}`;
            console.log('🌐 Intentando obtener datos de Google Sheets (directo)...');
            console.log('📍 URL:', csvUrl);
            
            const response = await fetch(csvUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/csv'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: No se pudo acceder al documento. Verifique que esté compartido públicamente.`);
            }

            const csvText = await response.text();
            
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('La hoja está vacía o no contiene datos.');
            }
            
            this.data = this.parseCSV(csvText);
            
            if (this.data.length > 0) {
                this.headers = this.data[0];
                this.codeIndexMap = null;
                console.log(`✅ Datos cargados (acceso directo): ${this.data.length - 1} filas`);
            }

            // Cachear los datos
            Storage.setCachedData({
                data: this.data,
                headers: this.headers,
                sheetId: this.sheetId,
                sheetName: this.sheetName
            });

            return this.data;
            
        } catch (error) {
            console.error('❌ Error fetching sheet data:', error);
            console.log('📋 Intentando usar datos cacheados...');
            
            // Intentar usar datos cacheados
            const cached = Storage.getCachedData();
            if (cached && cached.sheetId === this.sheetId && cached.data && cached.data.length > 0) {
                console.log(`✅ Usando datos cacheados: ${cached.data.length - 1} filas`);
                this.data = cached.data;
                this.headers = cached.headers;
                this.codeIndexMap = null;
                return this.data;
            }
            
            console.error('❌ Sin datos cacheados disponibles');
            throw error;
        }
    },

    /**
     * Parsea CSV a array
     * @param {string} csv - Texto CSV
     * @returns {Array} Array de arrays
     */
    parseCSV(csv) {
        const lines = [];
        let currentLine = [];
        let currentField = '';
        let insideQuotes = false;

        for (let i = 0; i < csv.length; i++) {
            const char = csv[i];
            const nextChar = csv[i + 1];

            if (insideQuotes) {
                if (char === '"' && nextChar === '"') {
                    currentField += '"';
                    i++; // Skip next quote
                } else if (char === '"') {
                    insideQuotes = false;
                } else {
                    currentField += char;
                }
            } else {
                if (char === '"') {
                    insideQuotes = true;
                } else if (char === ',') {
                    currentLine.push(currentField.trim());
                    currentField = '';
                } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                    currentLine.push(currentField.trim());
                    if (currentLine.some(field => field !== '')) {
                        lines.push(currentLine);
                    }
                    currentLine = [];
                    currentField = '';
                    if (char === '\r') i++; // Skip \n after \r
                } else if (char !== '\r') {
                    currentField += char;
                }
            }
        }

        // Add last field and line
        if (currentField || currentLine.length > 0) {
            currentLine.push(currentField.trim());
            if (currentLine.some(field => field !== '')) {
                lines.push(currentLine);
            }
        }

        return lines;
    },

    /**
     * Busca un producto por código de barras
     * @param {string} code - Código de barras
     * @returns {Object|null} Producto encontrado o null
     */
    findByCode(code) {
        if (!this.data || this.data.length <= 1) {
            return null;
        }

        const normalizedInput = this.normalizeCodeForSearch(code);
        if (!normalizedInput) {
            return null;
        }

        if (!this.codeIndexMap) {
            this.buildCodeIndex();
        }

        const exactMatchIndex = this.codeIndexMap.get(normalizedInput);
        if (typeof exactMatchIndex === 'number') {
            const row = this.data[exactMatchIndex];
            return {
                rowIndex: exactMatchIndex + 1,
                data: row,
                product: this.rowToProduct(row)
            };
        }

        const last12 = normalizedInput.slice(-12);
        if (last12.length === 12) {
            const last12MatchIndex = this.codeIndexMap.get(last12);
            if (typeof last12MatchIndex === 'number') {
                const row = this.data[last12MatchIndex];
                return {
                    rowIndex: last12MatchIndex + 1,
                    data: row,
                    product: this.rowToProduct(row)
                };
            }
        }

        const codeColumn = CONFIG.sheets.columns.cod_patrim;
        
        for (let i = 1; i < this.data.length; i++) { // Empezar desde 1 para saltar headers
            const row = this.data[i];
            const rowCode = this.normalizeCodeForSearch(row[codeColumn]);
            if (!rowCode) {
                continue;
            }

            if (rowCode === normalizedInput || (normalizedInput.length >= 12 && rowCode === normalizedInput.slice(-12))) {
                return {
                    rowIndex: i + 1, // +1 porque Google Sheets es 1-indexed
                    data: row,
                    product: this.rowToProduct(row)
                };
            }
        }
        return null;
    },

    buildCodeIndex() {
        this.codeIndexMap = new Map();
        const codeColumn = CONFIG.sheets.columns.cod_patrim;

        for (let i = 1; i < this.data.length; i++) {
            const row = this.data[i];
            const normalized = this.normalizeCodeForSearch(row[codeColumn]);
            if (!normalized) {
                continue;
            }

            if (!this.codeIndexMap.has(normalized)) {
                this.codeIndexMap.set(normalized, i);
            }

            const last12 = normalized.slice(-12);
            if (last12.length === 12 && !this.codeIndexMap.has(last12)) {
                this.codeIndexMap.set(last12, i);
            }
        }
    },

    normalizeCodeForSearch(value) {
        if (value === null || value === undefined) {
            return '';
        }

        let normalized = String(value)
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toUpperCase();

        normalized = normalized
            .replace(/[OQ]/g, '0')
            .replace(/[IL]/g, '1')
            .replace(/S/g, '5')
            .replace(/B/g, '8')
            .replace(/[^0-9]/g, '');

        if (normalized.length > 12) {
            return normalized.slice(-12);
        }

        return normalized;
    },

    normalizeTextForSearch(value) {
        if (value === null || value === undefined) {
            return '';
        }

        return String(value)
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toUpperCase()
            .replace(/[\s\-_.:/|]/g, '');
    },

    findByCodeM(codeM) {
        if (!this.data || this.data.length <= 1) {
            return null;
        }

        const codeMColumn = CONFIG.sheets.columns.cod_m;
        const normalizedInputText = this.normalizeTextForSearch(codeM);
        const normalizedInputDigits = this.normalizeCodeForSearch(codeM);

        if (!normalizedInputText && !normalizedInputDigits) {
            return null;
        }

        for (let i = 1; i < this.data.length; i++) {
            const row = this.data[i];
            const rowValue = row[codeMColumn];

            if (!rowValue) {
                continue;
            }

            const rowText = this.normalizeTextForSearch(rowValue);
            const rowDigits = this.normalizeCodeForSearch(rowValue);

            const textMatch = normalizedInputText && rowText === normalizedInputText;
            const digitMatch = normalizedInputDigits && rowDigits && rowDigits === normalizedInputDigits;

            if (textMatch || digitMatch) {
                return {
                    rowIndex: i + 1,
                    data: row,
                    product: this.rowToProduct(row)
                };
            }
        }

        return null;
    },

    /**
     * Convierte una fila a objeto producto
     * @param {Array} row - Fila de datos
     * @returns {Object} Objeto producto
     */
    rowToProduct(row) {
        const cols = CONFIG.sheets.columns;
        return {
            nombre_local: row[cols.nombre_local] || '',
            direccion_local: row[cols.direccion_local] || '',
            bloque: row[cols.bloque] || '',
            piso: row[cols.piso] || '',
            ambiente: row[cols.ambiente] || '',
            apellidos_nombres: row[cols.apellidos_nombres] || '',
            nombre_ofi: row[cols.nombre_ofi] || '',
            cod_inv: row[cols.cod_inv] || '',
            cod_m: row[cols.cod_m] || '',
            cod_patrim: row[cols.cod_patrim] || '',
            descripcion_denominacion: row[cols.descripcion_denominacion] || '',
            marca: row[cols.marca] || '',
            modelo: row[cols.modelo] || '',
            color: row[cols.color] || '',
            estado_conserv: row[cols.estado_conserv] || '',
            fecha_inv: row[cols.fecha_inv] || '',
            usuario: row[cols.usuario] || '',
            digitador: row[cols.digitador] || '',
            inventariado: row[cols.inventariado] || 'NO',
            f_registro: row[cols.f_registro] || '',
            registrado_por: row[cols.registrado_por] || ''
        };
    },

    /**
     * Actualiza el estado de inventario de un producto usando Google Apps Script
     * @param {number} rowIndex - Índice de la fila (1-indexed)
     * @param {string} operator - Nombre del operador
     * @param {string} observations - Observaciones opcionales (ignoradas en esta estructura)
     * @returns {Promise<boolean>} true si la actualización fue exitosa
     */
    async updateInventoryStatus(rowIndex, operator, observations = '') {
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) + ' ' + now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const webAppUrl = Storage.getWebAppUrl();
        
        console.log('🔍 Web App URL:', webAppUrl);
        console.log('📋 Parámetros de actualización:');
        console.log('  - Fila:', rowIndex);
        console.log('  - Operador:', operator);
        console.log('  - Fecha:', dateStr);
        
        if (!webAppUrl) {
            console.warn('⚠️ No hay Web App URL configurada. Actualizando solo localmente.');
            this.updateLocalData(rowIndex, dateStr, operator);
            return true;
        }
        
        if (webAppUrl.includes('undefined') || webAppUrl.includes('null')) {
            console.error('❌ Web App URL inválida:', webAppUrl);
            this.updateLocalData(rowIndex, dateStr, operator);
            return true;
        }
        
        try {
            const url = new URL(webAppUrl);
            url.searchParams.set('sheetId', this.sheetId);
            url.searchParams.set('sheetName', this.sheetName);
            url.searchParams.set('row', rowIndex.toString());
            url.searchParams.set('inventariado', 'SI');
            url.searchParams.set('f_registro', dateStr);
            url.searchParams.set('registrado_por', operator);

            console.log('🔄 Enviando actualización a Web App...');
            console.log('📍 URL:', url.toString().substring(0, 100) + '...');

            const response = await Promise.race([
                fetch(url.toString(), {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                )
            ]).catch(corsError => {
                // Si hay error CORS o timeout, continuar localmente (es normal)
                console.warn('⚠️ Error al actualizar en Web App:', corsError.message);
                console.log('📦 Continuando con actualización local...');
                // Retornar respuesta ficticia para evitar romper el flujo
                return new Response(JSON.stringify({status: 'local'}), {
                    status: 200,
                    headers: {'Content-Type': 'application/json'}
                });
            });

            console.log('📊 Respuesta del servidor:', response.status);

            if (response.ok || response.status === 200) {
                try {
                    const result = await response.json();
                    console.log('✅ Resultado:', result);
                } catch (e) {
                    console.log('📝 Respuesta no es JSON, pero status es OK');
                }
                // Actualizar datos locales también
                this.updateLocalData(rowIndex, dateStr, operator);
                Storage.invalidateCache();
                return true;
            } else {
                console.warn('⚠️ Respuesta del servidor con status:', response.status);
                // Aunque falle, actualizar localmente
                this.updateLocalData(rowIndex, dateStr, operator);
                return true;
            }
        } catch (error) {
            console.error('❌ Error enviando actualización:', error);
            console.warn('ℹ️ Continuando con actualización local...');
            // Continuar sin Web App
            this.updateLocalData(rowIndex, dateStr, operator);
            return true;
        }
    },

    /**
     * Agrega una nueva fila al sheet
     * @param {Object} productData - Datos del producto: cod_patrim, descripcion, marca, modelo, color, apellidos_nombres, nombre_ofi, operator
     * @returns {Promise<number>} Índice de la nueva fila
     */
    async addNewRow(productData) {
        const webAppUrl = Storage.getWebAppUrl();
        
        console.log('🆕 Agregando nuevo producto...');
        console.log('📋 Datos del producto:', productData);
        
        if (!webAppUrl) {
            console.warn('⚠️ No hay Web App URL configurada. Actualizando solo localmente.');
            return false;
        }
        
        if (webAppUrl.includes('undefined') || webAppUrl.includes('null')) {
            console.error('❌ Web App URL inválida:', webAppUrl);
            throw new Error('Web App URL no está configurada correctamente');
        }
        
        try {
            const url = new URL(webAppUrl);
            url.searchParams.set('action', 'addNewRow');
            url.searchParams.set('sheetId', this.sheetId);
            url.searchParams.set('sheetName', this.sheetName);
            url.searchParams.set('cod_patrim', productData.cod_patrim || '');
            url.searchParams.set('descripcion', productData.descripcion || '');
            url.searchParams.set('marca', productData.marca || '');
            url.searchParams.set('modelo', productData.modelo || '');
            url.searchParams.set('color', productData.color || '');
            url.searchParams.set('apellidos_nombres', productData.apellidos_nombres || '');
            url.searchParams.set('nombre_ofi', productData.nombre_ofi || '');
            url.searchParams.set('operator', productData.operator || '');
            
            console.log('🔄 Enviando nueva fila a Web App...');
            console.log('📍 URL COMPLETA:', url.toString());
            console.log('📌 Parámetro action:', url.searchParams.get('action'));
            console.log('   cod_patrim:', url.searchParams.get('cod_patrim'));
            console.log('   descripcion:', url.searchParams.get('descripcion'));
            console.log('   color:', url.searchParams.get('color'));
            console.log('   apellidos_nombres:', url.searchParams.get('apellidos_nombres'));
            console.log('   nombre_ofi:', url.searchParams.get('nombre_ofi'));
            
            const response = await Promise.race([
                fetch(url.toString(), {
                    method: 'GET',
                    mode: 'cors'
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout después de 10s')), 10000)
                )
            ]);
            
            console.log('📊 Respuesta HTTP:', response.status, response.statusText);
            
            if (response.ok || response.status === 200) {
                const result = await response.json();
                console.log('✅ Respuesta JSON recibida:', result);
                
                if (result.success === true) {
                    console.log('✨ Fila agregada correctamente');
                    console.log('   Fila nueva:', result.data?.rowIndex);
                    return result.data?.rowIndex || true;
                } else if (result.success === false) {
                    console.error('❌ Error de la Web App:', result.error);
                    throw new Error(result.error || 'Error desconocido de la Web App');
                } else {
                    console.log('✅ Respuesta recibida (sin campo success):', result);
                    return result.data?.rowIndex || true;
                }
            } else {
                console.error('❌ Error HTTP:', response.status);
                const text = await response.text();
                console.error('   Respuesta:', text);
                throw new Error(`HTTP ${response.status}: ${text}`);
            }
        } catch (error) {
            console.error('❌ Error agregando nueva fila:', error.message);
            console.error('   Stack:', error.stack);
            throw error;
        }
    },

    /**
     * Actualiza los datos locales
     * @param {number} rowIndex - Índice de la fila
     * @param {string} date - Fecha de inventario
     * @param {string} operator - Operador
     */
    updateLocalData(rowIndex, date, operator) {
        const dataIndex = rowIndex - 1; // Convertir a 0-indexed
        const cols = CONFIG.sheets.columns;
        
        if (this.data[dataIndex]) {
            // Asegurar que la fila tenga suficientes columnas
            while (this.data[dataIndex].length <= cols.f_registro) {
                this.data[dataIndex].push('');
            }
            
            this.data[dataIndex][cols.inventariado] = 'SI';
            this.data[dataIndex][cols.f_registro] = date;
            this.data[dataIndex][cols.registrado_por] = operator;
        }
    },

    /**
     * Obtiene estadísticas del inventario
     * @returns {Object} Estadísticas
     */
    getStats() {
        const cols = CONFIG.sheets.columns;
        let total = 0;
        let inventoried = 0;
        let today = 0;
        
        // Obtener fecha actual en formato DD/MM/YYYY
        const now = new Date();
        const todayStr = String(now.getDate()).padStart(2, '0') + '/' + 
                         String(now.getMonth() + 1).padStart(2, '0') + '/' + 
                         now.getFullYear();

        for (let i = 1; i < this.data.length; i++) {
            const row = this.data[i];
            // Verificar si la fila tiene datos (usando cod_patrim como referencia)
            if (row && row[cols.cod_patrim] && row[cols.cod_patrim].trim()) {
                total++;
                
                // Contar inventariados
                if (row[cols.inventariado] && row[cols.inventariado].toUpperCase() === 'SI') {
                    inventoried++;
                    
                    // Contar inventariados hoy
                    if (row[cols.f_registro] && row[cols.f_registro].includes(todayStr)) {
                        today++;
                    }
                }
            }
        }

        return {
            total,
            inventoried,
            pending: total - inventoried,
            today
        };
    },

    /**
     * Obtiene lista de bienes inventariados
     * @returns {Array} Lista de bienes inventariados
     */
    getInventoried() {
        const cols = CONFIG.sheets.columns;
        const inventoried = [];
        
        for (let i = 1; i < this.data.length; i++) {
            const row = this.data[i];
            // Verificar si está inventariado
            if (row && row[cols.inventariado] && row[cols.inventariado].toUpperCase() === 'SI') {
                inventoried.push(row);
            }
        }
        
        // Ordenar por fecha de registro decendente
        inventoried.sort((a, b) => {
            const dateA = new Date(a[cols.f_registro] || '');
            const dateB = new Date(b[cols.f_registro] || '');
            return dateB - dateA;
        });
        
        return inventoried;
    },

    /**
     * Refresca los datos desde el servidor
     * @returns {Promise<Array>} Datos actualizados
     */
    async refresh() {
        Storage.invalidateCache();
        return await this.fetchData();
    },

    /**
     * Genera una URL para editar directamente en Google Sheets
     * @param {number} rowIndex - Índice de la fila
     * @returns {string} URL de edición
     */
    getEditUrl(rowIndex) {
        return `https://docs.google.com/spreadsheets/d/${this.sheetId}/edit#gid=0&range=A${rowIndex}`;
    },

    /**
     * Genera el script de Google Apps Script para actualizaciones
     * @returns {string} Código del Apps Script
     */
    generateAppsScript() {
        return `
// Google Apps Script para actualizar inventario
// 1. Ve a https://script.google.com
// 2. Crea un nuevo proyecto
// 3. Pega este código
// 4. Despliega como aplicación web
// 5. Copia la URL y pégala en la configuración de la app

function doGet(e) {
  const params = e.parameter;
  
  const sheetId = params.sheetId;
  const sheetName = params.sheetName || 'Hoja1';
  const row = parseInt(params.row);
  const inventariado = params.inventariado || 'SI';
  const fecha = params.fecha;
  const operador = params.operador;
  const observaciones = params.observaciones || '';
  
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(sheetName);
    
    // Columnas (ajustar según tu estructura)
    // F = Inventariado, G = Fecha, H = Operador, I = Observaciones
    sheet.getRange(row, 6).setValue(inventariado);  // F
    sheet.getRange(row, 7).setValue(fecha);         // G
    sheet.getRange(row, 8).setValue(operador);      // H
    if (observaciones) {
      sheet.getRange(row, 9).setValue(observaciones); // I
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Inventario actualizado'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  return doGet(e);
}
`;
    }
};
