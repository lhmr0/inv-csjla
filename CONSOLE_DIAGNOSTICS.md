# 🖥️ Guía de Diagnóstico en Console

## Acceso Rápido a Diagnóstico

Presiona `F12` en la página y copia-pega esto en la **Console**:

```javascript
DriveIntegration.diagnose()
```

Esto te mostrará un diagnóstico completo de:
- ✅ Si las fotos se capturaron
- ✅ Si Google Drive API está cargada  
- ✅ Si estás autenticado en Google
- ✅ Si el CLIENT_ID está configurado
- ✅ Si la carpeta está lista

---

## Comandos Rápidos en Console

### 1. Ver Fotos Capturadas
```javascript
console.table(window.currentProductPhotos)
```

### 2. Ver Estado de Autenticación
```javascript
console.log({
    autenticado: DriveIntegration.isAuthenticated,
    tieneToken: !!DriveIntegration.accessToken,
    folderId: DriveIntegration.folderId,
    fotosCapturadas: window.currentProductPhotos?.length || 0
})
```

### 3. Intentar Autenticar Manualmente
```javascript
await DriveIntegration.authenticate()
    .then(() => console.log('✅ Autenticación exitosa'))
    .catch(e => console.error('❌ Error:', e.message))
```

### 4. Listar Fotos en localStorage
```javascript
console.table(Storage.getAllPhotos())
```

### 5. Test Completo de Upload
```javascript
// Esto intenta enviar las fotos capturadas a Drive
App.sendPhotosToGoogleDrive()
```

### 6. Ver Si Google Session Está Activa
```javascript
const auth2 = window.gapi?.auth2?.getAuthInstance();
console.log(auth2?.isSignedIn?.get() ? '✅ Google Session Activa' : '❌ No hay session')
```

### 7. Limpiar Todo y Reiniciar
```javascript
// Limpia localStorage pero NO elimina fotos de app
localStorage.clear();
window.currentProductPhotos = [];
location.reload();
```

---

## Flujo de Debug Paso a Paso

### Si el botón "📤 Enviar a Drive" NO aparece:
```javascript
// Paso 1: Verificar fotos
console.log('Fotos capturadas:', window.currentProductPhotos?.length)

// Paso 2: Verificar elemento
console.log('Botón existe:', !!document.getElementById('btnSendPhotosToGoogleDrive'))

// Paso 3: Verificar estilo
const btn = document.getElementById('btnSendPhotosToGoogleDrive');
console.log('Botón visible:', window.getComputedStyle(btn).display !== 'none')
```

### Si el popup de Google NO aparece:
```javascript
// Paso 1: Verificar Google API
console.log('gapi cargado:', !!window.gapi)
console.log('auth2 disponible:', !!window.gapi?.auth2?.getAuthInstance())

// Paso 2: Verificar CLIENT_ID
console.log('CLIENT_ID válido:', !DriveIntegration.CLIENT_ID.includes('TU_CLIENT_ID'))
console.log('CLIENT_ID:', DriveIntegration.CLIENT_ID)

// Paso 3: Intentar manualmente
const auth2 = window.gapi?.auth2?.getAuthInstance();
if (auth2) {
    console.log('Intentando signIn...');
    auth2.signIn().catch(e => console.error('Error:', e))
}
```

### Si el error es "redirect_uri_mismatch":
```javascript
// Ver URL actual
console.log('URL actual:', window.location.href)

// Esto requiere cambios en Google Cloud Console
// NO se puede arreglar desde console
console.log('⚠️ Esto debe configurarse en console.cloud.google.com')
```

### Si las fotos se supuestamente suben pero no aparecen en Drive:
```javascript
// Ver si hubo error en upload
console.error('Revisar Network tab (F12 → Network)')
console.log('Intentar manual:')

// Cargar Drive API
await gapi.client.load('drive', 'v3');

// Listar archivos en Drive
const result = await gapi.client.drive.files.list({
    pageSize: 10,
    fields: 'files(id, name, webViewLink)',
    q: "name contains 'inventario'"
});
console.table(result.result.files)
```

---

## Error Messages Explicados

| Mensaje en Console | Significado | Qué Hacer |
|---|---|---|
| `❌ Error autenticando: redirect_uri_mismatch` | OAuth mal configurado en Google Cloud | Ir a cloud.google.com y registrar URLs |
| `❌ Permiso denegado. Verifica OAuth` | Drive API no habilitada | Habilitar en cloud.google.com/apis |
| `❌ Token expirado` | Google session expiró | Recarga F5 o Ctrl+Shift+R |
| `📸 Foto 1/2: inventario_...jpg` | Foto subiendo (línea normal, no error) | Esperar a que termine|
| `✅ Todas las X fotos subidas` | ¡ÉXITO! Fotos en Drive | Listo, verifica en drive.google.com |

---

## Tabla de Debug - Qué Significa Cada Línea

Cuando ejecutas `DriveIntegration.diagnose()`, verás:

```
✅ CLIENT_ID válido: ✅ SÍ     → CLIENT_ID está configurado
✅ gapi disponible: ✅ SÍ       → Google API library cargó
✅ auth2 disponible: ✅ SÍ      → Google OAuth 2.0 disponible  
✅ Autenticado: ❌ NO          → No hay sesión activa aún
✅ Access Token: ❌ Presente    → No hay token para Drive API
✅ Google session: ❌ Activa    → No estás logueado en Google aún
✅ Fotos capturadas: 2          → 2 fotos en window.currentProductPhotos
✅ Folder ID: ❌ No asignado    → Carpeta no creada en Drive
✅ Fotos en localStorage: 0     → Nada guardado en disco local

TODO LISTO PARA ENVIAR FOTOS   → Verde = listo, Rojo = falta algo
```

---

## Comando de Verificación Rápida (Copy-Paste)

Copia TODO esto en console de una vez:

```javascript
const state = DriveIntegration.diagnose();
if (state.healthy) {
    console.log('✅ APLICACIÓN LISTA - Puedes enviar fotos');
} else {
    console.log('⚠️ FALTAN REQUISITOS:');
    Object.entries(state.checks).forEach(([k, v]) => {
        if (!v) console.log(`   • Falta: ${k}`);
    });
}
```

---

## Para Administrador - Verificar Todo

Ejecuta esto en console cuando testees:

```javascript
// 1. Ver configuración
console.log('=== CONFIG ===');
console.log('URL:', window.location.href);
console.log('CLIENT_ID:', DriveIntegration.CLIENT_ID);

// 2. Ver estado actual
console.log('\n=== ESTADO ===');
const diag = DriveIntegration.diagnose();

// 3. Si no funciona, capturar logs
console.log('\n=== LOGS ===');
// Los logs se ven en líneas previas en la console

// 4. Si necesitas guardar todo
copy(JSON.stringify(diag, null, 2))
console.log('✅ Estado copiado - puedes pegarlo en un email')
```

---

## Problemas Comunes en Console

### "DriveIntegration is not defined"
- La app aún está cargando
- Espera 5 segundos y intenta de nuevo

### "gapi is not defined"  
- Google API script no cargó
- Recarga la página (F5)
- Intenta de nuevo

### "Cannot read properties of undefined"
- Algo no inicializó correctamente
- Recarga (Ctrl+Shift+R) para limpiar caché
- Intenta de nuevo

---

**💡 Tip:** Si copias TODO el output de console (Ctrl+A después de ejecutar diagnose), puedes pegarlo en un editor de texto para guardarlo y compartirlo con soporte.

