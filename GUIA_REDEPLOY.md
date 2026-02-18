# 🚀 Guía de Redeploy - Google Apps Script

## ⚠️ IMPORTANTE

Los cambios que se hicieron en **google-apps-script.gs** NO toman efecto automáticamente. Necesitas **redeployar** el script en Google Sheets.

## Pasos para Redeploy

### Paso 1: Accede al Google Apps Script Editor
1. Abre tu Google Sheet: https://docs.google.com/spreadsheets/d/1cIPjvg6Kfi79d6810JosSKCk4HSYcxqNYpTtdZ28bYQ
2. En la barra superior, busca **"Extensiones"** (o **"Extensions"**)
3. Haz clic en **"Apps Script"**
4. Se abrirá una nueva pestaña con el editor

### Paso 2: Verifica el Código
1. En el editor, deberías ver el archivo `Code.gs`
2. Reemplaza TODO el contenido con el código actualizado:
   - Copia el contenido completo de `google-apps-script.gs` de la carpeta del proyecto
   - Pégalo en el editor, reemplazando todo lo que esté allí

**O** si ya tienes el código actualizado:
1. Presiona **Ctrl+S** para guardar

### Paso 3: Desplegar Nueva Versión
1. En la parte superior del editor, busca el botón **"Desplegar"** (Redeploy/Deploy)
2. Haz clic en **"Nueva Implementación"** (New Deployment)
3. Un panel se abrirá en la derecha

### Paso 4: Configurar Deployment
En el panel derecho:
1. En **"Seleccionar tipo"** → **"Aplicación web"**
2. En **"Ejecutar como"** → **Tu Cuenta** (tu email)
3. En **"Permitir acceso a"** → **"Cualquiera"**
4. Haz clic en **"Desplegar"** (Deploy)

### Paso 5: Autorizar (si es la primera vez)
Un popup dirá "Este sitio web requiere autorización":
1. Haz clic en **"Revisión de la autorización de Google"** (Click your image at the top right)
2. Elige tu cuenta
3. Haz clic en **"Ir a [nombre]"** (en la parte inferior)
4. Revisa los permisos
5. Haz clic en **"Permitir"**
6. Volverás al editor

### Paso 6: Copiar Nueva URL
1. Verás un mensaje como: "Implementación completada"
2. Se mostrará una URL como: `https://script.google.com/macros/s/AKfyc...`
3. **Copia esta URL** (Presiona Ctrl+C sobre ella)

### Paso 7: Actualizar Config en la App
1. Abre el proyecto en VS Code
2. Ve a `js/config.js`
3. Encuentra la línea: `webAppUrl: 'https://script.google.com/...'`
4. **Reemplaza la URL anterior con la nueva**
5. Guarda el archivo (Ctrl+S)

## Verificación Rápida

Después de desplegar:

1. **En Google Apps Script:**
   ```
   Extensiones → Apps Script → 
   La URL debe tener parámetro: ?v=1 (o número más alto)
   ```

2. **En la App:**
   Abre F12 Console, intenta agregar nuevo producto:
   ```
   Deberías ver: "🟢 NUEVA SOLICITUD" con timestamp
                 "📌 ACCIÓN: addNewRow"
                 "✅ Fila agregada correctamente"
   ```

## Posibles Problemas

### Problema: "La autorización falló"
**Solución:**
1. Abre Google Apps Script
2. Haz clic en tu foto en la esquina superior derecha
3. Haz clic en **"Revocar acceso"** (Revoke)
4. Intenta desplegar de nuevo

### Problema: "No puedo acceder a la hoja"
**Solución:**
1. Asegúrate que tu cuenta de Google tiene acceso a la hoja
2. Abre la hoja desde tu navegador
3. Si no puedes abrir la hoja, añade tu email como colaborador

### Problema: "Script error: mismatched types"
**Solución:**
1. Posiblemente copiaste código incompleto o con errores
2. Descarga el `google-apps-script.gs` del proyecto
3. Reemplaza TODO el contenido (Ctrl+A → Delete)
4. Pega el código correcto
5. Guarda (Ctrl+S)
6. Desplega de nuevo

### Problema: Igual sigue mostrando el error antiguo
**Solución:**
1. Es posible que haya dos deployments activos
2. Ve a **"Desplegar"** en el editor
3. Busca el deployment antiguo y haz clic en la papelera para eliminarlo
4. Crea un nuevo deployment (Paso 3-6)

## Checklist Final

Antes de testear, asegúrate de:

- [ ] Abriste Google Apps Script desde tu sheet
- [ ] Reemplazaste el código correctamente
- [ ] Guardaste el código (Ctrl+S)
- [ ] Creaste una nueva implementación (New Deployment)
- [ ] Seleccionaste "Aplicación web"
- [ ] Ejecutar como: Tu Cuenta
- [ ] Permitir acceso: Cualquiera
- [ ] Copiaste la nueva URL
- [ ] Actualizaste config.js con la nueva URL
- [ ] Guardaste config.js

## Comando Rápido para Verificar

Abre F12 Console y ejecuta:
```javascript
console.log(Storage.getWebAppUrl());
```

Debería mostrar una URL que **comience con**:
```
https://script.google.com/macros/s/AKfyc...
```

Si es diferente, actualiza config.js nuevamente.

---
**Tiempo estimado:** 5-10 minutos  
**Dificultad:** ⭐ Fácil  
**Importante:** Esto DEBE hacerse después de cambios en google-apps-script.gs
