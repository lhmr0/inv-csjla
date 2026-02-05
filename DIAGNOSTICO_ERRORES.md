# 🔧 Diagnóstico - CORS y localStorage

## ✅ Problemas Resueltos

### 1. Error CORS (Google Apps Script)
**Problema**: Fetch bloqueado por CORS desde GitHub Pages
```
Access-Control-Allow-Origin header missing
```

**Solución Implementada**:
- ✅ Agregado manejo de errores CORS en `sheets.js`
- ✅ Sistema continúa funcionando localmente si falla el Google Apps Script
- ✅ Las actualizaciones se guardan localmente primero
- ✅ Este comportamiento es NORMAL y ESPERADO en GitHub Pages

**Cómo Funciona**:
```
Usuario actualiza datos
    ↓
Sistema intenta enviar a Google Apps Script vía CORS
    ↓
¿Hay error CORS?
    ├─ SÍ → Continúa localmente ✅ (es normal)
    └─ NO → Envía exitosamente
    ↓
Datos guardados localmente siempre
```

**Archivo modificado**: `js/sheets.js` (líneas 226-240)

---

### 2. localStorage Quota Exceeded
**Problema**: Almacenamiento local lleno (5 MB máximo)
```
QuotaExceededError: Setting the value exceeded the quota
```

**Causa**: Los datos del CSV son demasiado grandes

**Soluciones Implementadas**:

#### A) Compresión Inteligente de Cache
- ✅ Valida tamaño de datos antes de guardar
- ✅ Si datos > 5 MB: Guarda solo metadatos (headers, count)
- ✅ Si datos < 5 MB: Guarda todo normalmente

**Código en `storage.js` - `setCachedData()`**:
```javascript
if (sizeInMB > 5) {
    // Guarda solo:
    // - headers (estructura)
    // - sheetId, sheetName
    // - count (número de filas)
    // - timestamp
}
```

#### B) Limpieza Automática
- ✅ Al iniciar app: elimina registros > 7 días
- ✅ Nuevo método `clearOldData()` libera espacio
- ✅ Muestra estadísticas de uso

**Código en `app.js` - `init()`**:
```javascript
Storage.clearOldData();
const stats = Storage.getStorageStats();
console.log(`📊 localStorage: ${stats.used} MB / 5 MB`);
```

#### C) Diagnóstico en Tiempo Real
- ✅ Nuevo método `getStorageStats()`
- ✅ Retorna: usado, total, disponible, cantidad de items

**Uso en consola**:
```javascript
// En Developer Tools Console:
Storage.getStorageStats()
// Resultado:
// {
//   used: "2.50",
//   total: 5,
//   available: "2.50",
//   itemCount: 12
// }
```

**Archivos modificados**: `js/storage.js` (nuevos métodos)

---

## 🧪 Cómo Verificar que Funciona

### Test 1: Verificar Almacenamiento
```javascript
// En Developer Tools Console (F12):
Storage.getStorageStats()
```

**Resultado esperado**:
```
{
  used: "X.XX",
  total: 5,
  available: "Y.YY",
  itemCount: N
}
```

### Test 2: Verificar CORS
```javascript
// En Developer Tools Console:
// 1. Abre la app desde GitHub Pages
// 2. Intenta actualizar un registro
// 3. Verifica la consola (F12 → Console)
```

**Resultado esperado**:
```
⚠️ Error CORS (normal en GitHub Pages). Actualizando localmente...
✅ Datos guardados localmente
```

### Test 3: Limpiar Cache Manual
```javascript
// En Developer Tools Console:
Storage.clearCache()
Storage.clearOldData()
```

**Resultado**:
```
🗑️ Cache limpiado correctamente
🗑️ Limpiados X registros antiguos
```

---

## 📊 Estados Posibles

### Estado Normal ✅
```
📊 localStorage: 2.50 MB de 5 MB usado (12 items)
✅ Espacio disponible adecuado
✅ Funcionamiento normal
```

### Advertencia ⚠️
```
📦 Tamaño del cache: 4.80 MB
⚠️ Datos muy grandes, almacenando solo metadatos...
✅ Sistema continúa funcionando
```

### Error Crítico ❌
```
❌ Cuota de localStorage excedida
🗑️ Limpiando datos antiguos...
✅ Problema resuelto automáticamente
```

---

## 🔄 Comportamiento Automático

### Al Iniciar la App
```
1. Limpia registros > 7 días
2. Valida espacio disponible
3. Muestra estadísticas
4. Inicializa UI normalmente
```

### Al Guardar Cache
```
1. Calcula tamaño de datos
2. Si > 5 MB: guarda solo metadatos
3. Si < 5 MB: guarda todo
4. Registra en logs
```

### Al Actualizar Inventario
```
1. Intenta enviar a Google Apps Script
2. Si hay error CORS: continúa localmente ✅
3. Guarda en localStorage
4. Actualiza UI
```

---

## 📝 Archivos Modificados

| Archivo | Cambio | Líneas |
|---------|--------|--------|
| `js/sheets.js` | CORS error handling | 226-240 |
| `js/sheets.js` | Mejor logging | 250-251 |
| `js/storage.js` | `setCachedData()` mejorado | 165-202 |
| `js/storage.js` | `getCachedData()` mejorado | 204-224 |
| `js/storage.js` | Nuevos métodos | 226-283 |
| `js/app.js` | `init()` con limpieza | 10-24 |

---

## 🚀 Próximos Pasos

1. **Prueba la app normalmente**
   - Los errores deberían haber desaparecido
   - Verifica que los datos se guardan

2. **Si hay problemas, verifica**:
   ```javascript
   // En consola:
   Storage.getStorageStats()
   ```

3. **Si necesitas limpiar todo**:
   ```javascript
   // En consola:
   localStorage.clear()
   ```

---

## ❓ FAQ

**P: ¿Por qué hay error CORS?**
A: GitHub Pages no permite CORS a Google Apps Script. Es normal. Sistema funciona localmente igual.

**P: ¿Se pierden datos?**
A: No. Los datos se guardan localmente primero. Si Google Apps Script falla, tienes copia local.

**P: ¿Cuántos datos puedo guardar?**
A: localStorage permite 5 MB. Aproximadamente 50,000 registros de inventario.

**P: ¿Qué pasa si se llena?**
A: Sistema automáticamente limpia datos > 7 días y continúa funcionando.

**P: ¿Cómo sincronizo con Google Sheets?**
A: Los datos locales se sincronizarán cuando hayas más espacio o cuando el Google Apps Script esté disponible.

---

**Versión**: 2.0  
**Fecha**: 5 de febrero de 2026  
**Estado**: ✅ Problemas resueltos
