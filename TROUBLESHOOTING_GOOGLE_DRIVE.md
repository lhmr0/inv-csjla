# 🔧 Guía de Solución de Problemas - Google Drive Upload

## Resumen Rápido de Errores Comunes

### 1. ❌ Error 403: redirect_uri_mismatch
**¿Qué significa?** Google OAuth no reconoce tu URL registrada.

**Solución:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Edit OAuth Client
4. **Authorized JavaScript origins** - Agrega: `https://lhmr0.github.io`
5. **Authorized redirect URIs** - Agrega TODAS:
   ```
   https://lhmr0.github.io/inv-csjla/
   https://lhmr0.github.io/
   https://lhmr0.github.io/inv-csjla/index.html
   ```
6. SAVE y espera 10 minutos

---

### 2. ❌ Error: "Permiso denegado. Verifica OAuth"
**¿Qué significa?** El CLIENT_ID no tiene permisos para Drive.

**Solución:**
1. Verifica que Google Drive API esté **HABILITADA**:
   - [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services → Library
   - Busca "Google Drive API"
   - Click "ENABLE"

2. Verifica que en Credentials esté OAuth2:
   - Debe decir "OAuth 2.0 Client ID"
   - Tipo debe ser "Web application"

---

### 3. ❌ Error: "Autenticación exitosa pero no se uploads"
**¿Qué significa?** La carpeta de Drive no se crea o no hay permisos para escribir.

**Soluciones:**
1. Verifica que scope sea correcto:
   ```
   https://www.googleapis.com/auth/drive.file
   ```

2. En tu cuenta Google:
   - Ve a drive.google.com
   - Verifica que tengas espacio disponible (>1MB)
   - Intenta crear una carpeta manualmente

---

### 4. ⚠️ Token Expirado
**¿Qué significa?** Tu sesión de Google vencí.

**Solución:**
1. Recarga la página: `Ctrl+Shift+R` (hard reload)
2. Limpia cookies de Google:
   - `F12` → Application → Cookies
   - Busca `accounts.google.com`
   - Delete All
3. O usa navegador Incógnito: `Ctrl+Shift+N`
4. Intenta de nuevo

---

## 📋 Diagrama de Flujo de Errores

```
¿Las fotos se capturan? NO → Ver js/ui.js captura
                      ↓ SÍ

¿Botón "📤 Enviar a Drive" aparece? NO → window.currentProductPhotos está vacío
                                  ↓ SÍ

Click en botón "📤 Enviar a Drive"

¿Aparece popup de Google? NO → OAuth no inicializó (Ver console F12)
                         ↓ SÍ

¿Autorizas el acceso? NO → Acceso denegado (error access_denied)
                    ↓ SÍ

¿Google cierra el popup? NO → Error en redirect_uri (Error 403)
                       ↓ SÍ

¿Ves "✅ X fotos enviadas"? SÍ → ¡ÉXITO! 🎉
                           ↓ NO

¿Dice "Error: Permiso denegado"? SÍ → Ver error #2 arriba
                             ↓ NO

¿Dice "Error: Token expirado"? SÍ → Ver error #4 arriba
                           ↓ NO

Algo más → Lee console (F12 → Console)
           Busca error rojo
           Copia el mensaje completo
```

---

## 🔍 Cómo Debuggear (Para Administrador)

### Paso 1: Abrir Debug Console
```
1. Presiona F12 en la página
2. Tab "Console"
3. Eso es todo
```

### Paso 2: Ejecutar Test de Fotos
```javascript
// Ver fotos capturadas
console.log('Fotos:', window.currentProductPhotos);

// Ver si está autenticado
console.log('¿Autenticado?', DriveIntegration.isAuthenticated);

// Ver CLIENT_ID
console.log('CLIENT_ID:', DriveIntegration.CLIENT_ID);

// Ver folderID
console.log('Folder ID:', DriveIntegration.folderId);
```

### Paso 3: Test de Autenticación Manual
```javascript
// Intentar autenticar
await DriveIntegration.authenticate()
  .then(() => console.log('✅ Auth exitosa'))
  .catch(e => console.error('❌ Auth falló:', e.message));
```

### Paso 4: Test de Upload Completo
```javascript
// Si ya está autenticado:
await DriveIntegration.getOrCreateFolder();
console.log('Folder:', DriveIntegration.folderId);

// Intentar subir 1 foto
if (window.currentProductPhotos?.length > 0) {
    const photo = window.currentProductPhotos[0];
    try {
        let result = await DriveIntegration.uploadPhoto(photo.data, 'test.jpg');
        console.log('✅ Upload exitoso:', result);
    } catch(e) {
        console.error('❌ Upload falló:', e.message);
    }
}
```

---

## 📱 Errores Frecuentes en Console

### Error en Console:
```
❌ Error autenticando: {type: 'tokenFailed', error: 'server_error'}
```
**Causa:** OAuth redirect_uri no registrado  
**Solución:** Ver error #1 arriba

### Error en Console:
```
❌ Error: 403 Forbidden
```
**Causa:** Drive API no habilitada o permisos insuficientes  
**Solución:** Ver error #2 arriba

### Error en Console:
```
❌ Permiso denegado. Verifica OAuth en Google Cloud Console.
```
**Causa:** Función Drive API no autorizada  
**Solución:** Verifica que scope en drive-integration.js es:
```javascript
SCOPES: 'https://www.googleapis.com/auth/drive.file'
```

---

## ✅ Checklist para Verificar Configuración

- [ ] Google Drive API está **HABILITADA** en Google Cloud Console
- [ ] OAuth Client es tipo **Web application**
- [ ] **Authorized JavaScript origins** incluye: `https://lhmr0.github.io`
- [ ] **Authorized redirect URIs** incluye: `https://lhmr0.github.io/inv-csjla/`
- [ ] CLIENT_ID en drive-integration.js NO contiene "TU_CLIENT_ID"
- [ ] Browser cache está limpio (Ctrl+Shift+R)
- [ ] En Google account hay espacio en Drive (>1MB)
- [ ] Se capturan fotos correctamente en la app
- [ ] Botón "📤 Enviar a Drive" aparece cuando hay fotos

---

## 🚀 Comandos Útiles en Console

**Ver todo el estado actual:**
```javascript
console.log({
    fotos: window.currentProductPhotos?.length || 0,
    autenticado: DriveIntegration.isAuthenticated,
    folderId: DriveIntegration.folderId,
    clientId: DriveIntegration.CLIENT_ID,
    hasToken: !!DriveIntegration.accessToken
});
```

**Simular envío completo:**
```javascript
// Espera a que haya fotos capturadas primero
if (window.currentProductPhotos?.length > 0) {
    await App.sendPhotosToGoogleDrive();
} else {
    console.warn('⚠️ Captura una foto primero');
}
```

**Limpiar Storage Local (NO eliminar fotos, solo caché):**
```javascript
// Backup de fotos primero
const backup = Storage.getAllPhotos();
console.log('Backup:', backup);

// Luego limpiar
localStorage.clear();
console.log('✅ Storage limpiado');
```

---

## 📞 Si Nada Funciona

1. **Copiar todo de Console (F12)*:
   - Selecciona TODO el contenido
   - Ctrl+C para copiar
   - Pega en un documento

2. **Incluir:**
   - Mensajes de error completos
   - URL en que aparece el error
   - Screenshot si es posible

3. **Contactar al administrador con:**
   - Fecha y hora
   - Copy-paste de console
   - Pasos exactos para reproducir

---

## 🛠️ Herramientas Útiles

**Limpiar cookies de Google (sin afectar otras cosas):**
```
F12 → Application → Cookies → Filtro: "google" → Delete
```

**Resetear solo OAuth:**
```
F12 → Application → Cookies → accounts.google.com → Delete All
```

**Reiniciar completamente:**
```
1. Ctrl+Shift+I (abre DevTools)
2. Ctrl+Shift+M (abre navegador privado/incógnito)
3. Copia la URL
4. Pega en ventana privada
5. Intenta nuevamente
```

---

## 📊 Matriz de Diagnóstico

| Síntoma | Causa Probable | Solución |
|---------|---|---|
| No aparece popup de Google | OAuth no inicializado | Verifica console.log |
| Popup aparece pero cierra al instante | redirect_uri_mismatch | Registra URLs en Google Cloud |
| "Acceso denegado" | Usuario rechazó | Aceptar permisos nuevamente |
| "Permiso denegado" | Drive API no habilitada | Habilitar en console.cloud.google.com |
| Foto supuestamente subida pero no aparece | Error en upload pero sin mensaje | Revisar Network tab en F12 |
| Todo funciona pero fotos no aparecen en Drive | Carpeta en otra cuenta Google | Verificar estar con cuenta correcta |

---

**Última actualización:** 2024  
**Versión:** v1.0  
**Ayuda:** Presiona F12 y revisa la console para mensajes detallados
