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
            await SheetsAPI.init(data.sheetUrl, data.sheetName);
            
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
            UI.showToast('Conectado correctamente', 'success');
            
            // Actualizar estadísticas
            this.refreshStats();
            
        } catch (error) {
            console.error('Error connecting:', error);
            UI.showToast(error.message || CONFIG.messages.connectionError, 'error');
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
        UI.showToast(`📦 Código detectado: ${code}`, 'info');
        UI.showLastScanned(code);
        
        // Buscar producto
        await this.searchAndShowProduct(code);
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
            
            // Mostrar modal con resultado
            UI.showProductModal(result, code, (rowIndex, observations) => {
                this.updateInventory(rowIndex, observations);
            });
            
            // Mostrar toast
            if (result) {
                UI.showToast(CONFIG.messages.productFound, 'success');
            } else {
                UI.showToast(CONFIG.messages.productNotFound, 'warning');
            }
            
        } catch (error) {
            console.error('Error searching product:', error);
            UI.showToast(CONFIG.messages.connectionError, 'error');
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Actualiza el estado de inventario de un producto
     * @param {number} rowIndex - Índice de la fila
     * @param {string} observations - Observaciones
     */
    async updateInventory(rowIndex, observations) {
        UI.showLoading('Actualizando inventario...');
        
        try {
            await SheetsAPI.updateInventoryStatus(rowIndex, this.operator, observations);
            
            // Actualizar último registro del historial
            const history = Storage.getHistory();
            if (history.length > 0) {
                history[0].updated = true;
                Storage.set(CONFIG.storage.keys.history, history);
                this.updateHistoryView();
            }
            
            // Invalidar caché para forzar actualización
            Storage.invalidateCache();
            
            UI.showToast(CONFIG.messages.updateSuccess, 'success');
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
