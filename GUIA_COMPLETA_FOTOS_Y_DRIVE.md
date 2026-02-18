# 📸 GUÍA COMPLETA: Captura y Envío de Fotos a Google Drive

## 🔄 Flujo Actual de Funcionalidad

```
Usuario escanea código
        ↓
Modal abre con detalles del bien
        ↓
Usuario hace click "Agregar foto" ← aquí captura la foto
        ↓
Foto se convierte a Base64
        ↓
Se guarda en window.currentProductPhotos (array en memoria)
        ↓
Usuario hace click "✅ Inventariados"
        ↓
Foto se guarda en localStorage (Storage.savePhotos)
        ↓
(Opcional) Enviar a Google Drive
```

---

## 1️⃣ CAPTURA DE FOTOS (Actualmente Funciona ✅)

### Dónde se captura:
**Archivo**: [js/ui.js](js/ui.js) líneas 313-360

### Código de captura:
```javascript
// Cuando usuario hace click en "Agregar foto"
photoInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0 && photos.length < 2) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        // Convertir a Base64
        reader.onload = (event) => {
            const photoData = {
                data: event.target.result,  // ← Este es el Base64
                timestamp: new Date().toISOString(),
                code: code  // Código del bien
            };
            photos.push(photoData);
            
            // Mostrar preview
            // ... código de render ...
        };
        
        reader.readAsDataURL(file);  // ← Convierte a Base64
    }
});
```

### Qué datos se capturan:
```javascript
{
    data: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",  // Imagen en Base64
    timestamp: "2026-02-18T15:30:45.123Z",
    code: "P-2024-001"  // Código patrimonial
}
```

---

## 2️⃣ GUARDADO EN STORAGE LOCAL (Actualmente Funciona ✅)

### Dónde se guarda:
**Archivo**: [js/storage.js](js/storage.js) líneas 335-360

### Código de guardado:
```javascript
savePhotos(photoData) {
    try {
        const key = `photos_${photoData.rowIndex}_${Date.now()}`;
        // Guarda en localStorage con key: "photos_5_1708270245123"
        return this.set(key, photoData);
    } catch (error) {
        console.error('Error guardando fotos:', error);
        return false;
    }
}
```

### Cómo se llama:
**Archivo**: [js/app.js](js/app.js) líneas 655-685

```javascript
async updateInventory(rowIndex, observations, photos = []) {
    // ... actualizar status en Sheets ...
    
    // Guardar fotos si existen
    if (photos && photos.length > 0) {
        const photoData = {
            rowIndex: rowIndex,
            photos: photos,  // Array de {data, timestamp, code}
            timestamp: new Date().toISOString(),
            operator: this.operator
        };
        Storage.savePhotos(photoData);  // ← Se guarda en localStorage
        console.log('📷 Fotos guardadas para el bien:', rowIndex);
    }
}
```

### Dónde se almacena:
```
localStorage[
    "photos_5_1708270245123" = {
        rowIndex: 5,
        photos: [
            { data: "data:image...", timestamp: "...", code: "P-2024-001" },
            { data: "data:image...", timestamp: "...", code: "P-2024-001" }
        ],
        operator: "Juan Pérez"
    }
]
```

---

## 3️⃣ ENVÍO A GOOGLE DRIVE (Actualmente NO ESTÁ ACTIVADO)

### Ubicación del código:
**Archivo**: [js/drive-integration.js](js/drive-integration.js)

### Estado actual:
- ✅ Las funciones existen
- ❌ NO se llaman automáticamente
- ❌ Requiere autenticación OAuth2 configurada

---

## 🚀 PARA ACTIVAR EL ENVÍO A DRIVE

### Paso 1: Configurar Google Cloud Console

```bash
1. Ve a: https://console.cloud.google.com/
2. Crea nuevo proyecto: "Inventario CSJLA"
3. Habilita APIs:
   - Google Drive API
4. Crea credenciales OAuth2:
   - Tipo: "Web Application"
   - URLs autorizadas:
     * http://localhost:*
     * https://lhmr0.github.io/inv-csjla/*
   - Descarga JSON con CLIENT_ID
```

### Paso 2: Actualizar config

En [js/drive-integration.js](js/drive-integration.js) línea 18:

```javascript
// ❌ ANTES (Placeholder):
CLIENT_ID: '712747266136-7ifncp4urd4hve1kl4nemhf8t735v5mi.apps.googleusercontent.com',

// ✅ DESPUÉS (Tu CLIENT_ID):
CLIENT_ID: 'TU_NUEVO_CLIENT_ID_AQUI.apps.googleusercontent.com',
```

### Paso 3: Agregar botón de envío a Drive

En [js/ui.js](js/ui.js) agregar después del modal:

```html
<!-- Agregar este botón en el modal de detalles del bien -->
<button id="btnSendPhotosToDrive" class="btn btn-info" style="margin-top: 1rem;">
    📤 Enviar Fotos a Drive
</button>
```

### Paso 4: Agregar evento en app.js

En [js/app.js](js/app.js) agregar en `setupEventListeners()`:

```javascript
// Botón para enviar fotos a Drive
const btnSendToDrive = document.getElementById('btnSendPhotosTorive');
if (btnSendToDrive) {
    btnSendToDrive.addEventListener('click', () => {
        this.sendPhotosToGoogleDrive();
    });
}
```

