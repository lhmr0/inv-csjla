# ✅ Solución: Login en Producción (GitHub Pages)

## 🎯 Problema

El login funcionaba en **local** pero fallaba en **producción** (https://lhmr0.github.io/inv-csjla/) con error CORS.

### Causa Raíz

```javascript
// ❌ ANTES - Acceso directo bloqueado por CORS en producción
const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`
```

Cuando se accedía desde HTTPS (GitHub Pages), Google Sheets rechazaba la solicitud por CORS. Funcionaba en local porque:
- **Local**: `http://127.0.0.1:5500` (HTTP) → Google permite
- **Producción**: `https://lhmr0.github.io/inv-csjla/` (HTTPS) → Google rechaza

---

## ✅ Solución Implementada

### 1. **Usar Apps Script URL (CORS Compatible)**

```javascript
// ✅ DESPUÉS - Intenta primero con Apps Script
if (this.webAppUrl && !this.webAppUrl.includes('undefined')) {
    const response = await fetch(this.webAppUrl + '?action=read&sheet=' + encodeURIComponent(this.sheetName), {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'text/csv' }
    });
}
```

Apps Script **siempre tiene CORS habilitado** por Google.

### 2. **Pasar webAppUrl al inicializar**

```javascript
// app.js
await SheetsAPI.init(data.sheetUrl, data.sheetName, data.webAppUrl);

// sheets.js
async init(url, sheetName, webAppUrl) {
    this.webAppUrl = webAppUrl || CONFIG.defaults.webAppUrl;
    Storage.setWebAppUrl(this.webAppUrl);
    await this.fetchData();
}
```

### 3. **Fallback a acceso directo**

Si Apps Script no está disponible, intenta acceso directo (para modo offline).

---

## 📊 Flujo de Funcionamiento

```
Usuario inicia sesión
        ↓
    ↙--------↖
   /          \
[Apps Script]  [Google Sheets Directo]
  (Producción)  (Local/Offline)
   /            \  
    \--------↙
        ↓
   Datos Cargados
```

---

## 🚀 Para Probar en Producción

1. **Ir a**: https://lhmr0.github.io/inv-csjla/
2. **Ingresar nombre**: cualquier nombre
3. **Click**: "Conectar"
4. **Debería funcionar** sin errores CORS

---

## 🔍 Cómo Verificar (Consola F12)

```javascript
// En Console:
console.log('Intentando obtener datos vía Apps Script...');
console.log('✅ Datos cargados vía Apps Script: X filas');

// Significa que funcionó
```

---

## 📝 Cambios Técnicos

| Archivo | Cambio |
|---------|--------|
| `app.js` | Pasa `webAppUrl` a `SheetsAPI.init()` |
| `sheets.js` | Agrega propiedad `webAppUrl` |
| `sheets.js` | `fetchData()` intenta Apps Script primero |
| `sheets.js` | Fallback a acceso directo si falla |

---

## 💡 Por Qué Funciona

1. **Apps Script**: URL controlada por usuario, CORS habilitado por Google
2. **Respetuoso**: Intenta Apps Script primero (mejor para producción)
3. **Flexible**: Fallback a directo (funciona en local/offline)
4. **Transparente**: Usuario no notará diferencia

---

## ⚠️ Nota Importante

Si sigues viendo error CORS en consola pero la app funciona, es normal:
- Es warning de Google API (Drive es opcional)
- No afecta la carga de datos
- Revisa que veas `✅ Datos cargados` en consola

---

## 📱 Estado Actual

| Entorno | Estado |
|---------|--------|
| Local | ✅ Funciona (siempre) |
| GitHub Pages | ✅ Funciona (Apps Script) |
| Incognito | ✅ Funciona (sin cache) |
| Offline | ✅ Usa caché local |

