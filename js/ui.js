/**
 * Módulo de interfaz de usuario
 * Maneja todas las interacciones con el DOM
 */
const UI = {
    // Referencias a elementos del DOM
    elements: {},

    /**
     * Inicializa las referencias a elementos del DOM
     */
    init() {
        this.elements = {
            // Secciones
            loginSection: document.getElementById('loginSection'),
            mainSection: document.getElementById('mainSection'),
            
            // Login
            operatorName: document.getElementById('operatorName'),
            sheetUrl: document.getElementById('sheetUrl') || null,
            sheetName: document.getElementById('sheetName') || null,
            webAppUrl: document.getElementById('webAppUrl') || null,
            btnConnect: document.getElementById('btnConnect'),
            userName: document.getElementById('userName'),
            
            // Tabs
            tabs: document.querySelectorAll('.tab'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            // Scanner
            video: document.getElementById('video'),
            btnStartScan: document.getElementById('btnStartScan'),
            btnStopScan: document.getElementById('btnStopScan'),
            btnSwitchCamera: document.getElementById('btnSwitchCamera'),
            lastScanned: document.getElementById('lastScanned'),
            lastCode: document.getElementById('lastCode'),
            
            // Manual
            manualCode: document.getElementById('manualCode'),
            btnManualSearch: document.getElementById('btnManualSearch'),
            
            // History
            historyList: document.getElementById('historyList'),
            btnClearHistory: document.getElementById('btnClearHistory'),
            btnExportHistory: document.getElementById('btnExportHistory'),
            
            // Stats
            statTotal: document.getElementById('statTotal'),
            statInventoried: document.getElementById('statInventoried'),
            statPending: document.getElementById('statPending'),
            statToday: document.getElementById('statToday'),
            btnRefreshStats: document.getElementById('btnRefreshStats'),
            
            // Modal
            resultModal: document.getElementById('resultModal'),
            modalBody: document.getElementById('modalBody'),
            closeModal: document.querySelector('.close-modal'),
            
            // Otros
            toastContainer: document.getElementById('toastContainer'),
            loadingOverlay: document.getElementById('loadingOverlay')
        };
    },

    /**
     * Muestra la pantalla de login
     */
    showLogin() {
        this.elements.loginSection.classList.remove('hidden');
        this.elements.mainSection.classList.add('hidden');
    },

    /**
     * Muestra la pantalla principal
     * @param {string} operatorName - Nombre del operador
     */
    showMain(operatorName) {
        this.elements.loginSection.classList.add('hidden');
        this.elements.mainSection.classList.remove('hidden');
        this.elements.userName.textContent = `👤 ${operatorName}`;
    },

    /**
     * Cambia la pestaña activa
     * @param {string} tabName - Nombre de la pestaña
     */
    switchTab(tabName) {
        // Desactivar todas las pestañas
        this.elements.tabs.forEach(tab => tab.classList.remove('active'));
        this.elements.tabContents.forEach(content => content.classList.add('hidden'));
        
        // Activar la pestaña seleccionada
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    },

    /**
     * Actualiza los controles del escáner
     * @param {boolean} isScanning - true si está escaneando
     */
    updateScannerControls(isScanning) {
        this.elements.btnStartScan.classList.toggle('hidden', isScanning);
        this.elements.btnStopScan.classList.toggle('hidden', !isScanning);
        this.elements.btnSwitchCamera.classList.toggle('hidden', !isScanning);
    },

    /**
     * Muestra el último código escaneado
     * @param {string} code - Código escaneado
     */
    showLastScanned(code) {
        this.elements.lastCode.textContent = code;
        this.elements.lastScanned.classList.remove('hidden');
    },

    /**
     * Muestra el modal con información del producto
     * @param {Object|null} result - Resultado de la búsqueda
     * @param {string} code - Código buscado
     * @param {Function} onUpdate - Callback para actualizar inventario
     */
    showProductModal(result, code, onUpdate) {
        let html = '';
        
        if (result) {
            const product = result.product;
            const isInventoried = product.inventariado && product.inventariado.toUpperCase() === 'SI';
            
            html = `
                ${isInventoried ? `
                    <div class="already-inventoried">
                        <div class="icon">⚠️</div>
                        <p>Este producto ya fue inventariado</p>
                        <small>Por: ${product.realizadoPor} - ${product.fechaInventario}</small>
                    </div>
                ` : ''}
                
                <div class="product-info">
                    <h3>📦 ${product.descripcion || 'Sin descripción'}</h3>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Código:</span>
                        <span class="product-detail-value">${product.codigo}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Categoría:</span>
                        <span class="product-detail-value">${product.categoria || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Ubicación:</span>
                        <span class="product-detail-value">${product.ubicacion || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Cantidad:</span>
                        <span class="product-detail-value">${product.cantidad || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Estado:</span>
                        <span class="product-detail-value">${isInventoried ? '✅ Inventariado' : '⏳ Pendiente'}</span>
                    </div>
                </div>
                
                <div class="inventory-actions">
                    <h4>📝 Marcar como Inventariado</h4>
                    <div class="form-group">
                        <label for="modalObservations">Observaciones (opcional):</label>
                        <textarea id="modalObservations" rows="2" placeholder="Ingrese observaciones..."></textarea>
                    </div>
                    <button id="btnMarkInventoried" class="btn btn-success btn-block">
                        ✅ ${isInventoried ? 'Actualizar Inventario' : 'Marcar Inventariado'}
                    </button>
                    <a href="${SheetsAPI.getEditUrl(result.rowIndex)}" target="_blank" class="btn btn-secondary btn-block" style="margin-top: 0.5rem;">
                        📝 Editar en Google Sheets
                    </a>
                </div>
            `;
        } else {
            html = `
                <div class="product-not-found">
                    <div class="icon">❌</div>
                    <h3>Producto No Encontrado</h3>
                    <p>El código <strong>${code}</strong> no existe en la base de datos.</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                        Verifique que el código sea correcto o agregue el producto al inventario en Google Sheets.
                    </p>
                </div>
            `;
        }
        
        this.elements.modalBody.innerHTML = html;
        this.elements.resultModal.classList.remove('hidden');
        
        // Configurar evento de actualización
        if (result) {
            const btnUpdate = document.getElementById('btnMarkInventoried');
            btnUpdate.addEventListener('click', () => {
                const observations = document.getElementById('modalObservations').value;
                onUpdate(result.rowIndex, observations);
            });
        }
    },

    /**
     * Cierra el modal
     */
    closeModal() {
        this.elements.resultModal.classList.add('hidden');
    },

    /**
     * Actualiza el historial de escaneos
     * @param {Array} history - Lista de escaneos
     */
    updateHistory(history) {
        if (history.length === 0) {
            this.elements.historyList.innerHTML = '<p class="empty-message">No hay escaneos realizados</p>';
            return;
        }
        
        const html = history.map(item => {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            
            let statusClass = 'status-not-found';
            let statusText = 'No encontrado';
            
            if (item.found) {
                statusClass = item.updated ? 'status-updated' : 'status-found';
                statusText = item.updated ? 'Actualizado' : 'Encontrado';
            }
            
            return `
                <div class="history-item">
                    <div class="history-item-info">
                        <div class="history-item-code">${item.code}</div>
                        <div class="history-item-time">${dateStr} ${timeStr}</div>
                    </div>
                    <span class="history-item-status ${statusClass}">${statusText}</span>
                </div>
            `;
        }).join('');
        
        this.elements.historyList.innerHTML = html;
    },

    /**
     * Actualiza las estadísticas
     * @param {Object} stats - Objeto con estadísticas
     */
    updateStats(stats) {
        this.elements.statTotal.textContent = stats.total;
        this.elements.statInventoried.textContent = stats.inventoried;
        this.elements.statPending.textContent = stats.pending;
        this.elements.statToday.textContent = stats.today;
    },

    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de toast (success, error, warning, info)
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Auto-remover después del tiempo configurado
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, CONFIG.notifications.toastDuration);
    },

    /**
     * Muestra el overlay de carga
     * @param {string} message - Mensaje opcional
     */
    showLoading(message = 'Procesando...') {
        this.elements.loadingOverlay.querySelector('p').textContent = message;
        this.elements.loadingOverlay.classList.remove('hidden');
    },

    /**
     * Oculta el overlay de carga
     */
    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
    },

    /**
     * Rellena el formulario de login con datos guardados
     * @param {Object} savedData - Datos guardados
     */
    fillLoginForm(savedData) {
        if (savedData.operator && this.elements.operatorName) {
            this.elements.operatorName.value = savedData.operator;
        }
        // Los campos de sheetUrl, sheetName y webAppUrl no existen en el nuevo formulario
        // Se usan valores por defecto en su lugar
    },

    /**
     * Obtiene los valores del formulario de login
     * @returns {Object} Valores del formulario
     */
    getLoginFormValues() {
        return {
            operator: this.elements.operatorName.value.trim(),
            sheetUrl: '', // Usar valor por defecto
            sheetName: '', // Usar valor por defecto
            webAppUrl: '' // Usar valor por defecto
        };
    },

    /**
     * Obtiene el código manual ingresado
     * @returns {string} Código ingresado
     */
    getManualCode() {
        return this.elements.manualCode.value.trim();
    },

    /**
     * Limpia el campo de código manual
     */
    clearManualCode() {
        this.elements.manualCode.value = '';
    },

    /**
     * Descarga un archivo
     * @param {string} content - Contenido del archivo
     * @param {string} filename - Nombre del archivo
     * @param {string} type - Tipo MIME
     */
    downloadFile(content, filename, type = 'application/json') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
