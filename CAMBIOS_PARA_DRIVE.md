# ⚡ CAMBIOS RÁPIDOS: Para enviar fotos a Google Drive

## 📋 Resumen
- ✅ Las fotos se capturan automáticamente
- ✅ Se guardan en localStorage
- ❌ NO se envían a Drive (requiere cambios)

---

## 4️⃣ CAMBIOS NECESARIOS

### CAMBIO 1: Configurar CLIENT_ID

**Archivo**: [js/drive-integration.js](js/drive-integration.js)  
**Línea**: 18

```javascript
// ❌ ANTES (No funciona):
CLIENT_ID: '712747266136-7ifncp4urd4hve1kl4nemhf8t735v5mi.apps.googleusercontent.com',

// ✅ DESPUÉS (Reemplaza con tu CLIENT_ID):
CLIENT_ID: 'tu_client_id_aqui.apps.googleusercontent.com',
```

---

### CAMBIO 2: Agregar función para enviar fotos

**Archivo**: [js/app.js](js/app.js)  
**Ubicación**: Agregar esta función después de `updateInventory()` (línea ~700)

```javascript
/**
 * Envía fotos a Google Drive
 */
async sendPhotosToGoogleDrive() {
    const photos = window.currentProductPhotos || [];
    
    if (photos.length === 0) {
        UI.showToast('No hay fotos para enviar', 'warning');
        return;
    }
    
    // Verificar que Drive esté configurado
    if (!DriveIntegration.CLIENT_ID || DriveIntegration.CLIENT_ID.includes('TU_CLIENT_ID')) {
        UI.showToast('❌ Google Drive no está configurado', 'error');
        return;
    }
    
    UI.showLoading('Enviando fotos a Google Drive...');
    
    try {
        // 1. Autenticar con Google
        await DriveIntegration.authenticate();
        
        // 2. Crear/obtener carpeta
        await DriveIntegration.getOrCreateFolder('Inventario_Fotos');
        
        // 3. Subir fotos
        const fileIds = await DriveIntegration.uploadPhotos(
            photos,
            `inventario_${Date.now()}`
        );
        
        UI.showToast(
            `✅ ${fileIds.length} foto(s) enviada(s) a Google Drive`,
            'success'
        );
        
        console.log('📤 IDs subidos a Drive:', fileIds);
        
    } catch (error) {
        console.error('Error enviando a Drive:', error);
        UI.showToast('Error: ' + error.message, 'error');
    } finally {
        UI.hideLoading();
    }
}
```

---

### CAMBIO 3: Agregar botón para enviar

**Archivo**: [js/ui.js](js/ui.js)  
**Ubicación**: En la sección donde se muestra el modal de detalles (busca "btnCancelRegistration")

En el HTML del modal, agregar este botón junto al botón de "Inventariados":

```html
<!-- Después de btnMarkInventoried, agregar: -->
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem;">
    <button id="btnMarkInventoried" class="btn btn-success btn-block">
        ✅ Inventariados
    </button>
    <button id="btnSendPhotosToGoogleDrive" class="btn btn-info btn-block">
        📤 Enviar a Drive
    </button>
</div>
```

---

### CAMBIO 4: Conectar el botón con acción

**Archivo**: [js/ui.js](js/ui.js)  
**Ubicación**: Después de donde se configura `btnMarkInventoried` (línea ~385)

```javascript
// Agregar este código después de:
// btnUpdate.addEventListener('click', () => {
//     onUpdate(result.rowIndex, '', window.currentProductPhotos || []);
// });

// AGREGAR ESTO:
const btnSendDrive = document.getElementById('btnSendPhotosToGoogleDrive');
if (btnSendDrive) {
    btnSendDrive.addEventListener('click', () => {
        // Llamar la función del app
        App.sendPhotosToGoogleDrive();
    });
}
```

---

## 🎯 ALTERNATIVA: Envío Automático

Si quieres que se envíe **automáticamente** cuando se marca como inventariado:

**Archivo**: [js/app.js](js/app.js)  
**Función**: `updateInventory()` (línea ~655)  
**Cambio**: Agregar después de `Storage.savePhotos(photoData);`

```javascript
// Enviar a Drive automáticamente (si está configurado)
if (photos && photos.length > 0 && 
    DriveIntegration.CLIENT_ID && 
    !DriveIntegration.CLIENT_ID.includes('TU_CLIENT_ID')) {
    
    try {
        await DriveIntegration.authenticate();
        await DriveIntegration.getOrCreateFolder('Inventario_Fotos');
        await DriveIntegration.uploadPhotos(photos, `inventario_${rowIndex}`);
        console.log('📤 Fotos enviadas a Drive automáticamente');
    } catch (driveError) {
        console.warn('⚠️ Drive no disponible, fotos guardadas localmente', driveError.message);
        // No lanzar error, las fotos ya están en localStorage
    }
}
```

---

## ✅ VERIFICAR QUE FUNCIONA

1. **En consola (F12)**:
   ```javascript
   console.log('CLIENT_ID:', DriveIntegration.CLIENT_ID);
   console.log('Autenticado:', DriveIntegration.isAuthenticated);
   ```

2. **En Google Drive**:
   - Ve a https://drive.google.com
   - Busca carpeta "Inventario_Fotos"
   - Las fotos estarán la

---

## 📊 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Obtener CLIENT_ID de Google Cloud Console
- [ ] Cambio 1: Actualizar CLIENT_ID en drive-integration.js
- [ ] Cambio 2: Agregar función sendPhotosToGoogleDrive() en app.js
- [ ] Cambio 3: Agregar botón "📤 Enviar a Drive" en ui.js
- [ ] Cambio 4: Conectar evento del botón en ui.js
- [ ] (Opcional) Cambio 5: Envío automático en updateInventory()
- [ ] Probar captura de fotos
- [ ] Probar envío a Drive
- [ ] Verificar en Google Drive que aparecen las fotos

---

## 🎁 BONUS: Hacer cambios de una vez

Si quieres que te los haga todo de una vez, dime y:
1. Genera tu CLIENT_ID en Google Cloud
2. Comparte el CLIENT_ID
3. Yo hago todos los cambios automáticamente

**Sin esto, necesitas:**
1. CLIENT_ID válido
2. Hacer los 4 cambios manualmente
