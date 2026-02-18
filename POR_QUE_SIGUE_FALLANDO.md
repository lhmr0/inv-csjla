# 🔍 Por Qué Sigue Fallando - Explicación Visual

## El Error Que Ves

```
❌ ERROR: row debe ser un número mayor a 1
```

## De Dónde Viene

```
Google Apps Script ejecuta este código:

┌─────────────────────────────────────────────────┐
│ function doGet(e) {                             │
│   const params = e.parameter;                   │
│   const action = params.action;                 │
│   ↓                                             │
│   if (action && action === 'addNewRow') {       │ ← VERSIÓN VIEJA
│       return handleAddNewRow(params);           │    Comparación FRÁGIL
│   } else if (action && action === 'updateInventory') {
│       return handleUpdateInventory(params);     │
│   } else {                                      │
│       return handleUpdateInventory(params);     │ ← CAE AQUÍ (fallback)
│   }                                             │
│ }                                               │
│                                                 │
│ function handleUpdateInventory(params) {        │
│   ...                                           │
│   const rowIndex = parseInt(params.row);        │
│   if (!rowIndex || rowIndex < 2) {              │
│       return createErrorResponse(                │
│           'ERROR: row debe ser un número >1'   │ ← ESTE ERROR
│       );                                        │
│   }                                             │
│ }                                               │
└─────────────────────────────────────────────────┘
```

## Por Qué Falla

```
1. Navegador envía:
   action=addNewRow
   ↓
   
2. Google Apps Script recibe (VERSIÓN VIEJA):
   if (action && action === 'addNewRow') {
       ↓ (No entra porque la comparación es frágil con &&)
   } else {
       → Fallback a handleUpdateInventory()
       ↓
   
3. handleUpdateInventory() espera:
   params.row = número de fila
   ↓
   
4. Pero params NO tiene "row":
   ERROR: row debe ser un número mayor a 1
```

## Cómo Lo Corregí

```
┌──────────────────────────────────────┐
│ VERSIÓN VIEJA (❌ En Google Sheets)  │
├──────────────────────────────────────┤
│ if (action && action === 'addNewRow')│
│                   ↑                  │
│            Frágil con &&             │
└──────────────────────────────────────┘

              ↓ ARREGLÉ A ↓

┌──────────────────────────────────────┐
│ VERSIÓN NUEVA (✅ En VS Code)        │
├──────────────────────────────────────┤
│ if (action === 'addNewRow') {        │
│      ↑                               │
│   Comparación EXACTA                 │
│                                      │
│ } else if (action === 'updateInventory' 
│            || action === '') {       │
│       ↑                              │
│   Manejo explícito                   │
│                                      │
│ } else {                             │
│   return error                       │
│ }                                    │
└──────────────────────────────────────┘
```

## El Problema Ahora

```
┌─────────────────────────────────────────┐
│ CÓDIGO EN VS CODE                       │
│ (google-apps-script.gs)                 │
├─────────────────────────────────────────┤
│ ✅ CORRECTO                             │
│                                         │
│ if (action === 'addNewRow') { ... }    │
│ else if (action === 'updateInventory'  │
│          || action === '') { ... }      │
│                                         │
└─────────────────────────────────────────┘
            ⤴ Guardado localmente
            
┌─────────────────────────────────────────┐
│ CÓDIGO EN GOOGLE APPS SCRIPT            │
│ (En tu Google Sheet)                    │
├─────────────────────────────────────────┤
│ ❌ ANTIGUO                              │
│                                         │
│ if (action && action === 'addNewRow')  │
│ else if (action && action === 'update' │
│ else { fallback }                       │
│                                         │
└─────────────────────────────────────────┘
   ⤴ No sincronizado, necesita redeploy
```

## La Solución

**Los cambios en VS Code NO se replican automáticamente a Google Apps Script.**

Necesitas hacer un **REDEPLOY manual**:

```
1. Copiar código de VS Code
   ↓
2. Pegar en Google Apps Script
   ↓
3. Guardar (Ctrl+S)
   ↓
4. Desplegar → Nueva Implementación
   ↓
5. Copiar URL nueva
   ↓
6. Actualizar config.js
   ↓
7. ✅ FUNCIONA
```

## Flujo Actual (Fallando)

```
Usuario envía:
action=addNewRow, cod_patrim=123, descripcion=123
   ↓
Google Apps Script (VERSIÓN VIEJA)
   ↓
if (action && action === 'addNewRow')  ❌ Falla
else if (action && action === 'updateInventory') ❌ Falla
else { handleUpdateInventory() } ← CAE AQUÍ
   ↓
handleUpdateInventory() busca params.row
   ↓
No existe params.row
   ↓
❌ ERROR: row debe ser un número mayor a 1
```

## Flujo Cuando Hagas Redeploy (Funciona)

```
Usuario envía:
action=addNewRow, cod_patrim=123, descripcion=123
   ↓
Google Apps Script (VERSIÓN NUEVA)
   ↓
if (action === 'addNewRow') ✅ ENTRA AQUÍ
   ↓
handleAddNewRow(params)
   ↓
Calcula: newRowIndex = lastRow + 1
   ↓
Crea nueva fila en Google Sheet
   ↓
✅ Respuesta: {success: true, data: {rowIndex: N}}
   ↓
✨ "Fila agregada correctamente"
```

## Lo Que Está Pasando Ahora

```
LÍNEA TEMPORAL:

20:00 → Error reportado
   ↓
20:45 → Yo corrijo código en VS Code
   ↓ google-apps-script.gs actualizado localmente
20:50 → Pero Google Apps Script sigue VIEJO
   ↓ Usuario intenta agregar producto
21:00 → ERROR SIGUE APARECIENDO (porque código viejo)
   ↓
👉 SOLUCIÓN: Redeploy en Google Apps Script
```

## Checklist de Verificación

```
¿Hiciste esto?

[ ] ¿Abriste Google Apps Script?
    Sí → Continúa
    No → Hazlo ahora (Extensiones → Apps Script)

[ ] ¿Copiaste el código de google-apps-script.gs?
    Sí → Continúa
    No → Copia: Ctrl+A en VS Code, Ctrl+C

[ ] ¿Pegaste en Google Apps Script?
    Sí → Continúa
    No → Pega: Ctrl+V, luego Ctrl+S

[ ] ¿Hiciste "Nueva Implementación"?
    Sí → Continúa
    No → Hazlo ahora (Desplegar → Nueva Implementación)

[ ] ¿Copiaste la URL nueva?
    Sí → Continúa
    No → Cópiala de la respuesta

[ ] ¿Actualizaste config.js?
    Sí → Continúa
    No → Reemplaza webAppUrl con la URL nueva

Si respondiste "No" a alguna pregunta:
👉 Ve a REDEPLOY_URGENTE.md
```

---

## TL;DR (Resumen)

**Google Apps Script tiene el código VIEJO.**  
**VS Code tiene el código NUEVO.**  
**Necesitas sincronizar haciendo redeploy.**  
**Sin redeploy, seguirá fallando.**  

👉 **Sigue REDEPLOY_URGENTE.md AHORA** (5 minutos)
