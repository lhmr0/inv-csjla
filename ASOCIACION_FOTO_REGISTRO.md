# 🔗 ASOCIACIÓN: Foto ↔ Registro Inventariado

## 📊 Diagrama de Asociación

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ASOCIACIÓN FOTOS                        │
└─────────────────────────────────────────────────────────────────────┘

PASO 1: ESCANEAR
═══════════════════════════════════════════════════════════════════════
  Código escaneado: "P-2024-001"
           ↓
  Sistema busca en Sheets (rowIndex = 5)
           ↓
  ┌─────────────────────────────────────────┐
  │ Row 5: P-2024-001 - Computadora HP      │
  │ Estado inicial: NO inventariado         │
  └─────────────────────────────────────────┘

PASO 2: CAPTURAR FOTOS
═══════════════════════════════════════════════════════════════════════
  Usuario hace click "Agregar foto"
           ↓
  ┌────────────────────────────────────────────────────────────┐
  │ window.currentProductPhotos = [                            │
  │   {                                                        │
  │     data: "data:image/jpeg;base64,/9j/4AAQ...",          │
  │     timestamp: "2026-02-18T15:30:45.123Z",                │
  │     code: "P-2024-001"  ← ASOCIACIÓN #1                  │
  │   },                                                       │
  │   { ... foto 2 ... }                                       │
  │ ]                                                          │
  └────────────────────────────────────────────────────────────┘

PASO 3: REGISTRAR EN SHEETS
═══════════════════════════════════════════════════════════════════════
  Usuario hace click "✅ Inventariados"
           ↓
  updateInventory(rowIndex=5, observations="", photos=[...])
           ↓
  Sheets se actualiza:
  ┌─────────────────────────────────────────┐
  │ Row 5: P-2024-001 - Computadora HP      │
  │ Estado: SI INVENTARIADO  ← MARCA        │
  │ Registrado por: Juan Pérez              │
  │ Fecha: 2026-02-18                       │
  └─────────────────────────────────────────┘

PASO 4: GUARDAR FOTOS EN LOCALSTORAGE
═══════════════════════════════════════════════════════════════════════
  Fotos se guardan con ASOCIACIÓN POR ROWINDEX
           ↓
  ┌────────────────────────────────────────────────────────────┐
  │ KEY: "photos_5_1708270245123"                              │
  │      ↑ rowIndex ↑ timestamp                     │
  │                                                            │
  │ VALUE: {                                                   │
  │   rowIndex: 5,  ← ASOCIACIÓN #2 (llave primaria)          │
  │   photos: [...],                                           │
  │   operator: "Juan Pérez",                                  │
  │   timestamp: "2026-02-18T15:31:00Z"                        │
  │ }                                                          │
  └────────────────────────────────────────────────────────────┘

PASO 5: ENVIAR A GOOGLE DRIVE (OPCIONAL)
═══════════════════════════════════════════════════════════════════════
  Usuario hace click "📤 Enviar Fotos a Google Drive"
           ↓
  Fotos se suben a la carpeta "Inventario_Fotos"
           ↓
  ┌────────────────────────────────────────────────────────────┐
  │ Google Drive/                                              │
  │ └── Inventario_Fotos/                                      │
  │     ├── inventario_1708270245123_foto_1.jpg                │
  │     │   ↑ timestamp (mismo que localStorage)               │
  │     └── inventario_1708270245123_foto_2.jpg                │
  │                                                            │
  │ (Las fotos se asocian por timestamp, NO por rowIndex)     │
  └────────────────────────────────────────────────────────────┘
```

---

## 🔍 **PUNTOS DE ASOCIACIÓN**

### **ASOCIACIÓN #1: Foto ← Código del Bien**
```javascript
// Cuando se captura la foto:
const foto = {
    data: "...",
    timestamp: "2026-02-18T15:30:45.123Z",
    code: "P-2024-001"  ← Se guarda el código
}

// Después, se busca el rowIndex de ese código:
const rowIndex = 5;  // encontrado en Sheets
```

### **ASOCIACIÓN #2: Fotos ← RowIndex (localStorage)**
```javascript
// Clave de almacenamiento:
const key = `photos_${rowIndex}_${Date.now()}`;
// Resultado: "photos_5_1708270245123"

// Al recuperar fotos de un bien:
function getPhotosForBien(rowIndex) {
    // Busca todas las claves que empiezan con "photos_5_"
    // Todas las fotos de row 5 están asociadas
}
```

### **ASOCIACIÓN #3: RowIndex ← Sheets Row**
```javascript
// En Sheets, el rowIndex es la posición:
Row 0: Headers (código, descripción, marca, ...)
Row 1: Primer bien
Row 2: Segundo bien
...
Row 5: P-2024-001 - Computadora HP ← Este
...

// Cuando se actualiza, se modifica Row 5:
Row 5 en Sheets = rowIndex 5 en código = localStorage "photos_5_*"
```

---

## 💾 **CADENA DE ASOCIACIÓN COMPLETA**

```
                    Código del Bien
                    ↓
                    "P-2024-001"
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
    En Sheets              En localStorage
    Row Index 5            Key "photos_5_123..."
    (INVENTARIADO=SI)      (contiene foto)
        ↓                       ↓
        └───────────┬───────────┘
                    ↓
        Registro completamente asociado
        - El bien está marcado como INVENTARIADO
        - Las fotos están guardadas localmente
        - Las fotos están en Google Drive (opcional)
        ↓
    BÚSQUEDA INVERSA:
    "¿Qué fotos tiene el bien P-2024-001?"
    1. Buscar rowIndex de P-2024-001 en Sheets → rowIndex = 5
    2. Buscar en localStorage claves "photos_5_*"
    3. Recuperar todas las fotos
