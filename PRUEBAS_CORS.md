# ✅ Pruebas - Verificar Solución CORS v2.1

## 🧪 Test Plan Completo

---

## 📋 Test 1: Verificar Cambios en Código

### Objetivo
Confirmar que los cambios de CORS están implementados

### Pasos
1. Abre [js/sheets.js](js/sheets.js#L48)
2. Busca función `fetchData()`
3. Verifica que contenga:

```javascript
// ✅ Debe estar presente:
const csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv&gid=0`;
const apiUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=...`;

// ✅ Debe tener try-catch anidado:
try {
    response = await fetch(csvUrl, ...);
} catch (corsError) {
    console.log('⚠️ Endpoint de exportación bloqueado...');
    response = await fetch(apiUrl, ...);
}
```

### Resultado
- ✅ Si está presente: **PASS**
- ❌ Si no está: **FAIL** - Revisar cambios

---

## 📋 Test 2: Login con Internet y Google Sheet OK

### Objetivo
Verificar que login funciona en condiciones ideales

### Prerequisitos
- ✅ Conexión a internet
- ✅ Google Sheet compartido públicamente
- ✅ Nombre de hoja correcto
- ✅ URL del Sheet correcta

### Pasos
1. Abre la app en navegador
2. Abre DevTools: **F12**
3. Pestaña: **Console**
4. Ingresa tu nombre
5. Click **"Conectar"**
6. Espera ~2-3 segundos

### Logs Esperados
```
🔄 Intentando conectar con Google Sheets...
🌐 Intentando obtener datos de Google Sheets...
📍 URL: https://docs.google.com/spreadsheets/d/...
✅ Datos cargados: X filas
✅ Conexión exitosa con Google Sheets
✅ Sesión iniciada correctamente
```

### Resultado
- ✅ Si ves logs anteriores: **PASS**
- ✅ Pantalla avanza a "Escanear|Manual|Historial": **PASS**
- ❌ Si se queda en login: **FAIL**

---

## 📋 Test 3: Login con CORS Bloqueado (Simulado)

### Objetivo
Verificar que app maneja CORS bloqueado correctamente

### Prerequisitos
- ✅ Datos cacheados de Test 2 anterior
- ✅ Acceso a DevTools

### Pasos
1. Abre DevTools: **F12**
2. Pestaña: **Application** (o **Storage**)
3. Lado izquierdo: **Local Storage**
4. Busca clave con "cachedData"
5. Verifica que existe y tiene datos

### Si Caché Existe
Continúa con Test 4

### Si Caché NO Existe
- Primero ejecuta Test 2 (para crear caché)
- Luego vuelve aquí

---

## 📋 Test 4: Login en Modo Offline (Con Caché)

### Objetivo
Verificar que app funciona con caché si Google falla

### Prerequisitos
- ✅ Datos cacheados (del Test 2)
- ✅ DevTools abierto (F12)

### Pasos
1. Desactiva internet (WiFi OFF o desconecta)
2. DevTools: **Console**
3. Limpia la consola
4. Ingresa nombre
5. Click **"Conectar"**
6. Espera ~2-3 segundos

### Logs Esperados (con caché)
```
🔄 Intentando conectar con Google Sheets...
🌐 Intentando obtener datos de Google Sheets...
❌ Error fetching sheet data: Error: Failed to fetch
📋 Intentando usar datos cacheados...
✅ Usando datos cacheados: X filas
✅ Sesión iniciada correctamente
```

O puede ver:
```
⚠️ Error de CORS detectado
💡 Esto es NORMAL
✅ Usando datos cacheados: X filas
```

### Resultado
- ✅ Si ves logs anteriores: **PASS** (funciona offline)
- ✅ Pantalla avanza a "Escanear|Manual|Historial": **PASS**
- ❌ Si se queda en login: **FAIL**

---

## 📋 Test 5: Verificar Fallback de Endpoints

### Objetivo
Confirmar que intenta ambos endpoints

### Pasos
1. DevTools: **Network** tab
2. Console: **Clear** (limpia)
3. Click **"Conectar"**
4. Network: busca requests a `docs.google.com`

### Resultado Esperado
Deberías ver al menos 1-2 requests a Google Sheets:
- ❌ O al `/export?format=csv`
- ❌ O al `/gviz/tq?tqx=out:csv`
- ✅ Si ves ambas → intenta ambos endpoints

### Notas
- Los requests pueden fallar con CORS (eso es normal)
- La app captura el error y continúa
- Si ves requests en Network → **PASS**

---

## 📋 Test 6: Verificar Diagnóstico de Errores

### Objetivo
Confirmar que app detecta y reporta CORS correctamente

### Pasos
1. DevTools: **Console**
2. Busca logs que contengan:
   - ✅ "Error de CORS detectado"
   - ✅ "Esto es NORMAL"
   - ✅ "La app manejará esto automáticamente"

### Resultado
- ✅ Si ves estos logs: **PASS** (diagnóstico funcionando)
- ❌ Si no ves nada: **FAIL** o no hubo error CORS

---

## 📋 Test 7: Verificar Caché Persistente

### Objetivo
Confirmar que caché persiste entre sesiones

### Pasos
1. Completa Test 2 (login exitoso)
2. Cierra la app completamente
3. Espera 30 segundos
4. Abre la app nuevamente
5. DevTools: **Console**
6. Click **"Conectar"**

### Logs Esperados
Si hay caché persistente, puede ver:
```
✅ Usando datos cacheados: X filas
✅ Sesión iniciada correctamente
```

O puede conectar normalmente si hay internet.

### Resultado
- ✅ Si continúa sin problemas: **PASS**

---

## 📋 Test 8: Verificar Storage Stats

### Objetivo
Confirmar que app maneja espacio de storage correctamente

### Pasos
1. DevTools: **Console**
2. Pega esto:
```javascript
Storage.getStorageStats()
```
3. Presiona Enter

### Resultado Esperado
```javascript
{
  used: "X.XX",
  total: 5,
  available: "Y.YY",
  itemCount: Z
}
```

### Notas
- ✅ `itemCount` debe ser > 0 (hay datos en caché)
- ✅ `used` debe ser razonable (< 5 MB)

---

## 📋 Test 9: Verificar Sesión Guardada

### Objetivo
Confirmar que sesión se guarda correctamente

### Pasos
1. Completa login exitoso (Test 2)
2. DevTools: **Console**
3. Pega esto:
```javascript
Storage.hasSession()
Storage.getOperator()
Storage.getSheetUrl()
Storage.getSheetName()
```
4. Presiona Enter

### Resultado Esperado
```javascript
// hasSession()
true

// getOperator()
"Tu Nombre"

// getSheetUrl()
"https://docs.google.com/spreadsheets/d/[ID]/edit..."

// getSheetName()
"Inventario"
```

### Notas
- ✅ Todos los valores deben estar presentes
- ✅ Esto confirma que sesión se guardó

---

## 📊 Test 10: Suite Completa (Todos los Tests)

### Objetivo
Ejecutar todos los tests en orden

### Checklist
- [ ] Test 1: Cambios en código ✅
- [ ] Test 2: Login con internet ✅
- [ ] Test 3: Verificar caché ✅
- [ ] Test 4: Login offline ✅
- [ ] Test 5: Fallback de endpoints ✅
- [ ] Test 6: Diagnóstico de errores ✅
- [ ] Test 7: Caché persistente ✅
- [ ] Test 8: Storage stats ✅
- [ ] Test 9: Sesión guardada ✅

### Resultado Final
- ✅ **PASS**: Todos los tests pasaron
- ❌ **FAIL**: Algunos tests fallaron (ver cuáles)

---

## 🔧 Troubleshooting de Tests

### Si Test 2 Falla
```
❌ No ves logs esperados
→ Verificar:
  1. ¿Internet conectado?
  2. ¿Google Sheet compartido públicamente?
  3. ¿URL correcta?
  4. ¿Nombre de hoja correcto?
  5. ¿Console abierta en F12?
```

### Si Test 4 Falla
```
❌ No funciona offline
→ Verificar:
  1. ¿Completaste Test 2 primero? (para crear caché)
  2. ¿localStorage no está bloqueado?
  3. ¿Desactivaste realmente internet?
  4. ¿Hay espacio en storage?
```

### Si Test 5 Falla
```
❌ No ves requests en Network
→ Verificar:
  1. ¿Limpiaste Network antes?
  2. ¿Hiciste click en Conectar DESPUÉS de abrir Network?
  3. ¿Está activado el filtro correcto?
```

---

## 📋 Test Report Template

```markdown
# Test Report - CORS v2.1

Fecha: [fecha]
Tester: [nombre]
Navegador: [Chrome/Firefox/Safari/Edge]
Versión: [versión navegador]

## Resultados

| Test | Resultado | Notas |
|------|-----------|-------|
| 1: Cambios en código | ✅ PASS / ❌ FAIL | |
| 2: Login internet | ✅ PASS / ❌ FAIL | |
| 3: Verificar caché | ✅ PASS / ❌ FAIL | |
| 4: Login offline | ✅ PASS / ❌ FAIL | |
| 5: Fallback endpoints | ✅ PASS / ❌ FAIL | |
| 6: Diagnóstico errores | ✅ PASS / ❌ FAIL | |
| 7: Caché persistente | ✅ PASS / ❌ FAIL | |
| 8: Storage stats | ✅ PASS / ❌ FAIL | |
| 9: Sesión guardada | ✅ PASS / ❌ FAIL | |

## Resumen
- Total: 9 tests
- Pasados: X
- Fallidos: Y
- Tasa de éxito: Z%

## Conclusión
[✅ Solución CORS funcionando correctamente / ❌ Se encontraron problemas]

## Notas Adicionales
[Cualquier observación]
```

---

## 🎯 Criterio de Aceptación

### ✅ PASS - Solución Aceptada
- [ ] Test 1 = ✅ PASS (cambios implementados)
- [ ] Test 2 = ✅ PASS (login funciona)
- [ ] Test 4 = ✅ PASS (offline funciona)
- [ ] Test 6 = ✅ PASS (diagnóstico funciona)

### ❌ FAIL - Solución Rechazada
- Si cualquiera de los 4 anteriores falla

---

## 📞 Reportar Resultados

### Si Todo Funciona ✅
```
Excelente - La solución de CORS v2.1 está funcionando correctamente.
No se requieren cambios adicionales.
```

### Si Algo Falla ❌
```
Problema encontrado en [Test X]:
- Error específico: [detallar]
- Navegador: [especificar]
- Pasos para reproducir: [detallar]
- Logs de consola: [copiar]
```

---

**Versión**: 2.1  
**Fecha**: 6 de febrero de 2026  
**Estado**: ✅ Test Plan Completo
