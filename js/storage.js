/**
 * Módulo de almacenamiento local
 * Maneja la persistencia de datos en localStorage
 */
const Storage = {
    /**
     * Guarda un valor en localStorage
     * @param {string} key - Clave de almacenamiento
     * @param {any} value - Valor a guardar
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
            return false;
        }
    },

    /**
     * Obtiene un valor de localStorage
     * @param {string} key - Clave de almacenamiento
     * @param {any} defaultValue - Valor por defecto si no existe
     * @returns {any} Valor almacenado o valor por defecto
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error leyendo de localStorage:', error);
            return defaultValue;
        }
    },

    /**
     * Elimina un valor de localStorage
     * @param {string} key - Clave a eliminar
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error eliminando de localStorage:', error);
            return false;
        }
    },

    /**
     * Limpia todo el localStorage de la aplicación
     */
    clear() {
        try {
            Object.values(CONFIG.storage.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error limpiando localStorage:', error);
            return false;
        }
    },

    // Métodos específicos para la aplicación

    /**
     * Guarda el nombre del operador
     * @param {string} name - Nombre del operador
     */
    setOperator(name) {
        return this.set(CONFIG.storage.keys.operator, name);
    },

    /**
     * Obtiene el nombre del operador
     * @returns {string|null} Nombre del operador
     */
    getOperator() {
        return this.get(CONFIG.storage.keys.operator);
    },

    /**
     * Guarda la URL del Google Sheet
     * @param {string} url - URL del sheet
     */
    setSheetUrl(url) {
        return this.set(CONFIG.storage.keys.sheetUrl, url);
    },

    /**
     * Obtiene la URL del Google Sheet (con valor por defecto)
     * @returns {string} URL del sheet
     */
    getSheetUrl() {
        return this.get(CONFIG.storage.keys.sheetUrl) || CONFIG.defaults.sheetUrl;
    },

    /**
     * Guarda el nombre de la hoja
     * @param {string} name - Nombre de la hoja
     */
    setSheetName(name) {
        return this.set(CONFIG.storage.keys.sheetName, name);
    },

    /**
     * Obtiene el nombre de la hoja (con valor por defecto)
     * @returns {string} Nombre de la hoja
     */
    getSheetName() {
        return this.get(CONFIG.storage.keys.sheetName) || CONFIG.defaults.sheetName;
    },

    /**
     * Guarda la URL del Google Apps Script Web App
     * @param {string} url - URL del Web App
     */
    setWebAppUrl(url) {
        return this.set(CONFIG.storage.keys.webAppUrl, url);
    },

    /**
     * Obtiene la URL del Google Apps Script Web App (con valor por defecto)
     * @returns {string} URL del Web App
     */
    getWebAppUrl() {
        return this.get(CONFIG.storage.keys.webAppUrl) || CONFIG.defaults.webAppUrl;
    },

    /**
     * Agrega una entrada al historial de escaneos
     * @param {Object} entry - Entrada del historial
     */
    addToHistory(entry) {
        const history = this.getHistory();
        history.unshift({
            ...entry,
            timestamp: new Date().toISOString()
        });
        // Mantener solo los últimos 150 registros para mejor performance
        if (history.length > 150) {
            history.splice(150);
        }
        return this.set(CONFIG.storage.keys.history, history);
    },

    /**
     * Obtiene el historial de escaneos
     * @returns {Array} Historial de escaneos
     */
    getHistory() {
        return this.get(CONFIG.storage.keys.history, []);
    },

    /**
     * Limpia el historial de escaneos
     */
    clearHistory() {
        return this.set(CONFIG.storage.keys.history, []);
    },

    /**
     * Guarda datos en caché con validación de tamaño
     * @param {any} data - Datos a cachear
     */
    setCachedData(data) {
        try {
            // Validar tamaño aproximado
            const serialized = JSON.stringify(data);
            const sizeInBytes = new Blob([serialized]).size;
            const sizeInMB = sizeInBytes / (1024 * 1024);
            
            console.log(`📦 Tamaño del cache: ${sizeInMB.toFixed(2)} MB`);
            
            // Si es muy grande, solo cachear headers y metadatos
            if (sizeInMB > 5) {
                console.warn('⚠️ Datos muy grandes, almacenando solo metadatos...');
                const minimalCache = {
                    headers: data.headers,
                    sheetId: data.sheetId,
                    sheetName: data.sheetName,
                    count: data.data ? data.data.length : 0,
                    isMinimal: true,
                    timestamp: Date.now()
                };
                this.set(CONFIG.storage.keys.cachedData, minimalCache);
                this.set(CONFIG.storage.keys.lastSync, Date.now());
                return;
            }
            
            this.set(CONFIG.storage.keys.cachedData, data);
            this.set(CONFIG.storage.keys.lastSync, Date.now());
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('❌ Cuota de localStorage excedida, limpiando datos antiguos...');
                this.clearOldData();
                this.clearCache();
            } else {
                console.error('❌ Error cacheando datos:', error);
            }
        }
    },

    /**
     * Obtiene datos del caché si no han expirado
     * @returns {any|null} Datos cacheados o null si expiraron
     */
    getCachedData() {
        try {
            const cached = this.get(CONFIG.storage.keys.cachedData, null);
            if (!cached) return null;
            
            const lastSync = this.get(CONFIG.storage.keys.lastSync, 0);
            const now = Date.now();
            
            if (now - lastSync > CONFIG.storage.cacheExpiry) {
                return null; // Caché expirado
            }
            
            return cached;
        } catch (error) {
            console.error('Error obteniendo cache:', error);
            return null;
        }
    },

    /**
     * Limpia el caché y libera espacio
     */
    clearCache() {
        try {
            const result = this.remove(CONFIG.storage.keys.cachedData);
            this.remove(CONFIG.storage.keys.lastSync);
            console.log('🗑️ Cache limpiado correctamente');
            return result;
        } catch (error) {
            console.error('Error limpiando cache:', error);
            return false;
        }
    },
    
    /**
     * Libera espacio en localStorage eliminando datos antiguos
     */
    clearOldData() {
        try {
            // Limpiar historial excesivo (mantener solo los últimos 150)
            const history = this.getHistory();
            if (history.length > 200) {
                const cleaned = history.slice(-150);
                localStorage.setItem(CONFIG.storage.keys.history, JSON.stringify(cleaned));
                console.log(`🗑️ Historial limpiado: ${history.length} → ${cleaned.length}`);
            }
            
            // Limpiar fotos antiguas (más de 3 días)
            const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
            const photosStr = localStorage.getItem(CONFIG.storage.keys.photos);
            if (photosStr) {
                try {
                    const photos = JSON.parse(photosStr);
                    let cleanedCount = 0;
                    Object.keys(photos).forEach(key => {
                        if (photos[key] && photos[key].timestamp) {
                            if (typeof photos[key].timestamp === 'string') {
                                if (new Date(photos[key].timestamp).getTime() < threeDaysAgo) {
                                    delete photos[key];
                                    cleanedCount++;
                                }
                            }
                        }
                    });
                    if (cleanedCount > 0) {
                        localStorage.setItem(CONFIG.storage.keys.photos, JSON.stringify(photos));
                        console.log(`🗑️ Fotos antiguas limpiadas: ${cleanedCount}`);
                    }
                } catch (e) {
                    console.warn('Error limpiando fotos antiguas:', e);
                }
            }
            
            // Verificar si el caché es muy antiguo (más de 7 días)
            const cached = this.getCachedData();
            if (cached && cached.timestamp) {
                const cacheAge = Date.now() - cached.timestamp;
                if (cacheAge > 7 * 24 * 60 * 60 * 1000) {
                    this.remove(CONFIG.storage.keys.cachedData);
                    console.log('🗑️ Caché antiguo removido');
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error limpiando datos antiguos:', error);
            return false;
        }
    },
    
    /**
     * Obtiene el espacio disponible en localStorage
     */
    getStorageStats() {
        try {
            let totalSize = 0;
            let count = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                    count++;
                }
            }
            const usedMB = totalSize / 1024 / 1024;
            return {
                used: usedMB.toFixed(2),
                total: 5,
                available: (5 - usedMB).toFixed(2),
                itemCount: count
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return null;
        }
    },

    /**
     * Invalida el caché
     */
    invalidateCache() {
        this.remove(CONFIG.storage.keys.cachedData);
        this.remove(CONFIG.storage.keys.lastSync);
    },

    /**
     * Exporta el historial como JSON
     * @returns {string} JSON del historial
     */
    exportHistory() {
        const history = this.getHistory();
        const data = {
            exportDate: new Date().toISOString(),
            operator: this.getOperator(),
            totalRecords: history.length,
            history: history
        };
        return JSON.stringify(data, null, 2);
    },

    /**
     * Verifica si hay una sesión guardada
     * @returns {boolean} true si hay sesión
     */
    hasSession() {
        return !!(this.getOperator() && this.getSheetUrl());
    },

    /**
     * Guarda fotos de un bien inventariado
     * @param {Object} photoData - Datos de las fotos
     */
    savePhotos(photoData) {
        try {
            const key = `photos_${photoData.rowIndex}_${Date.now()}`;
            return this.set(key, photoData);
        } catch (error) {
            console.error('Error guardando fotos:', error);
            return false;
        }
    },

    /**
     * Obtiene fotos de un bien específico
     * @param {number} rowIndex - Índice de la fila
     * @returns {Array} Array de fotos
     */
    getPhotos(rowIndex) {
        try {
            const photos = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`photos_${rowIndex}_`)) {
                    const data = this.get(key, {});
                    if (data.photos) {
                        photos.push(...data.photos);
                    }
                }
            }
            return photos;
        } catch (error) {
            console.error('Error obteniendo fotos:', error);
            return [];
        }
    },

    /**
     * Obtiene todas las fotos guardadas
     * @returns {Object} Objeto con fotos agrupadas por rowIndex
     */
    getAllPhotos() {
        try {
            const allPhotos = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('photos_')) {
                    const data = this.get(key, {});
                    if (!allPhotos[data.rowIndex]) {
                        allPhotos[data.rowIndex] = [];
                    }
                    if (data.photos) {
                        allPhotos[data.rowIndex].push(...data.photos);
                    }
                }
            }
            return allPhotos;
        } catch (error) {
            console.error('Error obteniendo todas las fotos:', error);
            return {};
        }
    },

    /**
     * Elimina fotos de un bien específico
     * @param {number} rowIndex - Índice de la fila
     */
    deletePhotos(rowIndex) {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`photos_${rowIndex}_`)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => this.remove(key));
            return true;
        } catch (error) {
            console.error('Error eliminando fotos:', error);
            return false;
        }
    }
};
