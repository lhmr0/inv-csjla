/**
 * Configuración global de la aplicación
 */
const CONFIG = {
    // URLs por defecto
    defaults: {
        sheetId: '1cIPjvg6Kfi79d6810JosSKCk4HSYcxqNYpTtdZ28bYQ',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/1cIPjvg6Kfi79d6810JosSKCk4HSYcxqNYpTtdZ28bYQ/edit?usp=sharing',
        webAppUrl: 'https://script.google.com/macros/s/AKfycbwnYwze4g9Ax5ACdd9RblheVueboaGY7YaFINLK6IiDNLx58YJIO5R6speNCkScezGj/exec',
        sheetName: 'Inventario'
    },
    
    // Configuración del escáner
    scanner: {
        // Formatos de código de barras soportados
        formats: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'codabar_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader',
            'code_93_reader'
        ],
        // Frecuencia de escaneo (ms)
        frequency: 10,
        // Número de workers para procesamiento
        numOfWorkers: 2,
        // Configuración de localización
        locate: true,
        // Resolución del video
        constraints: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            facingMode: 'environment' // Cámara trasera por defecto
        }
    },
    
    // Configuración de Google Sheets
    sheets: {
        // API base URL para Google Sheets (usando proxy CORS)
        apiUrl: 'https://docs.google.com/spreadsheets/d/',
        // Columnas esperadas en el Excel (índices base 0)
        columns: {
            codigo: 0,           // A - Código de barras
            descripcion: 1,      // B - Descripción del producto
            categoria: 2,        // C - Categoría
            ubicacion: 3,        // D - Ubicación
            cantidad: 4,         // E - Cantidad
            inventariado: 5,     // F - ¿Inventariado? (SI/NO)
            fechaInventario: 6,  // G - Fecha de inventario
            realizadoPor: 7      // H - Realizado Por
        },
        // Nombres de las columnas para mostrar
        columnNames: {
            0: 'Código',
            1: 'Descripción',
            2: 'Categoría',
            3: 'Ubicación',
            4: 'Cantidad',
            5: 'Inventariado',
            6: 'Fecha Inventario',
            7: 'Realizado Por'
        }
    },
    
    // Configuración de almacenamiento local
    storage: {
        keys: {
            operator: 'inventory_operator',
            sheetUrl: 'inventory_sheet_url',
            sheetName: 'inventory_sheet_name',
            webAppUrl: 'inventory_webapp_url',
            history: 'inventory_history',
            cachedData: 'inventory_cached_data',
            lastSync: 'inventory_last_sync'
        },
        // Tiempo de expiración del caché (5 minutos)
        cacheExpiry: 5 * 60 * 1000
    },
    
    // Configuración de notificaciones
    notifications: {
        // Duración del toast (ms)
        toastDuration: 3000,
        // Sonido de escaneo exitoso
        soundEnabled: true
    },
    
    // Mensajes de la aplicación
    messages: {
        scanSuccess: '✅ Código escaneado correctamente',
        productFound: '✅ Producto encontrado en inventario',
        productNotFound: '❌ Producto no encontrado en inventario',
        updateSuccess: '✅ Inventario actualizado correctamente',
        updateError: '❌ Error al actualizar inventario',
        connectionError: '❌ Error de conexión. Verifique su conexión a internet',
        cameraError: '❌ No se pudo acceder a la cámara',
        invalidUrl: '❌ URL de Google Sheet inválida',
        operatorRequired: '⚠️ Ingrese el nombre del operador',
        alreadyInventoried: '⚠️ Este producto ya fue inventariado'
    }
};

// Hacer la configuración inmutable
Object.freeze(CONFIG);
Object.freeze(CONFIG.scanner);
Object.freeze(CONFIG.sheets);
Object.freeze(CONFIG.storage);
Object.freeze(CONFIG.notifications);
Object.freeze(CONFIG.messages);
