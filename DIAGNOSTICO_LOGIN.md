# 🔧 Diagnóstico - Login No Funciona

## 🚨 Problema

La aplicación se queda en el inicio de sesión sin avanzar a la pantalla principal.

---

## 🔍 Causas Posibles y Soluciones

### 1. 🔐 Hoja de Google NO Compartida Públicamente ⚠️ **MÁS PROBABLE**

**Síntoma**: 
```
HTTP 403: No se pudo acceder al documento
```

**Solución**:
1. Abre tu Google Sheet
2. Click en **"Compartir"** (arriba derecha)
3. Cambia a **"Cualquiera con el enlace"**
4. Asegúrate que el acceso sea de **"Visor"** (lectura)
5. Copia la URL compartida
6. Pega en la app

**Verificación**:
- Intenta acceder a la URL en una pestaña privada/incógnita
- Si ves un error 404 o 403: **Aumenta los permisos**

---

### 2. 📍 URL Incorrecta del Google Sheet

**Síntoma**:
```
Invalid Sheet ID
```

**Solución**:
1. Abre tu Google Sheet
2. La URL debe ser:
   ```
   https://docs.google.com/spreadsheets/d/[ID]/edit#gid=0
   ```
3. Copia **solo el ID** (la parte entre `/d/` y `/edit`)
4. O pega **la URL completa** - la app extrae el ID automáticamente

**Formato válido**:
```
✅ https://docs.google.com/spreadsheets/d/1cIPjvg6Kfi79d6810JosSKCk4HSYcxqNYpTtdZ28bYQ/edit#gid=0
✅ 1cIPjvg6Kfi79d6810JosSKCk4HSYcxqNYpTtdZ28bYQ
❌ https://drive.google.com/file/d/1cIPjvg6Kfi79d6810JosSKCk4HSYcxqNYpTtdZ28bYQ/view
❌ Inventario (solo el nombre)
```

---

### 3. 🌐 Error CORS (Cross-Origin Resource Sharing) ⚠️ IMPORTANTE

**Síntoma**:
```
CORS policy: No 'Access-Control-Allow-Origin' header
Access-Control-Allow-Credentials: true
Network error: cors
```

**Causa**:
- Google Sheets no permite solicitudes CORS desde navegadores por seguridad
- Los headers `Access-Control-Allow-Origin` NO se pueden forzar desde JavaScript

**Solución Implementada en v2.1**:
1. ✅ La app ahora intenta MÚLTIPLES ENDPOINTS:
   - Endpoint `/export?format=csv` (menos restrictivo)
   - Endpoint `/gviz/tq?tqx=out:csv` (API de Visualization)
   - Fallback a datos cacheados (offline mode)

2. ✅ La app NO falla aunque hay CORS:
   ```
   ⚠️ Endpoint de exportación bloqueado
   → Intentando con API de Visualization...
   ✅ Datos cargados: 150 filas
   ```

**Verificación**:
```javascript
// En la consola (F12) - esto puede fallar por CORS, pero la app lo maneja:
fetch('https://docs.google.com/spreadsheets/d/[ID]/export?format=csv&gid=0')
  .then(r => r.text())
  .then(t => console.log('✅ ' + t.substring(0, 50)))
  .catch(e => console.log('⚠️ CORS bloqueado (esperado):', e.message))
```

