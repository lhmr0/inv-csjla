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
            
            // Inventoried
            inventoriedList: document.getElementById('inventoriedList'),
            btnRefreshInventoried: document.getElementById('btnRefreshInventoried'),
            btnGenerateReport: document.getElementById('btnGenerateReport'),
            btnExportInventorieds: document.getElementById('btnExportInventorieds'),
            
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
     * Muestra el último código escaneado con botón de búsqueda
     * @param {string} code - Código escaneado
     */
    showLastScanned(code) {
        // Mostrar código en span
        this.elements.lastCode.textContent = code;
        
        // Mostrar y configurar botón de lupa
        const btnSearch = document.getElementById('btnSearchLastCode');
        if (btnSearch) {
            btnSearch.style.display = 'inline-block';
            btnSearch.onclick = () => {
                // Guardar referencia de código para buscar
                window.lastCodeToSearch = code;
                // Disparar evento para que app pueda capturarlo
                const event = new CustomEvent('searchLastCode', { detail: { code } });
                document.dispatchEvent(event);
            };
        }
        
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
            
            // Información esencial para mostrar rápidamente
            html = `
                ${isInventoried ? `
                    <div class="already-inventoried">
                        <div class="icon">✅</div>
                        <p>Este bien ya fue registrado</p>
                        <small>Por: ${product.registrado_por} - ${product.f_registro}</small>
                    </div>
                ` : ''}
                
                <div class="product-info">
                    <!-- Información Esencial (Carga Inmediata) -->
                    <div class="product-essential-info">
                        <h3 style="color: var(--accent-purple); margin-bottom: 1rem;">📦 Descripción del Bien</h3>
                        
                        <div class="product-detail">
                            <span class="product-detail-label">Descripción/Denominación:</span>
                            <span class="product-detail-value">${product.descripcion_denominacion || '-'}</span>
                        </div>
                        
                        <div class="product-detail">
                            <span class="product-detail-label">Código de Patrimonio:</span>
                            <span class="product-detail-value" style="font-weight: bold; color: var(--accent-cyan);">${product.cod_patrim || '-'}</span>
                        </div>
                        
                        <div class="product-detail">
                            <span class="product-detail-label">Marca:</span>
                            <span class="product-detail-value">${product.marca || '-'}</span>
                        </div>
                        
                        <div class="product-detail">
                            <span class="product-detail-label">Modelo:</span>
                            <span class="product-detail-value">${product.modelo || '-'}</span>
                        </div>
                    </div>
                    
                    <!-- Información Completa (Lazy Load) -->
                    <div class="product-detailed-info" id="detailedInfo" style="display: none; margin-top: 1.5rem;">
                        <div class="product-detail">
                            <span class="product-detail-label">Color:</span>
                            <span class="product-detail-value">${product.color || '-'}</span>
                        </div>
                        
                        <div class="product-detail">
                            <span class="product-detail-label">Estado de Conservación:</span>
                            <span class="product-detail-value">${product.estado_conserv || '-'}</span>
                        </div>
                        
                        <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border-light);">
                        
                        <h3 style="color: var(--accent-cyan); margin-bottom: 1rem; margin-top: 1rem;">🏢 Información del Local</h3>
                        
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
                        
                        <h3 style="color: var(--warning-color); margin-bottom: 1rem; margin-top: 1rem;">🔖 Información de Codificación</h3>
                        
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
                    
                    <!-- Botón para ver más detalles -->
                    <button id="btnToggleDetails" class="btn btn-secondary btn-small" style="width: 100%; margin-top: 1rem;">
                        📋 Ver Más Detalles
                    </button>
                </div>
                
                <div class="inventory-actions">
                    <h4>� Capturar Fotos del Bien (Opcional - Máximo 2)</h4>
                    <div id="productPhotos" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.5rem; margin-bottom: 1rem; min-height: 100px;">
                        <div style="border: 2px dashed var(--border-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: var(--background-secondary);" id="btnAddPhoto">
                            <span style="text-align: center;">
                                <div style="font-size: 2rem;">📷</div>
                                <small style="color: var(--text-secondary);">Agregar foto</small>
                            </span>
                        </div>
                    </div>
                    <input type="file" id="photoInput" accept="image/*" style="display: none;">
                    <small style="color: var(--text-secondary); display: block; margin-bottom: 1rem;">Nota: Las fotos se guardarán localmente con los datos del inventario</small>
                    
                    <h4 style="margin-top: 1.5rem;">�📝 ¿Desea Registrar este Bien en el Inventario?</h4>
                    <button id="btnMarkInventoried" class="btn btn-success btn-block">
                        ✅ ${isInventoried ? 'Actualizar Registro' : 'Sí, Registrar Bien'}
                    </button>                    <button id="btnSendPhotosToGoogleDrive" class="btn btn-info btn-block" style="margin-top: 0.5rem;">
                        📤 Enviar Fotos a Google Drive
                    </button>                    <button id="btnCancelRegistration" class="btn btn-secondary btn-block" style="margin-top: 0.5rem;">
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
                        ¿Deseas agregarlo como un nuevo bien?
                    </p>
                    <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem;">
                        <button id="btnAddNewProduct" class="btn btn-primary btn-block">
                            ➕ Agregar Como Nuevo Bien
                        </button>
                        <button id="btnCancelSearch" class="btn btn-secondary btn-block">
                            ❌ Cancelar
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.elements.modalBody.innerHTML = html;
        this.elements.resultModal.classList.remove('hidden');
        
        // Agregar evento para botón de "Ver Más Detalles" si el producto fue encontrado
        if (result) {
            const btnToggleDetails = document.getElementById('btnToggleDetails');
            const detailedInfo = document.getElementById('detailedInfo');
            
            if (btnToggleDetails && detailedInfo) {
                let detailsShown = false;
                btnToggleDetails.addEventListener('click', () => {
                    detailsShown = !detailsShown;
                    detailedInfo.style.display = detailsShown ? 'block' : 'none';
                    btnToggleDetails.textContent = detailsShown ? '📋 Ocultar Detalles' : '📋 Ver Más Detalles';
                });
            }
        }
        
        // Configurar eventos de fotos
        if (result) {
            const btnAddPhoto = document.getElementById('btnAddPhoto');
            const photoInput = document.getElementById('photoInput');
            const photosContainer = document.getElementById('productPhotos');
            let photos = [];
            
            if (btnAddPhoto) {
                btnAddPhoto.addEventListener('click', () => {
                    photoInput.click();
                });
                
                photoInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0 && photos.length < 2) {
                        const file = e.target.files[0];
                        const reader = new FileReader();
                        
                        reader.onload = (event) => {
                            const photoData = {
                                data: event.target.result,
                                timestamp: new Date().toISOString(),
                                code: code
                            };
                            photos.push(photoData);
                            
                            // Actualizar referencia global y visibilidad del botón
                            window.currentProductPhotos = photos;
                            UI.updateDriveButtonVisibility();
                            console.log(`📸 Foto capturada (${window.currentProductPhotos.length}/2)`);
                            
                            // Renderizar foto
                            const photoEl = document.createElement('div');
                            photoEl.style.position = 'relative';
                            photoEl.innerHTML = `
                                <img src="${event.target.result}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-light);">
                                <button class="btn btn-danger btn-small" style="position: absolute; top: 4px; right: 4px; width: 30px; height: 30px; padding: 0; font-size: 0.8rem;">✕</button>
                            `;
                            
                            photoEl.querySelector('button').addEventListener('click', () => {
                                photos = photos.filter((_, i) => i !== Array.from(photosContainer.children).indexOf(photoEl));
                                photoEl.remove();
                                
                                // Actualizar referencia global al eliminar foto
                                window.currentProductPhotos = photos;
                                UI.updateDriveButtonVisibility();
                                console.log(`🗑️ Foto eliminada (${window.currentProductPhotos.length}/2)`);
                                
                                if (photos.length === 0) {
                                    btnAddPhoto.style.display = 'flex';
                                }
                                if (photos.length < 2) {
                                    btnAddPhoto.style.display = 'flex';
                                }
                            });
                            
                            photosContainer.insertBefore(photoEl, btnAddPhoto);
                            
                            if (photos.length >= 2) {
                                btnAddPhoto.style.display = 'none';
                            }
                        };
                        
                        reader.readAsDataURL(file);
                        photoInput.value = '';
                    } else if (photos.length >= 2) {
                        alert('Máximo 2 fotos permitidas');
                        photoInput.value = '';
                    }
                });
            }
            
            // Guardar fotos en objeto para uso posterior
            window.currentProductPhotos = photos;
            
            // Actualizar visibilidad del botón de Drive
            this.updateDriveButtonVisibility();
        }
        
        // Configurar evento de actualización
        if (result) {
            const btnUpdate = document.getElementById('btnMarkInventoried');
            const btnCancel = document.getElementById('btnCancelRegistration');
            const btnSendDrive = document.getElementById('btnSendPhotosToGoogleDrive');
            
            btnUpdate.addEventListener('click', () => {
                onUpdate(result.rowIndex, '', window.currentProductPhotos || []);
                this.closeModal();
            });
            
            // Botón para enviar fotos a Drive
            if (btnSendDrive) {
                btnSendDrive.addEventListener('click', () => {
                    App.sendPhotosToGoogleDrive();
                });
                // Actualizar visibilidad inicial
                this.updateDriveButtonVisibility();
            }
            
            btnCancel.addEventListener('click', () => {
                this.closeModal();
            });
        } else {
            // Cuando no se encuentra, mostrar opción de agregar
            const btnAddNew = document.getElementById('btnAddNewProduct');
            const btnCancel = document.getElementById('btnCancelSearch');
            
            btnAddNew.addEventListener('click', () => {
                this.closeModal();
                // Mostrar modal para agregar nuevo producto
                this.showAddNewProductModal(code, (rowIndex, data) => {
                    if (rowIndex === 'NEW' && data) {
                        onUpdate('NEW', data);
                    }
                });
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
     * Actualiza la visibilidad del botón de Google Drive
     * Se muestra solo si hay fotos capturadas
     */
    updateDriveButtonVisibility() {
        const btnSendDrive = document.getElementById('btnSendPhotosToGoogleDrive');
        if (btnSendDrive) {
            const hasPhotos = (window.currentProductPhotos?.length || 0) > 0;
            if (hasPhotos) {
                btnSendDrive.style.display = 'block';
                console.log(`📤 Botón Drive ahora visible (${window.currentProductPhotos.length} fotos capturadas)`);
            } else {
                btnSendDrive.style.display = 'none';
                console.log('📤 Botón Drive oculto (sin fotos capturadas)');
            }
        }
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
     * Actualiza la lista de bienes inventariados
     * @param {Array} inventoried - Lista de bienes inventariados
     */
    updateInventoried(inventoried) {
        if (inventoried.length === 0) {
            this.elements.inventoriedList.innerHTML = '<p class="empty-message">No hay bienes inventariados</p>';
            return;
        }
        
        const cols = CONFIG.sheets.columns;
        const html = inventoried.map((item, index) => {
            return `
                <div class="inventoried-item">
                    <div class="inventoried-item-header">
                        <span class="inventoried-item-code">${item[cols.cod_patrim] || '-'}</span>
                        <span class="inventoried-item-date">${item[cols.f_registro] || 'Sin fecha'}</span>
                    </div>
                    <div class="inventoried-item-details">
                        <div class="inventoried-item-detail-row">
                            <span class="inventoried-detail-label">Descripción:</span>
                            <span class="inventoried-detail-value">${item[cols.descripcion_denominacion] || '-'}</span>
                        </div>
                        <div class="inventoried-item-detail-row">
                            <span class="inventoried-detail-label">Marca:</span>
                            <span class="inventoried-detail-value">${item[cols.marca] || '-'}</span>
                        </div>
                        <div class="inventoried-item-detail-row">
                            <span class="inventoried-detail-label">Modelo:</span>
                            <span class="inventoried-detail-value">${item[cols.modelo] || '-'}</span>
                        </div>
                        <div class="inventoried-item-detail-row">
                            <span class="inventoried-detail-label">Registrado por:</span>
                            <span class="inventoried-detail-value">${item[cols.registrado_por] || '-'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.inventoriedList.innerHTML = html;
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
                        <p class="ocr-instruction">Selecciona o edita el código que deseas buscar:</p>
                        ${suggestedCode ? `
                            <div class="ocr-suggested-code" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; color: white; margin-bottom: 15px;">
                                <strong style="font-size: 1.1rem;">✨ Código Detectado - 12 Dígitos</strong>
                                <div style="margin-top: 10px;">
                                    <input type="text" id="suggestedCodeInput" class="suggested-code-input" value="${suggestedCode}" maxlength="20" placeholder="Edita el código aquí" style="background: white; color: #1F2937; font-weight: bold; font-size: 1.1rem; text-align: center; padding: 10px; border-radius: 6px; border: 2px solid #667eea;">
                                </div>
                                <small style="display: block; margin-top: 8px; opacity: 0.9;">💡 Presiona Enter o haz click en "Buscar" para confirmar</small>
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
                        <button id="ocrConfirmBtn" class="btn btn-primary" ${suggestedCode ? 'style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-weight: bold;"' : ''}>
                            ${suggestedCode ? '✅ Buscar Código' : '✅ Buscar Seleccionado'}
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Actualizar texto OCR
        const textArea = document.getElementById('ocrTextArea');
        const suggestedInput = document.getElementById('suggestedCodeInput');
        
        // Si hay código sugerido, establecer como valor editable y preparar para confirm
        if (suggestedCode && suggestedInput) {
            suggestedInput.value = suggestedCode;
            suggestedInput.focus();
            suggestedInput.select();
        }
        
        textArea.value = ocrText;

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
            // Primero, intentar usar el código sugerido editado si existe
            let suggestedInputElement = document.getElementById('suggestedCodeInput');
            if (suggestedInputElement && suggestedInputElement.value.trim()) {
                const suggestedCode = suggestedInputElement.value.trim();
                console.log('✅ Usando código sugerido:', suggestedCode);
                modal.style.display = 'none';
                onConfirm(suggestedCode);
                return;
            }
            
            // Sino, usar la selección del textarea
            const selected = textArea.value.substring(
                textArea.selectionStart,
                textArea.selectionEnd
            );
            const searchText = selected.trim() || textArea.value.trim();
            
            if (searchText) {
                modal.style.display = 'none';
                onConfirm(searchText);
            } else {
                this.showToast('⚠️ Selecciona o edita un código para buscar', 'warning');
            }
        };

        // Permitir confirmar con Enter en el input de código sugerido
        let suggestedInputElement = document.getElementById('suggestedCodeInput');
        if (suggestedInputElement) {
            suggestedInputElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmBtn.click();
                }
            });
        }

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
    },

    /**
     * Muestra un modal con el código detectado para que pueda editarlo
     * @param {string} detectedCode - Código detectado por el escáner
     * @param {Function} onConfirm - Callback con el código confirmado/editado
     * @param {string} originalCode - Código original (para referencia)
     */
    showEditableCodeModal(detectedCode, onConfirm, originalCode = '') {
        // Crear modal si no existe
        let modal = document.getElementById('editableCodeModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editableCodeModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content editable-code">
                    <div class="modal-header">
                        <h3>✏️ Editar Código Detectado</h3>
                        <button class="modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="code-instruction">El sistema detectó un código. Si hay errores, edítalo aquí:</p>
                        <div class="code-input-container">
                            <label for="editableCodeInput">Código (12 dígitos):</label>
                            <input type="text" id="editableCodeInput" class="editable-code-input" maxlength="20" placeholder="Ingrese o edite el código">
                            <small class="code-input-helper">💡 Puedes editar los dígitos si la lectura fue incorrecta</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="editableCodeCancelBtn" class="btn btn-secondary">
                            ❌ Cancelar
                        </button>
                        <button id="editableCodeConfirmBtn" class="btn btn-primary">
                            ✅ Confirmar y Buscar
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Actualizar valor del input
        const codeInput = document.getElementById('editableCodeInput');
        codeInput.value = detectedCode || originalCode;
        codeInput.focus();
        codeInput.select();

        // Elementos de control
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('editableCodeCancelBtn');
        const confirmBtn = document.getElementById('editableCodeConfirmBtn');

        // Confirmar código
        confirmBtn.onclick = () => {
            const editedCode = codeInput.value.trim();
            
            if (editedCode) {
                modal.style.display = 'none';
                onConfirm(editedCode);
            } else {
                this.showToast('⚠️ Ingresa un código válido', 'warning');
            }
        };

        // Permitir confirmar con Enter
        codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        });

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
    },

    /**
     * Muestra un modal para agregar un nuevo producto
     * @param {string} code - Código del producto
     * @param {Function} onConfirm - Callback cuando se confirma
     */
    showAddNewProductModal(code, onConfirm) {
        // Crear modal si no existe
        let modal = document.getElementById('addNewProductModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'addNewProductModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h3>➕ Agregar Nuevo Producto</h3>
                        <button class="modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="color: #6B7280; margin-bottom: 1rem;">El producto no fue encontrado. Completa los datos para agregarlo:</p>
                        
                        <div class="form-group">
                            <label for="newProductCode">Código de Patrimonio:</label>
                            <input type="text" id="newProductCode" class="form-control" readonly placeholder="Código detectado">
                        </div>
                        
                        <div class="form-group">
                            <label for="newProductDesc">Descripción/Denominación: <span style="color: red;">*</span></label>
                            <input type="text" id="newProductDesc" class="form-control" placeholder="Ej: Escritorio de metal" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="newProductMarca">Marca:</label>
                            <input type="text" id="newProductMarca" class="form-control" placeholder="Ej: Samsung">
                        </div>
                        
                        <div class="form-group">
                            <label for="newProductModelo">Modelo:</label>
                            <input type="text" id="newProductModelo" class="form-control" placeholder="Ej: 55-UHD">
                        </div>
                        
                        <div class="form-group">
                            <label for="newProductColor">Color:</label>
                            <input type="text" id="newProductColor" class="form-control" placeholder="Ej: Negro, Gris, Blanco">
                        </div>
                        
                        <div class="form-group">
                            <label for="newProductApellidos">Apellidos y Nombre:</label>
                            <input type="text" id="newProductApellidos" class="form-control" placeholder="Ej: García López, Juan">
                        </div>
                        
                        <div class="form-group">
                            <label for="newProductNombreOfi">Nombre de Oficina:</label>
                            <input type="text" id="newProductNombreOfi" class="form-control" placeholder="Ej: Almacén Principal">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="addNewProductCancelBtn" class="btn btn-secondary">
                            ❌ Cancelar
                        </button>
                        <button id="addNewProductConfirmBtn" class="btn btn-primary">
                            ✅ Agregar Producto
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Establecer código
        document.getElementById('newProductCode').value = code;
        document.getElementById('newProductDesc').focus();

        // Elementos de control
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('addNewProductCancelBtn');
        const confirmBtn = document.getElementById('addNewProductConfirmBtn');
        const descInput = document.getElementById('newProductDesc');

        // Confirmar
        confirmBtn.onclick = () => {
            const desc = descInput.value.trim();
            
            if (!desc) {
                this.showToast('⚠️ La descripción es obligatoria', 'warning');
                return;
            }
            
            const data = {
                descripcion: desc,
                marca: document.getElementById('newProductMarca').value.trim() || '',
                modelo: document.getElementById('newProductModelo').value.trim() || '',
                color: document.getElementById('newProductColor').value.trim() || '',
                apellidos_nombres: document.getElementById('newProductApellidos').value.trim() || '',
                nombre_ofi: document.getElementById('newProductNombreOfi').value.trim() || ''
            };
            
            modal.style.display = 'none';
            onConfirm('NEW', data);
        };

        // Permitir Enter para confirmar
        descInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        });

        // Cerrar modal
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
    },

    /**
     * Muestra modal para seleccionar rango de fechas
     * @param {Function} onConfirm - Callback con las fechas (startDate, endDate) o null si cancela
     */
    showDateRangeModal(onConfirm) {
        // Crear modal si no existe
        let modal = document.getElementById('dateRangeModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dateRangeModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content date-range">
                    <div class="modal-header">
                        <h3>📅 Seleccionar Rango de Fechas</h3>
                        <button class="modal-close" aria-label="Cerrar">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="date-instruction">Elige el rango de fechas de los bienes que deseas incluir en el reporte:</p>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 1.5rem 0;">
                            <div class="form-group">
                                <label for="dateRangeStart">📅 Fecha Inicio:</label>
                                <input type="date" id="dateRangeStart" class="form-control" required>
                                <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">Incluye desde esta fecha</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="dateRangeEnd">📅 Fecha Fin:</label>
                                <input type="date" id="dateRangeEnd" class="form-control" required>
                                <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">Incluye hasta esta fecha</small>
                            </div>
                        </div>

                        <div style="background: var(--background-secondary); padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid var(--accent-cyan);">
                            <small>💡 <strong>Tip:</strong> Deja ambos campos vacíos para incluir TODOS los bienes inventariados</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="dateRangeCancelBtn" class="btn btn-secondary">
                            ❌ Cancelar
                        </button>
                        <button id="dateRangeConfirmBtn" class="btn btn-primary">
                            ✅ Generar Reporte
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Establecer fechas por defecto (si hay datos en historial, usar rango útil)
        const startInput = document.getElementById('dateRangeStart');
        const endInput = document.getElementById('dateRangeEnd');
        
        // Establecer fecha de inicio como el primer día del mes actual
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        startInput.value = firstDay.toISOString().split('T')[0];
        
        // Establecer fecha de fin como hoy
        endInput.value = today.toISOString().split('T')[0];

        // Elementos de control
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = document.getElementById('dateRangeCancelBtn');
        const confirmBtn = document.getElementById('dateRangeConfirmBtn');

        // Validar fechas y confirmar
        confirmBtn.onclick = () => {
            const startDate = startInput.value;
            const endDate = endInput.value;
            
            // Permitir ambas vacías o ambas llenas
            if ((startDate && !endDate) || (!startDate && endDate)) {
                this.showToast('⚠️ Por favor completa ambas fechas o déjalas vacías', 'warning');
                return;
            }
            
            // Si ambas están llenas, validar que inicio <= fin
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                if (start > end) {
                    this.showToast('⚠️ La fecha inicio debe ser menor que la fecha fin', 'warning');
                    return;
                }
            }
            
            modal.style.display = 'none';
            onConfirm(startDate || null, endDate || null);
        };

        // Cancelar
        const closeModal = () => {
            modal.style.display = 'none';
            onConfirm(null, null);
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
    }
};
