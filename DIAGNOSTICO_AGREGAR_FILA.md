# 🔧 Diagnóstico y Solución - Agregar Nueva Fila

## Problema Reportado

```
Error al agregar nueva fila:
{success: false, timestamp: '2026-02-06T20:07:21.866Z', error: 'ERROR: row debe ser un número mayor a 1'}
```

## Root Cause Analysis

El error "row debe ser un número mayor a 1" viene de `handleUpdateInventory()` línea 106 en google-apps-script.gs, **NO** de `handleAddNewRow()`.

Esto significa que **la solicitud con `action=addNewRow` estaba siendo procesada por `handleUpdateInventory()`**.

## Soluciones Implementadas

### 1. ✅ Mejorado Routing en google-apps-script.gs (doGet)

**Antes:**
```javascript
if (action && action === 'addNewRow') {
    return handleAddNewRow(params);
} else if (action && action === 'updateInventory') {
    return handleUpdateInventory(params);
} else {
    return handleUpdateInventory(params); // FALLBACK INCORRECTO
}
```

**Ahora:**
```javascript
if (action === 'addNewRow') {
    Logger.log('✅ Detectada acción: addNewRow');
    return handleAddNewRow(params);
} else if (action === 'updateInventory' || action === '') {
    Logger.log('✅ Detectada acción: updateInventory (o por defecto)');
    return handleUpdateInventory(params);
} else {
    Logger.log('❌ Acción desconocida: ' + action);
    return createErrorResponse('Acción desconocida: ' + action);
}
```

### 2. ✅ Agregada Validación en handleAddNewRow

Ahora verifica que la acción sea exactamente 'addNewRow':

```javascript
const action = params.action || '';
if (action !== 'addNewRow') {
  Logger.log('❌ ERROR: Esta función debe ser llamada con action=addNewRow');
  return createErrorResponse('ERROR: Esta función requiere action=addNewRow');
}
```

### 3. ✅ Mejorado Manejo de Respuestas en sheets.js

Ahora interpreta correctamente:
- `success: true` → ✅ Éxito
- `success: false` → ❌ Error (muestra el campo error)
- Timeout → ⚠️ Aviso pero continúa

```javascript
if (result.success === true) {
    console.log('✨ Fila agregada correctamente');
    return result.data?.rowIndex || true;
} else if (result.success === false) {
    console.error('❌ Error de la Web App:', result.error);
    throw new Error(result.error || 'Error desconocido');
}
```

## Cómo Verificar que Funcione

### Paso 1: Abre la Consola (F12)
```
En Chrome/Firefox → Presiona F12 → Tab "Console"
```

### Paso 2: Intenta Agregar un Producto No Encontrado
1. Escanea un código que NO existe en el inventario
2. Haz clic en "Agregar como Nuevo Producto"
3. Completa los datos (Código, Descripción, Marca, Modelo)
4. Presiona "Guardar Producto"

### Paso 3: Verifica los Logs
Deberías ver en orden:
```
🆕 Agregando nuevo producto...
📋 Datos del producto: {...}
🔄 Enviando nueva fila a Web App...
📍 URL COMPLETA: https://script.google.com/macros/s/[ID]/exec?action=addNewRow&...
📌 Parámetro action: addNewRow
   cod_patrim: [tu código]
   descripcion: [tu descripción]
📊 Respuesta HTTP: 200 OK
✅ Respuesta JSON recibida: {success: true, data: {...}}
✨ Fila agregada correctamente
   Fila nueva: [número de fila]
```

### Paso 4: Verifica en Google Sheets
1. Abre tu Google Sheet
2. Busca la nueva fila al final
3. Verifica que tenga:
   - Código en columna J
   - Descripción en columna K
   - Marca en columna L
   - Modelo en columna M
   - "SI" en columna S (INVENTARIADO)
   - Fecha en columna T
   - Tu nombre en columna U

## Si Aún Hay Error

### Error 1: "ERROR: Esta función requiere action=addNewRow"
**Causa**: El parámetro `action` no se envía o es incorrecto  
**Solución**: Verifica que en sheets.js se envíe exactamente:
```javascript
url.searchParams.set('action', 'addNewRow');
```

### Error 2: "Parámetros faltantes: sheetId, cod_patrim, descripcion son requeridos"
**Causa**: Faltan datos obligatorios  
**Solución**: Verifica que completes:
- Código Patrimonio (obligatorio)
- Descripción (obligatorio)
- Los otros campos son opcionales