**Si Aun Así Falla**:
1. Verifica conexión a internet
2. Intenta con WiFi diferente o datos móviles
3. Desactiva VPN si tienes
4. Desactiva extensiones del navegador (especialmente bloqueadores CORS)
5. Abre en pestaña privada/incógnita
6. Revisa que el Google Sheet esté compartido públicamente (ver #1)

---

### 4. 📋 Nombre de Hoja Incorrecto

**Síntoma**:
```
No data found
Empty sheet
```

**Solución**:
1. En Google Sheets, ve a las pestañas (abajo)
2. Copia el **NOMBRE EXACTO** de la pestaña (ej: "Hoja1", "Inventario")
3. Pégalo en el campo "Nombre de la Hoja" de la app
4. Respeta mayúsculas/minúsculas

**Verificación**:
- Click en la pestaña
- Copia el nombre que ves en la pestaña

---

### 5. 🔄 Datos Cacheados Vacíos

**Síntoma**:
```
❌ No se pudo conectar
⚠️ Sin datos cacheados disponibles
```

**Solución** (nueva en v2.0):
- Si es **PRIMERA VEZ**: La app necesita conectar a Google Sheets
- Si ya usaste: Debería usar datos anteriores
- Si falla: **Intenta una de las soluciones anteriores**

---

## 🧪 Cómo Diagnosticar

### Paso 1: Abre la Consola del Navegador
```
F12 → Pestaña "Console"
```

### Paso 2: Busca Estos Mensajes

| Mensaje | Significa | Solución |
|---------|-----------|----------|
| `✅ Tesseract.js disponible` | OCR cargó bien | ✅ Normal |
| `🔧 Inicializando aplicación...` | App arrancó | ✅ Normal |
| `🟢 Cámara lista...` | Cámara funciona | ✅ Normal |
| `HTTP 403` | Hoja no compartida | ❌ Compartir públicamente |
| `HTTP 404` | URL incorrecta | ❌ Verificar URL |
| `No se pudo acceder` | Permiso denegado | ❌ Aumentar permisos |
| `Usando datos cacheados` | Modo offline | ⚠️ Normal si no hay internet |

### Paso 3: Prueba la Conexión Manual

```javascript
// En Console:
await SheetsAPI.init(
  'https://docs.google.com/spreadsheets/d/TU_ID_AQUI/edit',
  'Inventario'
)
// Si muestra ✅: La conexión funciona
// Si muestra ❌: Hay un problema
```

---

## 📝 Flujo de Login Actualizado (v2.0)

```
Usuario entra en la app
    ↓
¿Hay sesión guardada?
    ├─ SÍ → Intenta reconectar automáticamente
    └─ NO → Muestra pantalla de login
    ↓
Usuario ingresa nombre de operador
    ↓
Click en "Conectar"
    ↓
¿Se conecta a Google Sheets?
    ├─ SÍ ✅ → Pantalla principal
    ├─ NO (pero hay cache) ⚠️ → Modo offline
    └─ NO (sin cache) ❌ → Error, intenta de nuevo
```

---

## ✨ Mejoras en v2.0

### ✅ Tolerancia a Errores
- Ya no falla si hay error CORS
- Usa datos cacheados si es necesario
- Permite trabajar offline

### ✅ Mensajes Más Claros
- Logs detallados en consola
- Mensajes específicos de error
- Instrucciones en tooltips

### ✅ Manejo de Conexión
- Intenta Google Sheets
- Falla elegantemente si no está disponible
- Continúa con datos locales

---

## 🛠️ Archivos Modificados en v2.0

| Archivo | Cambio |
|---------|--------|
| `js/app.js` | Mejorado manejo de errores en `connect()` |
| `js/sheets.js` | Mejorado `fetchData()` con mejor diagnóstico |

---

## 📋 Checklist para Fijar el Problema

- [ ] ¿Google Sheet está compartido públicamente?
- [ ] ¿URL del Sheet es correcta?
- [ ] ¿Nombre de la hoja es exacto (mayúsculas)?
- [ ] ¿Hay conexión a internet?
- [ ] ¿Extensiones del navegador desactivadas?
- [ ] ¿Intenta en otra pestaña privada/incógnita?
- [ ] ¿Revisa la consola (F12) para errores?

---

## 🔧 Si Nada Funciona

1. **Abre DevTools**: F12
2. **Pestaña**: Console
3. **Copia TODO** lo que dice (errores)
4. **Describe**: ¿Qué ves en pantalla?
5. **Intenta**: Compartir screenshot o logs

---

## ✅ Cómo Sé que Funciona

Cuando haces login y ves:

```
✅ Conexión exitosa con Google Sheets
📋 Datos cargados: 150 filas
✅ Sesión iniciada correctamente
[Aparece pantalla con tabs: Escanear, Manual, Historial, Estadísticas]
```

---

## 📞 Debug Rápido

**En la consola del navegador (F12)**, escribe:

```javascript
// Ver qué está cacheado
Storage.getStorageStats()

// Ver si hay sesión
Storage.hasSession()

// Ver datos guardados
Storage.getOperator()
Storage.getSheetUrl()
```

---

**Versión**: 2.0  
**Fecha**: 5 de febrero de 2026  
**Estado**: ✅ DIAGNÓSTICO COMPLETO

---

## 🎯 Resumen Rápido

| Si ves | Problema | Solución |
|--------|----------|----------|
| **"Conectando..."** 2+ min | Conexión lenta | Espera o recarga |
| **"403 Forbidden"** | Sheet no compartido | Compartir públicamente |
| **"404 Not Found"** | URL o Sheet incorrectos | Verificar URL y nombre |
| **"CORS error"** | Navegador bloqueando | Usar datos cacheados |
| **"⚠️ Modo offline"** | Sin internet pero cache ok | ✅ Funciona igual |
| **"❌ Error crítico"** | Sin datos ni caché | Primera conexión + internet |

---

**Próximo paso**: Sigue las soluciones según tu error específico
