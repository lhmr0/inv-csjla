/**
 * Configuración global de la aplicación
 */
const CONFIG = {
    // URLs por defecto
    defaults: {
        sheetId: '1cIPjvg6Kfi79d6810JosSKCk4HSYcxqNYpTtdZ28bYQ',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/1cIPjvg6Kfi79d6810JosSKCk4HSYcxqNYpTtdZ28bYQ/edit?usp=sharing',
        webAppUrl: 'https://script.google.com/macros/s/AKfycbx21HdCVIrNn7W8yNvmyfpLf-iX-DJquPhSVMev83cGk921TWh09pGkwBX5C2uUzzxT/exec',
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
            nombre_local: 0,                // A - Nombre del Local
            direccion_local: 1,             // B - Dirección del Local
            bloque: 2,                      // C - Bloque
            piso: 3,                        // D - Piso
            ambiente: 4,                    // E - Ambiente
            apellidos_nombres: 5,           // F - Apellidos y Nombres
            nombre_ofi: 6,                  // G - Nombre de Oficina
            cod_inv: 7,                     // H - Código Inventario
            cod_m: 8,                       // I - Código M
            cod_patrim: 9,                  // J - Código de Patrimonio (CLAVE DE BÚSQUEDA)
            descripcion_denominacion: 10,   // K - Descripción/Denominación
            marca: 11,                      // L - Marca
            modelo: 12,                     // M - Modelo
            color: 13,                      // N - Color
            estado_conserv: 14,             // O - Estado de Conservación
            fecha_inv: 15,                  // P - Fecha de Inventario
            usuario: 16,                    // Q - Usuario
            digitador: 17,                  // R - Digitador
            inventariado: 18,               // S - INVENTARIADO (SI/NO)
            f_registro: 19,                 // T - F_REGISTRO (Fecha de Registro)
            registrado_por: 20              // U - REGISTRADO_POR (Nombre del registrador)
        },
        // Nombres de las columnas para mostrar
        columnNames: {
            0: 'Nombre del Local',
            1: 'Dirección del Local',
            2: 'Bloque',
            3: 'Piso',
            4: 'Ambiente',
            5: 'Apellidos y Nombres',
            6: 'Nombre de Oficina',
            7: 'Código Inventario',
            8: 'Código M',
            9: 'Código de Patrimonio',
            10: 'Descripción/Denominación',
            11: 'Marca',
            12: 'Modelo',
            13: 'Color',
            14: 'Estado de Conservación',
            15: 'Fecha de Inventario',
            16: 'Usuario',
            17: 'Digitador',
            18: 'INVENTARIADO',
            19: 'F_REGISTRO',
            20: 'REGISTRADO_POR'
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
