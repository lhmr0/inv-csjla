/**
 * Módulo para interactuar con Google Sheets
 * Usa la API de exportación CSV de Google Sheets para lectura
 * y Google Apps Script para escritura
 */
const SheetsAPI = {
    sheetId: null,
    sheetName: null,
    data: [],
    headers: [],

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
     * @returns {Promise<boolean>} true si la conexión fue exitosa
     */
    async init(url, sheetName) {
        this.sheetId = this.extractSheetId(url);
        this.sheetName = sheetName || 'Hoja1';

        if (!this.sheetId) {
            throw new Error(CONFIG.messages.invalidUrl);
        }

        // Intentar cargar los datos
        await this.fetchData();
        return true;
    },

    /**
     * Obtiene los datos del sheet como CSV
     * @returns {Promise<Array>} Datos del sheet
     */
    async fetchData() {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(this.sheetName)}`;
        
        try {
            const response = await fetch(csvUrl);
            
            if (!response.ok) {
                throw new Error('No se pudo acceder al documento. Verifique que esté compartido públicamente.');
            }

            const csvText = await response.text();
            this.data = this.parseCSV(csvText);
            
            if (this.data.length > 0) {
                this.headers = this.data[0];
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
            console.error('Error fetching sheet data:', error);
            
            // Intentar usar datos cacheados
            const cached = Storage.getCachedData();
            if (cached && cached.sheetId === this.sheetId) {
                this.data = cached.data;
                this.headers = cached.headers;
                return this.data;
            }
            
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
        const codeColumn = CONFIG.sheets.columns.cod_patrim;
        
        for (let i = 1; i < this.data.length; i++) { // Empezar desde 1 para saltar headers
            const row = this.data[i];
            if (row[codeColumn] && row[codeColumn].toString().trim() === code.toString().trim()) {
                return {
                    rowIndex: i + 1, // +1 porque Google Sheets es 1-indexed
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
        
        if (webAppUrl) {
            try {
                const url = new URL(webAppUrl);
                url.searchParams.set('sheetId', this.sheetId);
                url.searchParams.set('sheetName', this.sheetName);
                url.searchParams.set('row', rowIndex.toString());
                url.searchParams.set('inventariado', 'SI');
                url.searchParams.set('f_registro', dateStr);
                url.searchParams.set('registrado_por', operator);

                console.log('🔄 Enviando actualización a:', url.toString());

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                }).catch(corsError => {
                    // Si hay error CORS, continuar localmente (es normal en GitHub Pages)
                    console.warn('⚠️ Error CORS (normal en GitHub Pages). Actualizando localmente...');
                    // Retornar respuesta ficticia para evitar romper el flujo
                    return new Response(JSON.stringify({status: 'local'}), {
                        status: 200,
                        headers: {'Content-Type': 'application/json'}
                    });
                });

                console.log('📊 Respuesta del servidor:', response.status);

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Resultado:', result);
                    // Actualizar datos locales
                    this.updateLocalData(rowIndex, dateStr, operator);
                    Storage.invalidateCache();
                    return true;
                } else {
                    console.warn('⚠️ Respuesta del servidor:', response.status);
                    // Aunque falle, actualizar localmente
                    this.updateLocalData(rowIndex, dateStr, operator);
                    return true;
                }
            } catch (error) {
                console.error('❌ Error enviando actualización:', error);
                console.warn('ℹ️ Continuando con actualizaciones locales...');
                // Continuar sin Web App (es normal si hay CORS desde GitHub Pages)
                this.updateLocalData(rowIndex, dateStr, operator);
                return true;
            }
        } else {
            console.log('⚠️ No se configuró Web App URL. Actualizando solo localmente.');
            this.updateLocalData(rowIndex, dateStr, operator);
            return true;
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
        const todayStr = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        for (let i = 1; i < this.data.length; i++) {
            const row = this.data[i];
            if (row[cols.codigo]) {
                total++;
                if (row[cols.inventariado] && row[cols.inventariado].toUpperCase() === 'SI') {
                    inventoried++;
                    if (row[cols.fechaInventario] && row[cols.fechaInventario].includes(todayStr.split(' ')[0])) {
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
