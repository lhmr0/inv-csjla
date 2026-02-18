# 🔍 DEBUG: Por Qué No Sube Foto a Drive

## 🚀 **PASO 1: Verificar Setup Básico**

Abre la consola (F12) y ejecuta esto:

```javascript
// 1. Verificar que DriveIntegration existe
console.log('1. DriveIntegration existe:', !!DriveIntegration);

// 2. Verificar CLIENT_ID
console.log('2. CLIENT_ID:', DriveIntegration.CLIENT_ID);

// 3. Verificar si está autenticado
console.log('3. isAuthenticated:', DriveIntegration.isAuthenticated);

// 4. Verificar si hay fotos capturadas
console.log('4. Fotos capturadas:', window.currentProductPhotos);

// 5. Verificar que gapi existe
console.log('5. Google API disponible:', !!window.gapi);

// 6. Verificar si auth2 está inicializado
console.log('6. auth2 inicializado:', !!window.gapi?.auth2?.getAuthInstance?.());
```

---

## 🔴 **PASO 2: Ejecutar Upload Manualmente**

En la misma consola:

```javascript
// Simular un upload de prueba
(async () => {
    console.log('=== INICIANDO DEBUG ===');
    
    try {
        // 1. Ver fotos
        const photos = window.currentProductPhotos || [];
        console.log('📷 Fotos disponibles:', photos.length);
        
        if (photos.length === 0) {
            console.error('❌ NO HAY FOTOS CAPTURADAS');
            console.log('   → Captura fotos primero antes de enviar');
            return;
        }
        
        // 2. Verificar autenticación
        console.log('🔓 Intentando autenticar...');
        await DriveIntegration.authenticate();
        console.log('✅ Autenticado');
        
        // 3. Crear carpeta
        console.log('📁 Creando carpeta...');
        await DriveIntegration.getOrCreateFolder('Inventario_Fotos_Debug');
        console.log('✅ Carpeta lista');
        
        // 4. Subir fotos
        console.log('📤 Subiendo fotos...');
        const fileIds = await DriveIntegration.uploadPhotos(
            photos,
            `debug_upload_${Date.now()}`
        );
        console.log('✅ FOTOS SUBIDAS:', fileIds);
        
    } catch (error) {
        console.error('❌ ERROR:', error);
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
    }
})();
```

---

## 🐛 **PASO 3: Problemas Comunes y Soluciones**

### ❌ Error: "DriveIntegration is not defined"
```javascript
// Causa: El archivo drive-integration.js no cargó
// Solución: 
console.log('Cargar página desde cero');
// Ctrl + Shift + R
// Si persiste, hay error en sintaxis
```

### ❌ Error: "auth2 is not initialized"
```javascript
// Causa: Google API no inicializó correctamente
// Debug:
console.log('gapi:', window.gapi);
console.log('gapi.auth2:', window.gapi?.auth2);
console.log('getAuthInstance:', window.gapi?.auth2?.getAuthInstance?.());

// Solución:
// 1. Verificar CLIENT_ID en drive-integration.js
// 2. Esperar 10 segundos (Google API recibe eventos)
// 3. Recarga: Ctrl + Shift + R
```

### ❌ Error: "Client configuration is invalid"
```javascript
// Causa: CLIENT_ID no registrado en Google Cloud
// Solución:
// 1. Ve a https://console.cloud.google.com/
// 2. Verifica que las URLs estén registradas:
//    - https://lhmr0.github.io (JavaScript origins)
//    - https://lhmr0.github.io/inv-csjla/ (Redirect URIs)
// 3. Espera 10 minutos
// 4. Recarga
```

### ❌ Error: "The user has not granted the application the required permissions"
```javascript
// Causa: Usuario no autorizó Drive
// Solución:
// 1. Abre DevTools (F12)
// 2. Borra cookies: F12 → Application → Cookies → accounts.google.com → Elimina
// 3. Recarga página
// 4. Intenta de nuevo, autoriza completamente
```

### ❌ Error: "Fotos no se capturan"
```javascript
// Causa: Modal de fotos no funciona
// Debug:
console.log('productPhotos element:', document.getElementById('productPhotos'));
console.log('photoInput element:', document.getElementById('photoInput'));
console.log('btnAddPhoto element:', document.getElementById('btnAddPhoto'));

// Solución:
// Intenta agregar foto manualmente en el modal
// Si no aparece input, hay error en UI
```

---

## 📊 **PASO 4: Ver el Estado Completo**

Ejecuta esto para obtener un reporte:

```javascript
(() => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║       DEBUG REPORT - FOTO UPLOAD       ║');
    console.log('╚════════════════════════════════════════╝');
    
    console.log('\n📋 ESTADO DEL SISTEMA:');
    console.log('✓ App iniciada:', !!window.App);
    console.log('✓ Google API:', !!window.gapi);
    console.log('✓ Drive Integration:', !!window.DriveIntegration);
    
    console.log('\n🔐 AUTENTICACIÓN:');
    console.log('✓ CLIENT_ID:', DriveIntegration.CLIENT_ID?.substring(0, 20) + '...');
    console.log('✓ Autenticado:', DriveIntegration.isAuthenticated);
    console.log('✓ Access Token:', DriveIntegration.accessToken ? 'SÍ' : 'NO');
    console.log('✓ Folder ID:', DriveIntegration.folderId || 'NO CREADA');
    
    console.log('\n📷 FOTOS:');
    console.log('✓ Fotos capturadas:', window.currentProductPhotos?.length || 0);
    if (window.currentProductPhotos?.length > 0) {
        window.currentProductPhotos.forEach((photo, i) => {
            console.log(`  ${i+1}. ${photo.code} - ${photo.timestamp}`);
        });
    }
    
    console.log('\n💾 ALMACENAMIENTO LOCAL:');
    const photoKeys = Object.keys(localStorage).filter(k => k.includes('photos_'));
    console.log('✓ Fotos guardadas localmente:', photoKeys.length);
    photoKeys.forEach(key => {
        const data = JSON.parse(localStorage.getItem(key));
        console.log(`  - ${key}: ${data.photos.length} fotos`);
    });
    
    console.log('\n🔗 ELEMENTO DOM:');
    console.log('✓ Botón Drive:', !!document.getElementById('btnSendPhotosToGoogleDrive'));
    console.log('✓ Input fotos:', !!document.getElementById('photoInput'));
    console.log('✓ Container fotos:', !!document.getElementById('productPhotos'));
    
    console.log('\n════════════════════════════════════════\n');
})();
```