```

---

## 📋 **TABLA DE ASOCIACIONES**

| Bien | Row | Código | Fotos localStorage | Fotos Drive | Inventariado |
|------|-----|--------|--------------------|-----------|----|
| #1 | 1 | P-001 | photos_1_1708... | 1708...foto1.jpg | SI |
| #2 | 2 | P-002 | photos_2_1708... | 1708...foto1.jpg | SI |
| #3 | 3 | P-003 | (vacío) | (vacío) | NO |
| #4 | 4 | P-004 | photos_4_1708... | (no enviado) | SI |
| #5 | 5 | P-005 | (vacío) | (vacío) | SI |

---

## 🔄 **RELACIÓN ENTRE COMPONENTES**

```javascript
// ┌─────────────────────────────────────────────────────────┐
// │ SHEETS (Fuente de verdad)                               │
// │ ┌─────────────────────────────────────────────────────┐ │
// │ │ Row 5: código, descripción, ..., INVENTARIADO=SI   │ │
// │ └────────────┬────────────────────────────────────────┘ │
// └──────────────┼──────────────────────────────────────────┘
//                │ rowIndex = 5
//                │
// ┌──────────────┼──────────────────────────────────────────┐
// │ LOCALSTORAGE (Backup local)                             │
// │ ┌──────────────┼──────────────────────────────────────┐ │
// │ │ key: "photos_5_..."                                │ │
// │ │ photos: [{base64 imagen 1}, {base64 imagen 2}]     │ │
// │ └──────────────┬──────────────────────────────────────┘ │
// └──────────────┼──────────────────────────────────────────┘
//                │ timestamp
//                │
// ┌──────────────┼──────────────────────────────────────────┐
// │ GOOGLE DRIVE (Sync nube, OPCIONAL)                      │
// │ ┌──────────────┼──────────────────────────────────────┐ │
// │ │ Inventario_Fotos/                                  │ │
// │ │ └── inventario_timestamp_foto_1.jpg                │ │
// │ │ └── inventario_timestamp_foto_2.jpg                │ │
// │ └──────────────────────────────────────────────────────┘ │
// └─────────────────────────────────────────────────────────┘
```

---

## 🎯 **CÓMO VERIFICAR LA ASOCIACIÓN**

### En Consola (F12):

```javascript
// 1. Verificar que el bien fue marcado como inventariado
// (Ir a pestaña "Historial" → debe mostrar la entrada)

// 2. Verificar que las fotos se guardaron localmente
console.log('Fotos en localStorage:', 
    Object.keys(localStorage).filter(k => k.includes('photos_')));
// Output: ["photos_5_1708270245123"]

// 3. Obtener detalles de las fotos
const photoKey = Object.keys(localStorage).find(k => k.includes('photos_5_'));
const photoData = JSON.parse(localStorage.getItem(photoKey));
console.log('Asociación foto-registro:');
console.log('  rowIndex:', photoData.rowIndex);
console.log('  Número de fotos:', photoData.photos.length);
console.log('  Operador:', photoData.operator);
console.log('  Timestamp:', photoData.timestamp);

// 4. Verificar Google Drive (si fue enviado)
// Ir a https://drive.google.com
// Buscar carpeta "Inventario_Fotos"
// Status: ✅ Asociadas por timestamp
```

---

## 📝 **CUANDO SE PIERDEN ASOCIACIONES**

### ❌ Si borras localStorage:
```
Las fotos locales se pierden
PERO Sheets seguirá mostrando INVENTARIADO=SI
↓
Solución: Tienes los datos en Google Drive
```

### ❌ Si borras de Google Drive:
```
Las fotos en nube se pierden
PERO localStorage seguirá teniéndolas
↓
Solución: Puedes recuperarlas de localStorage
```

### ✅ Mejor Práctica:
```
Mantener AMBAS copias:
- localStorage: Respaldo local rápido
- Google Drive: Backup nube seguro
↓
Redundancia = Datos seguros
```

---

## 🚀 **EJEMPLO COMPLETO: Ciclo Completo**

```javascript
// 1. Usuario escanea: P-2024-001 (rowIndex = 5)
// 2. Modal abierto, agrega 2 fotos
// 3. Click "✅ Inventariados"

// Internamente ocurre:
App.updateInventory(5, "", [foto1, foto2])

// 4. En updateInventory:
SheetsAPI.updateInventoryStatus(5, "Juan", "");  // Mark as inventariado
Storage.savePhotos({
    rowIndex: 5,
    photos: [foto1, foto2],
    operator: "Juan",
    timestamp: "2026-02-18T15:31:00Z"
});  // Guardar en localStorage

// 5. localStorage ahora tiene:
// Key: "photos_5_1708270260000"
// {rowIndex: 5, photos: [...], operator: "Juan", ...}

// 6. Usuario hace click "📤 Enviar a Drive"
// 7. Fotos se suben a Google Drive:
// inventario_1708270260000_foto_1.jpg
// inventario_1708270260000_foto_2.jpg

// 8. Resultado final:
// - Sheets: Row 5 = INVENTARIADO = SI
// - localStorage: "photos_5_1708270260000" = [foto1, foto2]
// - Google Drive: carpeta Inventario_Fotos = [foto1, foto2]
// = COMPLETAMENTE ASOCIADO
```

---

## ✅ **Conclusión**

Las fotos se asocian al registro a través de:

1. **rowIndex** (en localStorage)
2. **Código del bien** (en la foto misma)
3. **Timestamp** (en Google Drive)

**Todo se conecta automáticamente** cuando:
- ✅ Capturas la foto
- ✅ Registras el bien (inventariado)
- ✅ Envías a Drive

**El usuario no necesita hacer nada manual**, todo está automatizado en el código.
