/**
 * Aplicación principal de inventario
 * Coordina todos los módulos
 */
const App = {
    operator: null,
    isConnected: false,

    /**
     * Inicializa la aplicación
     */
    async init() {
        // Limpiar datos antiguos y verificar espacio
        console.log('🔧 Inicializando aplicación...');
        Storage.clearOldData();
        const stats = Storage.getStorageStats();
        if (stats) {
            console.log(`📊 localStorage: ${stats.used} MB de 5 MB usado (${stats.itemCount} items)`);
        }
        
        // Inicializar UI
        UI.init();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Verificar si hay una sesión guardada
        if (Storage.hasSession()) {
            const savedData = {
                operator: Storage.getOperator(),
                sheetUrl: Storage.getSheetUrl(),
                sheetName: Storage.getSheetName(),
                webAppUrl: Storage.getWebAppUrl()
            };
            
            UI.fillLoginForm(savedData);
            
            // Intentar reconectar automáticamente
            try {
                await this.connect(savedData);
            } catch (error) {
                console.log('No se pudo reconectar automáticamente');
                UI.showLogin();
            }
        } else {
            UI.showLogin();
        }
        
        // Verificar soporte de cámara
        if (!BarcodeScanner.isSupported()) {
            UI.showToast('Su navegador no soporta el acceso a la cámara', 'warning');
        }
        
        // Actualizar historial
        this.updateHistoryView();
    },

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Login
        UI.elements.btnConnect.addEventListener('click', () => this.handleConnect());
        
        // Tabs
        UI.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                UI.switchTab(tab.dataset.tab);
            });
        });
        
        // Scanner
        UI.elements.btnStartScan.addEventListener('click', () => this.startScanner());
        UI.elements.btnStopScan.addEventListener('click', () => this.stopScanner());
        UI.elements.btnSwitchCamera.addEventListener('click', () => this.switchCamera());
        UI.elements.btnCaptureFrame = document.getElementById('btnCaptureFrame');
        if (UI.elements.btnCaptureFrame) {
            UI.elements.btnCaptureFrame.addEventListener('click', () => this.captureAndAnalyzeFrame());
        }
        
        // Image processing
        const btnProcessImage = document.getElementById('btnProcessImage');
        if (btnProcessImage) {
            btnProcessImage.addEventListener('click', () => this.handleProcessImage());
        }
        
        // Manual code from image
        const btnUseManualCode = document.getElementById('btnUseManualCode');
        if (btnUseManualCode) {
            btnUseManualCode.addEventListener('click', () => this.handleManualImageCode());
        }
        
        // Manual
        UI.elements.btnManualSearch.addEventListener('click', () => this.handleManualSearch());
        UI.elements.manualCode.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleManualSearch();
        });
        
        // History
        UI.elements.btnClearHistory.addEventListener('click', () => this.clearHistory());
        UI.elements.btnExportHistory.addEventListener('click', () => this.exportHistory());
        
        // Stats
        UI.elements.btnRefreshStats.addEventListener('click', () => this.refreshStats());
        
        // Inventoried
        if (UI.elements.btnRefreshInventoried) {
            UI.elements.btnRefreshInventoried.addEventListener('click', () => this.updateInventoriedView());
        }
        if (UI.elements.btnGenerateReport) {
            UI.elements.btnGenerateReport.addEventListener('click', () => this.generateWordReport());
        }
        if (UI.elements.btnExportInventorieds) {
            UI.elements.btnExportInventorieds.addEventListener('click', () => this.exportInventoried());
        }
        
        // Modal
        UI.elements.closeModal.addEventListener('click', () => UI.closeModal());
        UI.elements.resultModal.addEventListener('click', (e) => {
            if (e.target === UI.elements.resultModal) UI.closeModal();
        });
        
        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') UI.closeModal();
        });
        
        // Manejar visibilidad de la página (pausar escáner)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && BarcodeScanner.isRunning) {
                this.stopScanner();
            }
        });
    },

    /**
     * Maneja la conexión con Google Sheets
     */
    async handleConnect() {
        const formData = UI.getLoginFormValues();
        
        // Validar datos
        if (!formData.operator) {
            UI.showToast(CONFIG.messages.operatorRequired, 'warning');
            return;
        }
        
        // Usar valores por defecto si no están ingresados
        formData.sheetUrl = formData.sheetUrl || CONFIG.defaults.sheetUrl;
        formData.sheetName = formData.sheetName || CONFIG.defaults.sheetName;
        formData.webAppUrl = formData.webAppUrl || CONFIG.defaults.webAppUrl;
        
        await this.connect(formData);
    },

    /**
     * Conecta con Google Sheets
     * @param {Object} data - Datos de conexión
     */
    async connect(data) {
        UI.showLoading('Conectando con Google Sheets...');
        
        try {
            console.log('🔄 Intentando conectar con Google Sheets...');
            await SheetsAPI.init(data.sheetUrl, data.sheetName);
            console.log('✅ Conexión exitosa con Google Sheets');
            
        } catch (error) {
            console.warn('⚠️ No se pudo conectar con Google Sheets. Modo offline disponible.');
            console.warn('Detalles del error:', error.message);
            
            // Permitir continuar en modo offline si hay caché
            const cached = Storage.getCachedData();
            if (!cached || !cached.data || cached.data.length === 0) {
                UI.hideLoading();
                UI.showToast('❌ No se pudo conectar. Asegúrate que la hoja está compartida públicamente.', 'error');
                console.error('Error crítico - sin datos cacheados:', error);
                throw error;
            }
            
            // Usar datos cacheados
            console.log('📦 Usando datos cacheados');
            UI.showToast('⚠️ Modo offline - Usando datos cacheados', 'warning');
        }
        
        try {
            // Guardar datos
            this.operator = data.operator;
            Storage.setOperator(data.operator);
            Storage.setSheetUrl(data.sheetUrl);
            Storage.setSheetName(data.sheetName);
            if (data.webAppUrl) {
                Storage.setWebAppUrl(data.webAppUrl);
            }
            
            this.isConnected = true;
            
            // Mostrar pantalla principal
            UI.showMain(data.operator);
            UI.showToast('✅ Sesión iniciada correctamente', 'success');
            
            // Actualizar estadísticas
            this.refreshStats();
            
            // Cargar bienes inventariados
            this.updateInventoriedView();
            
        } catch (error) {
            console.error('Error en login:', error);
            UI.showToast('❌ Error al iniciar sesión: ' + (error.message || 'Error desconocido'), 'error');
            UI.showLogin();
            throw error;
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Inicia el escáner de códigos de barras
     */
    async startScanner() {
        try {
            // Verificar permisos de cámara
            const hasPermission = await BarcodeScanner.requestPermissions();
            if (!hasPermission) {
                UI.showToast('Debes permitir acceso a la cámara', 'warning');
                return;
            }
            
            UI.showLoading('Inicializando cámara...');
            
            // Inicializar escáner con callback
            await BarcodeScanner.init((code, format) => {
                console.log('🎯 Código detectado en tiempo real:', code, format);
                this.handleCodeDetected(code, format);
            });
            
            console.log('🎬 Iniciando cámara...');
            await BarcodeScanner.start();
            UI.updateScannerControls(true);
            UI.hideLoading();
            UI.showToast('✅ Cámara lista - Acerca el código de barras', 'success');
            console.log('✅ Cámara activa y escaneando en vivo');
            
        } catch (error) {
            console.error('❌ Error al iniciar scanner:', error);
            UI.hideLoading();
            UI.showToast(error.message || CONFIG.messages.cameraError, 'error');
            UI.updateScannerControls(false);
        }
    },

    /**
     * Detiene el escáner
     */
    stopScanner() {
        try {
            BarcodeScanner.stop();
            UI.updateScannerControls(false);
            console.log('✅ Cámara detenida');
        } catch (error) {
            console.error('Error al detener la cámara:', error);
        }
    },

    /**
     * Cambia de cámara
     */
    async switchCamera() {
        try {
            UI.showLoading('Cambiando cámara...');
            await BarcodeScanner.switchCamera();
            UI.hideLoading();
            
            // Obtener nombre de la cámara actual
            const cameraLabel = BarcodeScanner.devices[BarcodeScanner.currentDeviceIndex].label || 'Cámara ' + (BarcodeScanner.currentDeviceIndex + 1);
            UI.showToast('✅ Cámara: ' + cameraLabel, 'success');
            console.log('📱 Cámaras totales:', BarcodeScanner.devices.length);
        } catch (error) {
            UI.hideLoading();
            UI.showToast('⚠️ ' + (error.message || 'Error al cambiar cámara'), 'warning');
            console.warn('Error:', error);
        }
    },

    /**
     * Captura un frame del video y lo analiza
     */
    async captureAndAnalyzeFrame() {
        try {
            console.log('📸 Capturando frame del video con OCR...');
            
            // Usar el nuevo método que captura Y analiza en una sola llamada
            const ocrText = await BarcodeScanner.captureAndAnalyzeOCRFrame();
            
            if (!ocrText) {
                UI.showToast('⚠️ No se pudo extraer texto del frame. Intenta acercarte o cambiar ángulo.', 'warning');
                console.warn('⚠️ No se extrajo texto del frame');
                return;
            }

            console.log('✅ Texto extraído:', ocrText);
            UI.showToast('✅ Texto extraído correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error en captura y análisis:', error);
            UI.showToast('❌ Error al capturar frame', 'error');
        }
    },

    /**
     * Muestra una captura en la galería de frames
     */
    displayCapturedFrame(capture) {
        const framesList = document.getElementById('framesList');
        const capturedFramesDiv = document.getElementById('capturedFrames');

        if (!framesList || !capturedFramesDiv) {
            console.warn('Elementos de galería no encontrados');
            return;
        }

        // Mostrar contenedor
        capturedFramesDiv.style.display = 'block';

        // Crear elemento para la captura
        const frameEl = document.createElement('div');
        frameEl.className = 'frame-thumbnail';
        frameEl.innerHTML = `
            <img src="${capture.base64}" alt="Captura ${new Date(capture.timestamp).toLocaleTimeString()}" />
            <div class="frame-info">${new Date(capture.timestamp).toLocaleTimeString()}</div>
            <div class="frame-actions">
                <button class="frame-download" title="Descargar">⬇️</button>
                <button class="frame-delete" title="Eliminar">✕</button>
            </div>
        `;

        // Evento click para descargar
        frameEl.querySelector('.frame-download').addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadFrame(capture);
        });

        // Evento click para eliminar
        frameEl.querySelector('.frame-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            frameEl.remove();
            if (framesList.children.length === 0) {
                capturedFramesDiv.style.display = 'none';
            }
        });

        // Evento click en la imagen para re-analizar
        frameEl.querySelector('img').addEventListener('click', () => {
            console.log('Re-analizando captura guardada...');
            BarcodeScanner.analyzeCapture(capture, true);
        });

        // Agregar al inicio de la lista
        framesList.insertBefore(frameEl, framesList.firstChild);

        // Limitar a 5 capturas visibles
        while (framesList.children.length > 5) {
            framesList.removeChild(framesList.lastChild);
        }

        console.log('📷 Captura agregada a la galería. Total:', framesList.children.length);
    },

    /**
     * Descarga una captura como imagen
     */
    downloadFrame(capture) {
        try {
            const link = document.createElement('a');
            link.href = capture.base64;
            link.download = `frame-${new Date(capture.timestamp).getTime()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            UI.showToast('✅ Frame descargado', 'success');
        } catch (error) {
            console.error('Error descargando frame:', error);
            UI.showToast('Error: ' + error.message, 'error');
        }
    },

    /**
     * Maneja el ingreso manual del código desde la imagen
     */
    async handleManualImageCode() {
        const code = document.getElementById('manualImageCode').value.trim();
        
        if (!code) {
            UI.showToast('Ingrese un código', 'warning');
            return;
        }
        
        console.log('✅ Código ingresado manualmente:', code);
        UI.showToast('Código ingresado: ' + code, 'success');
        UI.showLastScanned(code);
        
        // Buscar y mostrar producto
        await this.searchAndShowProduct(code);
        
        // Limpiar inputs
        document.getElementById('imageInput').value = '';
        document.getElementById('manualImageCode').value = '';
    },

    /**
     * Procesa una imagen desde archivo
     */
    async handleProcessImage() {
        const imageInput = document.getElementById('imageInput');
        
        if (!imageInput || !imageInput.files || imageInput.files.length === 0) {
            UI.showToast('Selecciona una imagen', 'warning');
            return;
        }
        
        const imageFile = imageInput.files[0];
        
        UI.showLoading('Procesando imagen...');
        
        try {
            console.log('📸 Procesando imagen:', imageFile.name);

            if (!BarcodeScanner.codeReader) {
                await BarcodeScanner.init((code, format) => {
                    this.handleCodeDetected(code, format);
                });
            }
            
            // Procesar imagen con timeout de 10 segundos
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout: la imagen tardó demasiado')), 10000)
            );
            
            const code = await Promise.race([
                BarcodeScanner.processImage(imageFile),
                timeoutPromise
            ]);
            
            if (code) {
                console.log('✅ Código detectado en imagen:', code);
                UI.showToast('Código detectado: ' + code, 'success');
                UI.showLastScanned(code);
                
                // Buscar y mostrar producto
                await this.searchAndShowProduct(code);
                
                // Limpiar inputs
                imageInput.value = '';
                document.getElementById('manualImageCode').value = '';
            } else {
                UI.showToast('No se detectó código automáticamente. Ingreselo manualmente.', 'warning');
            }
        } catch (error) {
            console.error('Error procesando imagen:', error);
            UI.showToast('Error: ' + error.message, 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Maneja la detección de un código de barras
     * @param {string} code - Código detectado
     * @param {string} format - Formato del código
     */
    async handleCodeDetected(code, format) {
        if (!code || code.trim() === '') {
            console.warn('Código vacío detectado');
            return;
        }

        console.log('✅ CÓDIGO DETECTADO EN VIVO:', code, 'Formato:', format);

        // Si es texto OCR, mostrar modal para que usuario seleccione
        if (format === 'OCR_TEXT') {
            console.log('📋 Texto OCR leído, mostrando modal de selección...');
            
            // Extraer automáticamente números de 12+ dígitos
            // Buscar primero en el texto si hay un bloque de "CÓDIGO SUGERIDO"
            let defaultSearch = '';
            
            // Buscar línea que contenga "CÓDIGO SUGERIDO" seguida del código
            const suggestedMatch = code.match(/CÓDIGO SUGERIDO[^\n]*\n📌\s*(\d+)/);
            if (suggestedMatch && suggestedMatch[1]) {
                defaultSearch = suggestedMatch[1];
                console.log('⭐ Código sugerido encontrado en OCR:', defaultSearch);
            } else {
                // Si no, buscar cualquier número de 12+ dígitos
                const numberPattern = /\b(\d{12,})\b/g;
                const matches = code.match(numberPattern);
                if (matches && matches.length > 0) {
                    defaultSearch = matches[0].substring(0, 12); // Tomar primeros 12 dígitos
                    console.log('⭐ Número de 12+ dígitos detectado:', defaultSearch);
                }
            }
            
            UI.showOCRSelectionModal(code, (selectedText) => {
                if (selectedText && selectedText.trim() !== '') {
                    // Extraer solo números de la selección
                    const cleanText = selectedText.replace(/[^\d]/g, '');
                    console.log('✅ Usuario confirmó búsqueda con texto:', selectedText);
                    console.log('🔢 Números extraídos:', cleanText);
                    
                    // Usar los números extraídos o el texto limpio
                    const searchCode = cleanText || selectedText;
                    
                    UI.showToast(`🔍 Buscando: ${searchCode}`, 'info');
                    UI.showLastScanned(searchCode);
                    this.searchAndShowProduct(searchCode);
                } else {
                    console.log('❌ Usuario canceló la búsqueda');
                    UI.showToast('Búsqueda cancelada', 'warning');
                }
            }, defaultSearch);
        } else {
            // Para códigos de barras tradicionales, mostrar campo editable
            console.log('🔧 Código de barras detectado, mostrando campo editable...');
            
            // Mostrar el código en un campo editable para que el usuario pueda corregir
            UI.showEditableCodeModal(code, (editedCode) => {
                if (editedCode && editedCode.trim() !== '') {
                    console.log('✅ Usuario confirmó código editado:', editedCode);
                    UI.showToast(`📦 Buscando: ${editedCode}`, 'info');
                    UI.showLastScanned(editedCode);
                    this.searchAndShowProduct(editedCode);
                } else {
                    console.log('❌ Usuario canceló la búsqueda');
                    UI.showToast('Búsqueda cancelada', 'warning');
                }
            }, code);
        }
    },

    /**
     * Maneja la búsqueda manual
     */
    async handleManualSearch() {
        const code = UI.getManualCode();
        
        if (!code) {
            UI.showToast('Ingrese un código', 'warning');
            return;
        }
        
        await this.searchAndShowProduct(code);
        UI.clearManualCode();
    },

    /**
     * Busca un producto y muestra el resultado
     * @param {string} code - Código a buscar
     */
    async searchAndShowProduct(code) {
        UI.showLoading('Buscando producto...');
        
        try {
            // Refrescar datos si es necesario
            const cached = Storage.getCachedData();
            if (!cached) {
                await SheetsAPI.fetchData();
            }
            
            // Buscar producto
            const result = SheetsAPI.findByCode(code);
            
            // Agregar al historial
            Storage.addToHistory({
                code: code,
                found: !!result,
                updated: false,
                product: result ? result.product : null
            });
            
            // Actualizar vista del historial
            this.updateHistoryView();
            
            // Si no encontró, mostrar opción de agregar nuevo
            if (!result) {
                UI.showToast('⚠️ Producto no encontrado. ¿Deseas agregarlo?', 'warning');
                UI.showProductModal(result, code, async (rowIndex, observations) => {
                    if (rowIndex === 'NEW') {
                        // Agregar nuevo producto
                        await this.addNewProduct(code, observations);
                    } else {
                        await this.updateInventory(rowIndex, observations);
                    }
                });
            } else {
                // Mostrar modal con resultado
                UI.showProductModal(result, code, async (rowIndex, observations) => {
                    await this.updateInventory(rowIndex, observations);
                });
                UI.showToast(CONFIG.messages.productFound, 'success');
            }
            
        } catch (error) {
            console.error('Error searching product:', error);
            UI.showToast(CONFIG.messages.connectionError, 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Agrega un nuevo producto al inventario
     * @param {string} code - Código del producto
     * @param {Object} data - Datos del producto
     */
    async addNewProduct(code, data) {
        UI.showLoading('Agregando nuevo producto...');
        
        try {
            await SheetsAPI.addNewRow({
                cod_patrim: code,
                descripcion: data.descripcion || 'Nuevo producto',
                marca: data.marca || '',
                modelo: data.modelo || '',
                color: data.color || '',
                apellidos_nombres: data.apellidos_nombres || '',
                nombre_ofi: data.nombre_ofi || '',
                operator: this.operator
            });
            
            UI.showToast('✅ Producto agregado correctamente', 'success');
            
            // Actualizar caché
            Storage.invalidateCache();
            
            // Refrescar datos
            await SheetsAPI.fetchData();
            
            // Actualizar historial
            this.updateHistoryView();
            
        } catch (error) {
            console.error('Error adding product:', error);
            UI.showToast('❌ Error al agregar producto: ' + error.message, 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Actualiza el estado de inventario de un producto
     * @param {number} rowIndex - Índice de la fila
     * @param {string} observations - Observaciones
     * @param {Array} photos - Fotos capturadas (opcional)
     */
    async updateInventory(rowIndex, observations, photos = []) {
        UI.showLoading('Actualizando inventario...');
        
        try {
            await SheetsAPI.updateInventoryStatus(rowIndex, this.operator, observations);
            
            // Guardar fotos si existen
            if (photos && photos.length > 0) {
                const photoData = {
                    rowIndex: rowIndex,
                    photos: photos,
                    timestamp: new Date().toISOString(),
                    operator: this.operator
                };
                Storage.savePhotos(photoData);
                console.log('📷 Fotos guardadas para el bien:', rowIndex);
            }
            
            // Actualizar último registro del historial
            const history = Storage.getHistory();
            if (history.length > 0) {
                history[0].updated = true;
                history[0].hasPhotos = photos && photos.length > 0;
                Storage.set(CONFIG.storage.keys.history, history);
                this.updateHistoryView();
            }
            
            // Invalidar caché para forzar actualización
            Storage.invalidateCache();
            
            UI.showToast(CONFIG.messages.updateSuccess + (photos && photos.length > 0 ? ` (${photos.length} foto${photos.length > 1 ? 's' : ''} guardada${photos.length > 1 ? 's' : ''})` : ''), 'success');
            UI.closeModal();
            
            // Actualizar estadísticas
            this.refreshStats();
            
        } catch (error) {
            console.error('Error updating inventory:', error);
            UI.showToast(CONFIG.messages.updateError, 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Actualiza la vista del historial
     */
    updateHistoryView() {
        const history = Storage.getHistory();
        UI.updateHistory(history);
    },

    /**
     * Limpia el historial
     */
    clearHistory() {
        if (confirm('¿Está seguro de limpiar el historial?')) {
            Storage.clearHistory();
            this.updateHistoryView();
            UI.showToast('Historial limpiado', 'info');
        }
    },

    /**
     * Exporta el historial
     */
    exportHistory() {
        const exportData = Storage.exportHistory();
        const filename = `inventario_historial_${new Date().toISOString().split('T')[0]}.json`;
        UI.downloadFile(exportData, filename);
        UI.showToast('Historial exportado', 'success');
    },

    /**
     * Refresca las estadísticas
     */
    async refreshStats() {
        UI.showLoading('Actualizando estadísticas...');
        
        try {
            await SheetsAPI.refresh();
            const stats = SheetsAPI.getStats();
            UI.updateStats(stats);
            UI.showToast('Estadísticas actualizadas', 'success');
        } catch (error) {
            console.error('Error refreshing stats:', error);
            // Intentar con datos locales
            const stats = SheetsAPI.getStats();
            UI.updateStats(stats);
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Actualiza la vista de bienes inventariados
     */
    updateInventoriedView() {
        const inventoried = SheetsAPI.getInventoried();
        UI.updateInventoried(inventoried);
        UI.showToast(`${inventoried.length} bienes inventariados`, 'info');
    },

    /**
     * Genera documento Word con los bienes inventariados
     */
    async generateWordReport() {
        // Esperar a que docx esté disponible
        if (!window.docx) {
            await window.docxReady;
        }
        const docx = window.docx;
        
        if (!docx) {
            UI.showToast('⚠️ Error: Librería docx no cargó correctamente. Recarga la página.', 'error');
            console.error('docx not available:', { windowDocx: window.docx, docxReady: window.docxReady });
            return;
        }
        
        const inventoried = SheetsAPI.getInventoried();
        
        if (inventoried.length === 0) {
            UI.showToast('No hay bienes inventariados para generar reporte', 'warning');
            return;
        }
        
        UI.showLoading('Generando documento Word...');
        
        try {
            const cols = CONFIG.sheets.columns;
            const sections = [];
            
            // Agregar una sección por cada bien inventariado
            inventoried.forEach((item, index) => {
                const pageBreak = index > 0 ? [new docx.Paragraph({ text: '', pageBreakBefore: true })] : [];
                
                sections.push(...pageBreak);
                sections.push(new docx.Paragraph({
                    text: 'EVALUACIÓN TÉCNICA DE BIEN PATRIMONIAL',
                    alignment: docx.AlignmentType.CENTER,
                    spacing: { after: 400 },
                    bold: true,
                    size: 28
                }));
                
                sections.push(new docx.Paragraph({
                    text: '',
                    spacing: { after: 200 }
                }));
                
                // Sección de Equipo
                sections.push(new docx.Paragraph({
                    text: '1. EQUIPO:',
                    bold: true,
                    spacing: { before: 200, after: 200 }
                }));
                
                const equipoInfo = [
                    ['Tipo:', item[cols.descripcion_denominacion] || '-'],
                    ['Marca:', item[cols.marca] || '-'],
                    ['Modelo:', item[cols.modelo] || '-'],
                    ['Código Patrimonial:', item[cols.cod_patrim] || '-'],
                    ['Serie:', item[cols.color] || '-']
                ];
                
                equipoInfo.forEach(([label, value]) => {
                    sections.push(new docx.Table({
                        rows: [
                            new docx.TableRow({
                                children: [
                                    new docx.TableCell({
                                        children: [new docx.Paragraph({ text: label, bold: true })],
                                        width: { size: 30, type: docx.WidthType.PERCENTAGE }
                                    }),
                                    new docx.TableCell({
                                        children: [new docx.Paragraph({ text: String(value) })],
                                        width: { size: 70, type: docx.WidthType.PERCENTAGE }
                                    })
                                ]
                            })
                        ],
                        width: { size: 100, type: docx.WidthType.PERCENTAGE }
                    }));
                });
                
                sections.push(new docx.Paragraph({
                    text: '',
                    spacing: { after: 200 }
                }));
                
                // Sección de Evaluación Técnica
                sections.push(new docx.Paragraph({
                    text: '2. EVALUACIÓN TÉCNICA:',
                    bold: true,
                    spacing: { before: 200, after: 200 }
                }));
                
                sections.push(new docx.Paragraph({
                    text: 'Durante el inventario se realizó la inspección visual del equipo, determinándose que presenta fallas propias de su antigüedad y desgaste por uso continuo. Asimismo, se constató que el bien ha cumplido su vida útil (más de 5 años de antigüedad), evidenciando deterioro irreversible.',
                    spacing: { after: 200 },
                    alignment: docx.AlignmentType.JUSTIFIED
                }));
                
                // Sección de Conclusión Técnica
                sections.push(new docx.Paragraph({
                    text: '3. CONCLUSIÓN TÉCNICA:',
                    bold: true,
                    spacing: { before: 200, after: 200 }
                }));
                
                sections.push(new docx.Paragraph({
                    text: 'Equipo físicamente deteriorado, inoperativo y no apto para su utilización.',
                    spacing: { after: 200 },
                    alignment: docx.AlignmentType.JUSTIFIED
                }));
                
                // Sección de Recomendación Técnica
                sections.push(new docx.Paragraph({
                    text: '4. RECOMENDACIÓN TÉCNICA:',
                    bold: true,
                    spacing: { before: 200, after: 200 }
                }));
                
                sections.push(new docx.Paragraph({
                    text: 'Proceder con la baja patrimonial del equipo evaluado, debido a que la reparación no resulta técnica ni económicamente viable, recomendándose su disposición final conforme a la normativa institucional vigente.',
                    spacing: { after: 200 },
                    alignment: docx.AlignmentType.JUSTIFIED
                }));
                
                sections.push(new docx.Paragraph({
                    text: '',
                    spacing: { after: 200 }
                }));
                
                // Pie de página con datos de registro
                sections.push(new docx.Paragraph({
                    text: `Registrado por: ${item[cols.registrado_por] || '-'} | Fecha: ${item[cols.f_registro] || '-'}`,
                    spacing: { before: 400 },
                    size: 18,
                    color: '666666',
                    alignment: docx.AlignmentType.CENTER
                }));
            });
            
            // Crear documento
            const doc = new docx.Document({
                sections: [{
                    children: sections
                }]
            });
            
            // Descargar documento
            docx.Packer.toBlob(doc).then(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `Evaluacion_Tecnica_${new Date().toISOString().split('T')[0]}.docx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                UI.hideLoading();
                UI.showToast(`✅ Documento generado: ${inventoried.length} equipos`, 'success');
            });
            
        } catch (error) {
            console.error('Error generating report:', error);
            UI.hideLoading();
            UI.showToast('❌ Error al generar documento: ' + error.message, 'error');
        }
    },

    /**
     * Exporta bienes inventariados a CSV
     */
    exportInventoried() {
        const inventoried = SheetsAPI.getInventoried();
        
        if (inventoried.length === 0) {
            UI.showToast('No hay bienes inventariados para exportar', 'warning');
            return;
        }
        
        try {
            const cols = CONFIG.sheets.columns;
            
            // Headers del CSV
            const headers = [
                'Código Patrimonial',
                'Descripción',
                'Marca',
                'Modelo',
                'Estado de Conservación',
                'Fecha de Inventario',
                'Registrado por',
                'Local',
                'Oficina'
            ];
            
            // Datos del CSV
            const rows = inventoried.map(item => [
                item[cols.cod_patrim] || '-',
                item[cols.descripcion_denominacion] || '-',
                item[cols.marca] || '-',
                item[cols.modelo] || '-',
                item[cols.estado_conserv] || '-',
                item[cols.f_registro] || '-',
                item[cols.registrado_por] || '-',
                item[cols.nombre_local] || '-',
                item[cols.nombre_ofi] || '-'
            ]);
            
            // Convertir a CSV
            let csvContent = headers.join(',') + '\n';
            rows.forEach(row => {
                const sanitizedRow = row.map(cell => {
                    // Envolver en comillas si contiene comas o comillas
                    return '"' + String(cell).replace(/"/g, '""') + '"';
                });
                csvContent += sanitizedRow.join(',') + '\n';
            });
            
            // Agregar BOM para UTF-8 (Excel lo reconoce correctamente)
            const BOM = '\uFEFF';
            const csvWithBOM = BOM + csvContent;
            
            // Descargar CSV
            const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Inventoriados_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            UI.showToast(`✅ ${inventoried.length} registros exportados a CSV`, 'success');
            
        } catch (error) {
            console.error('Error exporting CSV:', error);
            UI.showToast('❌ Error al exportar: ' + error.message, 'error');
        }
    },

    /**
     * Cierra sesión
     */
    logout() {
        this.stopScanner();
        Storage.clear();
        this.operator = null;
        this.isConnected = false;
        UI.showLogin();
        UI.showToast('Sesión cerrada', 'info');
    }
};

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker registrado:', registration);
            })
            .catch(error => {
                console.log('Error registrando Service Worker:', error);
            });
    });
}