---

## 🔄 **CÓMO SE ASOCIA FOTO AL REGISTRO**

### **Flujo de Asociación:**

```
┌─────────────────────────────────────────────────────────┐
│  1. CAPTURA FOTO                                        │
│     - Modal abierto de bien específico                  │
│     - Foto se convierte a Base64                        │
│     - Se guarda en window.currentProductPhotos          │
│     - Contiene: {data, timestamp, code}                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. USUARIO MARCA "✅ INVENTARIADOS"                    │
│     - onUpdate() es llamado con:                        │
│       * rowIndex (fila de Sheets)                       │
│       * observations (notas)                            │
│       * photos (window.currentProductPhotos)            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  3. updateInventory() RECIBE FOTOS                      │
│     - Actualiza Sheets (status = "SI")                  │
│     - Guarda fotos en localStorage con rowIndex como    │
│       key: "photos_{rowIndex}_{timestamp}"              │
│     - Se asocia por: rowIndex del bien                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  4. ENVIAR A DRIVE (OPCIONAL)                           │
│     - Usuario hace click "📤 Enviar Fotos a Drive"     │
│     - Fotos se suben a Google Drive                     │
│     - Se nombran: inventario_{timestamp}_foto_N.jpg    │
│     - NO están asociadas directamente a Sheets,        │
│       pero están bajo la carpeta "Inventario_Fotos"    │
└─────────────────────────────────────────────────────────┘
```

### **Asociación Real en Base de Datos:**

```javascript
// En localStorage (ASOCIADO por rowIndex):
localStorage["photos_5_1708270245123"] = {
    rowIndex: 5,              // ← CLAVE ASOCIATIVA
    photos: [
        {
            data: "data:image/jpeg;base64/...",
            timestamp: "2026-02-18T15:30:45Z",
            code: "P-2024-001"
        }
    ],
    operator: "Juan Pérez",
    timestamp: "2026-02-18T15:31:00Z"
}

// En Google Sheets (después de UPDATE):
┌─────┬────────────────┬─────────────────────────┬──────────────┐
│ Row │ Código         │ Descripción             │ INVENTARIADO │
├─────┼────────────────┼─────────────────────────┼──────────────┤
│ 5   │ P-2024-001     │ Computadora HP          │ SI           │
│     │ (código único) │ (identificador único)   │ (marca)      │
└─────┴────────────────┴─────────────────────────┴──────────────┘

// En Google Drive (sin asociación directa):
Inventario_Fotos/
└── inventario_1708270245123_foto_1.jpg
    inventario_1708270245123_foto_2.jpg
    (Mismo timestamp, pero no ligadas a Sheets)
```

---

## 🔗 **CÓMO SE CONECTAN**

La conexión es a través del **TIMESTAMP**:

```javascript
// Cuando se captura:
const foto = {
    data: "...",
    timestamp: "2026-02-18T15:30:45.123Z",  // ← Este timestamp
    code: "P-2024-001"
}

// Se guarda en localStorage:
// Key: "photos_5_1708270245123"
//       ↑ Este 1708270245123 viene del timestamp

// Se sube a Drive:
// Nombre: "inventario_1708270245123_foto_1.jpg"
//          ↑ Mismo timestamp
```

---

## 📝 **COMO RECUPERAR FOTOS DE UN REGISTRO**

```javascript
// Para obtener fotos de un bien inventariado:

function getPhotosForItem(rowIndex) {
    const photos = [];
    
    // Buscar en localStorage todas las fotos de este rowIndex
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(`photos_${rowIndex}_`)) {
            const data = JSON.parse(localStorage.getItem(key));
            if (data.photos) {
                photos.push(...data.photos);
            }
        }
    }
    
    return photos;
}

// Uso:
const fotosDelBien = getPhotosForItem(5);
console.log(`El bien #5 tiene ${fotosDelBien.length} fotos`);
```

---

## ✅ **CHECKLIST DE DEBUG**

- [ ] Fotos se capturan ✓ (ver en window.currentProductPhotos)
- [ ] Autenticación funciona ✓ (no error 400)
- [ ] Carpeta se crea ✓ (ver en Google Drive)
- [ ] Fotos se suben ✓ (console.log muestra IDs)
- [ ] Se guardan en localStorage ✓ (localStorage.getItem('photos_*'))
- [ ] Asociación por rowIndex ✓ (key contiene el número)

---

## 🎯 **Próximos Pasos**

1. **Ejecuta el debug** de PASO 2 en consola
2. **Copia el error exacto** si hay
3. **Comparte qué paso falla**:
   - ¿En autenticación?
   - ¿En criar carpeta?
   - ¿En subir archivo?
4. **Verificamos** juntos

---

**Ejecuta el debug ahora y dime qué error ves exactamente en consola.** 👍