### Error 3: "La hoja [nombre] no existe"
**Causa**: El nombre de la hoja en la URL no coincide con la real  
**Solución**: 
1. Abre tu Google Sheet
2. Ve a config.js línea 11
3. Verifica que `sheetName: 'Inventario'` coincida exactamente con el nombre de tu hoja

### Error 4: "No se pudo acceder al spreadsheet"
**Causa**: El ID de la hoja es incorrecto o no tienes permisos  
**Solución**:
1. Abre tu Google Sheet
2. Copia la URL: `https://docs.google.com/spreadsheets/d/[ESTE ID]/edit`
3. Ve a config.js línea 10
4. Verifica que `sheetId` sea exacto

## Flujo Completo - Agregar Nuevo Producto

```
┌─────────────────────────────────────────────────────┐
│ 1. USUARIO ESCANEA CÓDIGO NO ENCONTRADO            │
│    ↓ App busca código en Google Sheet               │
│    ↓ No encuentra coincidencia                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 2. MOSTRAR OPCIÓN "AGREGAR COMO NUEVO PRODUCTO"    │
│    ↓ Usuario hace clic                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 3. MODAL DE AGREGAR NUEVO PRODUCTO (ui.js)         │
│    • Código: [pre-rellenado, readonly]              │
│    • Descripción: [editable, obligatorio]           │
│    • Marca: [editable, opcional]                    │
│    • Modelo: [editable, opcional]                   │
│    ↓ Usuario completa datos                         │
│    ↓ Presiona "Guardar Producto"                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 4. ENVÍO A WEB APP (sheets.js addNewRow)            │
│    URL: https://script.google.com/macros/s/[ID]/   │
│         exec?action=addNewRow&cod_patrim=...       │
│    Parámetros:                                      │
│    - action: "addNewRow"                            │
│    - sheetId: [ID del Sheet]                        │
│    - sheetName: "Inventario"                        │
│    - cod_patrim, descripcion, marca, modelo        │
│    - operator: [nombre del operador]                │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 5. GOOGLE APPS SCRIPT PROCESA (doGet)               │
│    • Detecta action === 'addNewRow'                 │
│    • Llama a handleAddNewRow(params)                │
│    • Valida parámetros                              │
│    • Abre spreadsheet y hoja                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 6. AGREGAR NUEVA FILA (handleAddNewRow)             │
│    • Obtiene lastRow                                │
│    • Calcula newRowIndex = lastRow + 1              │
│    • Rellena columnas:                              │
│      J(10): código                                  │
│      K(11): descripción                             │
│      L(12): marca                                   │
│      M(13): modelo                                  │
│      S(19): "SI"                                    │
│      T(20): fecha actual                            │
│      U(21): operador                                │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 7. RESPUESTA EXITOSA                                │
│    {                                                │
│      success: true,                                 │
│      data: {                                        │
│        rowIndex: [número de fila],                  │
│        cod_patrim: [código],                        │
│        descripcion: [descripción]                   │
│      }                                              │
│    }                                                │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 8. CONFIRMACIÓN AL USUARIO (app.js)                 │
│    ✅ "Producto agregado correctamente"             │
│    📋 Mostra detalles de la nueva fila              │
│    🔄 Recarga datos del sheet                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Checklist Final

Antes de reportar que funciona, verifica:

- [ ] La URL de Web App está configurada en config.js
- [ ] Google Apps Script está desplegado como Web App (Ejecutar como: Tu Cuenta, Acceso: Cualquiera)
- [ ] El Sheet tiene las 21 columnas esperadas
- [ ] El nombre de la hoja es exactamente "Inventario"
- [ ] Presionas F12 y ves logs sin errores rojo
- [ ] En Google Sheets ves la nueva fila agregada
- [ ] Las columnas S, T, U están rellenadas automáticamente

## Archivos Modificados

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `google-apps-script.gs` | 32-47 | Mejorado routing en doGet() |
| `google-apps-script.gs` | 213-225 | Agregada validación action en handleAddNewRow() |
| `js/sheets.js` | 317-380 | Mejorado manejo de respuestas JSON |

## Próximas Mejoras Posibles

1. **Detección automática de columnas** - No hardcodear J, K, L, M, S, T, U
2. **Validación de datos** - Verificar formato de código antes de enviar
3. **Foto del producto** - Adjuntar automáticamente junto a la información
4. **Sincronización offline** - Guardar localmente si falla la conexión
5. **Historial de cambios** - Mantener log de quién agregó/editó cada fila

---
*Documento generado: 2026-02-06*
