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
        // Mantener solo los últimos 100 registros
        if (history.length > 100) {
            history.pop();
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
     * Guarda datos en caché
     * @param {any} data - Datos a cachear
     */
    setCachedData(data) {
        this.set(CONFIG.storage.keys.cachedData, data);
        this.set(CONFIG.storage.keys.lastSync, Date.now());
    },

    /**
     * Obtiene datos del caché si no han expirado
     * @returns {any|null} Datos cacheados o null si expiraron
     */
    getCachedData() {
        const lastSync = this.get(CONFIG.storage.keys.lastSync, 0);
        const now = Date.now();
        
        if (now - lastSync > CONFIG.storage.cacheExpiry) {
            return null; // Caché expirado
        }
        
        return this.get(CONFIG.storage.keys.cachedData);
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
    }
};