### Paso 5: Crear función para enviar

En [js/app.js](js/app.js) agregar nueva función:

```javascript
async sendPhotosToGoogleDrive() {
    const photos = window.currentProductPhotos || [];
    
    if (photos.length === 0) {
        UI.showToast('No hay fotos para enviar', 'warning');
        return;
    }
    
    UI.showLoading('Enviando fotos a Google Drive...');
    
    try {
        // Autenticar
        await DriveIntegration.authenticate();
        
        // Crear/obtener carpeta
        await DriveIntegration.getOrCreateFolder('Inventario_Fotos');
        
        // Subir fotos
        const response = await SheetsAPI.getLastScannedItem();
        const fileIds = await DriveIntegration.uploadPhotos(
            photos,
            `inventario_${response.code}`
        );
        
        UI.showToast(
            `✅ ${fileIds.length} foto(s) enviada(s) a Drive`,
            'success'
        );
        
    } catch (error) {
        console.error('Error enviando a Drive:', error);
        UI.showToast('Error al enviar a Drive: ' + error.message, 'error');
    } finally {
        UI.hideLoading();
    }
}
```

---

## 💾 FLUJO ALTERNATIVO: Envío Automático

Si quieres que se envíe **automáticamente** cuando se marque como inventariado:

En [js/app.js](js/app.js) función `updateInventory()`:

```javascript
async updateInventory(rowIndex, observations, photos = []) {
    UI.showLoading('Actualizando inventario...');
    
    try {
        await SheetsAPI.updateInventoryStatus(rowIndex, this.operator, observations);
        
        // Guardar fotos en Storage LOCAL
        if (photos && photos.length > 0) {
            const photoData = {
                rowIndex: rowIndex,
                photos: photos,
                timestamp: new Date().toISOString(),
                operator: this.operator
            };
            Storage.savePhotos(photoData);
            console.log('📷 Fotos guardadas localmente');
            
            // 🆕 AGREGAR ESTO: Enviar a Drive automáticamente
            try {
                if (DriveIntegration.CLIENT_ID && 
                    !DriveIntegration.CLIENT_ID.includes('TU_CLIENT_ID')) {
                    
                    await DriveIntegration.authenticate();
                    await DriveIntegration.getOrCreateFolder();
                    await DriveIntegration.uploadPhotos(
                        photos,
                        `inventario_${rowIndex}`
                    );
                    console.log('📤 Fotos enviadas a Drive');
                }
            } catch (driveError) {
                console.warn('⚠️ Drive no disponible, fotos guardadas localmente', driveError);
            }
        }
        
        // ... resto del código ...
    }
}
```

---

## 📊 COMPARATIVA: LOCAL vs DRIVE

| Aspecto | localStorage | Google Drive |
|---------|-------------|-------------|
| **Capacidad** | 5 MB máximo | Ilimitado |
| **Sincronización** | Solo dispositivo | Todos los dispositivos |
| **Backup** | Manual | Automático |
| **Velocidad** | Instantáneo | Requiere internet |
| **Privacidad** | Solo usuario | Usuario + Google |
| **Requiere config** | No | Sí (OAuth2) |

---

## 🔍 CÓMO VERIFICAR QUE ESTÁ FUNCIONANDO

### Fotos guardadas localmente:
```javascript
// En consola (F12):
console.log(JSON.parse(localStorage.getItem('photos_5_1708270245123')));

// Deberías ver:
{
    rowIndex: 5,
    photos: [{data: "data:image...", timestamp: "...", code: "..."}],
    operator: "Juan Pérez"
}
```

### Fotos en Google Drive:
```
1. Ve a: https://drive.google.com
2. Busca carpeta "Inventario_Fotos"
3. Las imágenes estarán nombradas: 
   inventario_5_foto_1_1708270245123.jpg
```

---

## 🐛 DEBUGGING

### Si fotos no se guardan localmente:
```javascript
// Verificar que Storage está funcionando
console.log('Storage disponible:', typeof Storage !== 'undefined');
console.log('sizeof localStorage:', new Blob(Object.values(localStorage)).size);
```

### Si fotos no se envían a Drive:
```javascript
// Verificar autenticación
console.log('DriveIntegration.isAuthenticated:', DriveIntegration.isAuthenticated);
console.log('DriveIntegration.accessToken:', DriveIntegration.accessToken);
console.log('DriveIntegration.CLIENT_ID:', DriveIntegration.CLIENT_ID);
```

---

## 📝 RESUMEN DE CAMBIOS

Para **habilitar envío a Drive**:

1. ✅ Actualizar CLIENT_ID en `drive-integration.js`
2. ✅ Agregar botón UI en `ui.js`
3. ✅ Agregar evento listener en `app.js`
4. ✅ Crear función `sendPhotosToGoogleDrive()` en `app.js`
5. ✅ (Opcional) Hacer envío automático

**Sin cambios**: Las fotos ya se guardan en localStorage ✅

---

## 💡 NOTA IMPORTANTE

**Recomendación**: Mantener **ambos**:
- **localStorage**: Respaldo local, funciona siempre
- **Drive**: Sincronización nube, backup automático

Así si Drive falla, las fotos se pierden localmente pero se guardó la intención.
