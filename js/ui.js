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
        
        // Mostrar botón de captura de frames si está disponible
        if (this.elements.btnCaptureFrame) {
            this.elements.btnCaptureFrame.classList.toggle('hidden', !isScanning);
        }
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
                        <div class="icon">✅</div>
                        <p>Este bien ya fue registrado</p>
                        <small>Por: ${product.registrado_por} - ${product.f_registro}</small>
                    </div>
                ` : ''}
                
                <div class="product-info">
                    <h3 style="color: var(--accent-cyan); margin-bottom: 1rem;">🏢 Información del Local</h3>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Nombre del Local:</span>
                        <span class="product-detail-value">${product.nombre_local || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Dirección:</span>
                        <span class="product-detail-value">${product.direccion_local || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Bloque:</span>
                        <span class="product-detail-value">${product.bloque || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Piso:</span>
                        <span class="product-detail-value">${product.piso || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Ambiente:</span>
                        <span class="product-detail-value">${product.ambiente || '-'}</span>
                    </div>
                    
                    <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-light);">
                    
                    <h3 style="color: var(--accent-emerald); margin-bottom: 1rem; margin-top: 1rem;">👤 Información de la Persona</h3>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Apellidos y Nombres:</span>
                        <span class="product-detail-value">${product.apellidos_nombres || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Oficina:</span>
                        <span class="product-detail-value">${product.nombre_ofi || '-'}</span>
                    </div>
                    
                    <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-light);">
                    
                    <h3 style="color: var(--accent-purple); margin-bottom: 1rem; margin-top: 1rem;">📦 Descripción del Bien</h3>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Descripción/Denominación:</span>
                        <span class="product-detail-value">${product.descripcion_denominacion || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Marca:</span>
                        <span class="product-detail-value">${product.marca || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Modelo:</span>
                        <span class="product-detail-value">${product.modelo || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Color:</span>
                        <span class="product-detail-value">${product.color || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Estado de Conservación:</span>
                        <span class="product-detail-value">${product.estado_conserv || '-'}</span>
                    </div>
                    
                    <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-light);">
                    
                    <h3 style="color: var(--warning-color); margin-bottom: 1rem; margin-top: 1rem;">🔖 Información de Codificación</h3>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Código de Patrimonio:</span>
                        <span class="product-detail-value" style="font-weight: bold; color: var(--accent-cyan);">${product.cod_patrim || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Código Inventario:</span>
                        <span class="product-detail-value">${product.cod_inv || '-'}</span>
                    </div>
                    
                    <div class="product-detail">
                        <span class="product-detail-label">Código M:</span>
                        <span class="product-detail-value">${product.cod_m || '-'}</span>
                    </div>
                    
                    ${product.fecha_inv ? `
                        <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-light);">
                        
                        <h3 style="color: var(--success-color); margin-bottom: 1rem; margin-top: 1rem;">📋 Información Adicional</h3>
                        
                        <div class="product-detail">
                            <span class="product-detail-label">Fecha de Inventario:</span>
                            <span class="product-detail-value">${product.fecha_inv || '-'}</span>
                        </div>
                        
                        ${product.usuario ? `
                            <div class="product-detail">
                                <span class="product-detail-label">Usuario:</span>
                                <span class="product-detail-value">${product.usuario || '-'}</span>
                            </div>
                        ` : ''}
                        
                        ${product.digitador ? `
                            <div class="product-detail">
                                <span class="product-detail-label">Digitador:</span>
                                <span class="product-detail-value">${product.digitador || '-'}</span>
                            </div>
                        ` : ''}
                    ` : ''}
                </div>
                
                <div class="inventory-actions">
                    <h4>📝 ¿Desea Registrar este Bien en el Inventario?</h4>
                    <button id="btnMarkInventoried" class="btn btn-success btn-block">
                        ✅ ${isInventoried ? 'Actualizar Registro' : 'Sí, Registrar Bien'}
                    </button>
                    <button id="btnCancelRegistration" class="btn btn-secondary btn-block" style="margin-top: 0.5rem;">
                        ❌ No, Cancelar
                    </button>
                </div>
            `;
        } else {
            html = `
                <div class="product-not-found">
                    <div class="icon">❌</div>
                    <h3>Bien No Encontrado</h3>
                    <p>El código de patrimonio <strong>${code}</strong> no existe en el inventario.</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                        Verifique que el código sea correcto o agregue el bien al inventario en Google Sheets.
                    </p>
                </div>
            `;
        }
        
        this.elements.modalBody.innerHTML = html;
        this.elements.resultModal.classList.remove('hidden');
        
        // Configurar evento de actualización
        if (result) {
            const btnUpdate = document.getElementById('btnMarkInventoried');
            const btnCancel = document.getElementById('btnCancelRegistration');
            
            btnUpdate.addEventListener('click', () => {
                onUpdate(result.rowIndex, '');
                this.closeModal();
            });
            
            btnCancel.addEventListener('click', () => {
                this.closeModal();
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
        // Obtener valores o usar defaults
        const operatorInput = document.getElementById('operatorName');
        const sheetUrlInput = document.getElementById('sheetUrl');
        const sheetNameInput = document.getElementById('sheetName');
        const webAppUrlInput = document.getElementById('webAppUrl');
        
        return {
            operator: operatorInput ? operatorInput.value.trim() : '',
            sheetUrl: (sheetUrlInput && sheetUrlInput.value.trim()) || CONFIG.defaults.sheetUrl,
            sheetName: (sheetNameInput && sheetNameInput.value.trim()) || CONFIG.defaults.sheetName,
            webAppUrl: (webAppUrlInput && webAppUrlInput.value.trim()) || CONFIG.defaults.webAppUrl
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
    },

    /**
     * Muestra modal con texto OCR leído para que usuario seleccione
     * @param {string} ocrText - Texto leído por OCR
     * @param {function} onConfirm - Callback cuando usuario confirma selección
     * @param {string} suggestedCode - Código sugerido (si se detectó de 12 dígitos)
     */
    showOCRSelectionModal(ocrText, onConfirm, suggestedCode = '') {
        // Crear modal si no existe
        let modal = document.getElementById('ocrSelectionModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ocrSelectionModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content ocr-selection">
                    <div class="modal-header">
                        <h3>📋 Texto OCR Leído</h3>
                        <button class="modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="ocr-instruction">Selecciona el código que deseas buscar:</p>
                        ${suggestedCode ? `
                            <div class="ocr-suggested-code">
                                <strong>⭐ Código sugerido (12 dígitos):</strong>
                                <div class="suggested-code-display">${suggestedCode}</div>
                                <small>Haz clic en "Buscar Seleccionado" para usar este código</small>
                            </div>
                        ` : ''}
                        <div class="ocr-text-container">
                            <textarea id="ocrTextArea" class="ocr-text-area" readonly></textarea>
                        </div>
                        <div class="ocr-selection-info">
                            <small id="selectionCharCount">Caracteres seleccionados: 0</small>
                        </div>
                        <div class="ocr-buttons">
                            <button id="ocrCopyBtn" class="btn btn-secondary">
                                📋 Copiar Todo
                            </button>
                            <button id="ocrClearBtn" class="btn btn-secondary">
                                🔄 Limpiar Selección
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="ocrCancelBtn" class="btn btn-secondary">
                            ❌ Cancelar
                        </button>
                        <button id="ocrConfirmBtn" class="btn btn-primary">
                            ✅ Buscar Seleccionado
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Actualizar texto OCR
        const textArea = document.getElementById('ocrTextArea');
        
        // Si hay código sugerido, establecer como valor por defecto
        if (suggestedCode) {
            textArea.value = ocrText;
            // Pre-seleccionar el código sugerido en el área de texto
            setTimeout(() => {
                const startPos = ocrText.indexOf(suggestedCode);
                if (startPos !== -1) {
                    textArea.setSelectionRange(startPos, startPos + suggestedCode.length);
                }
            }, 0);
        } else {
            textArea.value = ocrText;
            textArea.focus();
            textArea.select();
        }

        // Elementos de control
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('ocrCancelBtn');
        const confirmBtn = document.getElementById('ocrConfirmBtn');
        const copyBtn = document.getElementById('ocrCopyBtn');
        const clearBtn = document.getElementById('ocrClearBtn');
        const selectionInfo = document.getElementById('selectionCharCount');

        // Actualizar contador de selección
        const updateSelectionInfo = () => {
            const selected = textArea.value.substring(
                textArea.selectionStart,
                textArea.selectionEnd
            );
            selectionInfo.textContent = `Caracteres seleccionados: ${selected.length}`;
        };

        // Event listeners para actualizar contador
        textArea.addEventListener('mouseup', updateSelectionInfo);
        textArea.addEventListener('keyup', updateSelectionInfo);
        textArea.addEventListener('select', updateSelectionInfo);

        // Copiar texto completo
        copyBtn.onclick = () => {
            textArea.select();
            document.execCommand('copy');
            this.showToast('✅ Texto copiado al portapapeles', 'success');
            updateSelectionInfo();
        };

        // Limpiar selección
        clearBtn.onclick = () => {
            textArea.setSelectionRange(0, 0);
            updateSelectionInfo();
        };

        // Confirmar búsqueda
        confirmBtn.onclick = () => {
            const selected = textArea.value.substring(
                textArea.selectionStart,
                textArea.selectionEnd
            );
            const searchText = selected.trim() || textArea.value.trim();
            
            if (searchText) {
                modal.style.display = 'none';
                onConfirm(searchText);
            } else {
                this.showToast('⚠️ Selecciona o copia el texto que deseas buscar', 'warning');
            }
        };

        // Cancelar
        const closeModal = () => {
            modal.style.display = 'none';
            onConfirm(null);
        };

        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;

        // Cerrar al hacer click fuera del modal
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };

        // Mostrar modal
        modal.style.display = 'flex';
        updateSelectionInfo();
    }
};
