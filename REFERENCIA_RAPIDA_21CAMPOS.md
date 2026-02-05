# 🔍 REFERENCIA RÁPIDA - 21 Campos

## 📊 Mapeo de Columnas

| # | Excel | Propiedad JS | Tipo | Búsqueda | Lectura | Escritura | Índice |
|---|-------|--------------|------|----------|---------|-----------|--------|
| 1 | A | nombre_local | Text | - | ✅ | - | 0 |
| 2 | B | direccion_local | Text | - | ✅ | - | 1 |
| 3 | C | bloque | Text | - | ✅ | - | 2 |
| 4 | D | piso | Text | - | ✅ | - | 3 |
| 5 | E | ambiente | Text | - | ✅ | - | 4 |
| 6 | F | apellidos_nombres | Text | - | ✅ | - | 5 |
| 7 | G | nombre_ofi | Text | - | ✅ | - | 6 |
| 8 | H | cod_inv | Text | - | ✅ | - | 7 |
| 9 | I | cod_m | Text | - | ✅ | - | 8 |
| 10 | J | cod_patrim | Text | **✅** | ✅ | - | **9** |
| 11 | K | descripcion_denominacion | Text | - | ✅ | - | 10 |
| 12 | L | marca | Text | - | ✅ | - | 11 |
| 13 | M | modelo | Text | - | ✅ | - | 12 |
| 14 | N | color | Text | - | ✅ | - | 13 |
| 15 | O | estado_conserv | Text | - | ✅ | - | 14 |
| 16 | P | fecha_inv | Date | - | ✅ | - | 15 |
| 17 | Q | usuario | Text | - | ✅ | - | 16 |
| 18 | R | digitador | Text | - | ✅ | - | 17 |
| 19 | S | inventariado | Text | - | ✅ | **✅** | **18** |
| 20 | T | f_registro | DateTime | - | ✅ | **✅** | **19** |
| 21 | U | registrado_por | Text | - | ✅ | **✅** | **20** |

## 🔑 Puntos Clave

### Índices Críticos
```javascript
CONFIG.sheets.columns = {
    cod_patrim: 9,          // ← BÚSQUEDA (escanear aquí)
    inventariado: 18,       // ← ESCRITURA (SI/NO)
    f_registro: 19,         // ← ESCRITURA (fecha/hora)
    registrado_por: 20      // ← ESCRITURA (operador)
}
```

### Campos Principales
```javascript
// UBICACIÓN
nombre_local (0)
direccion_local (1)
bloque (2)
piso (3)
ambiente (4)
apellidos_nombres (5)
nombre_ofi (6)

// BIEN
descripcion_denominacion (10)
marca (11)
modelo (12)
color (13)
estado_conserv (14)

// CÓDIGOS
cod_inv (7)
cod_m (8)
cod_patrim (9) ← BÚSQUEDA

// REGISTRO
inventariado (18) ← SI/NO
f_registro (19) ← Fecha/Hora
registrado_por (20) ← Operador
```

## 📱 Flujo de Datos

```
ESCANEAR CÓDIGO
    ↓
findByCode(cod_patrim) [índice 9]
    ↓
rowToProduct() retorna 21 campos
    ↓
showProductModal() muestra:
  - Ubicación (campos 0-6)
  - Bien (campos 10-14)
  - Códigos (campos 7-9)
  - Información (campos 15-17)
    ↓
CLIC EN "SÍ, REGISTRAR"
    ↓
updateInventoryStatus()
    ↓
Apps Script escribe:
  - Columna S (19): inventariado = "SI"
  - Columna T (20): f_registro = "15/01/2024 14:30"
  - Columna U (21): registrado_por = "OPERADOR"
```

## 💾 Objeto Product

```javascript
{
  nombre_local: "ALCALDÍA",
  direccion_local: "Calle Principal 123",
  bloque: "A",
  piso: "2",
  ambiente: "Oficina",
  apellidos_nombres: "Juan Pérez García",
  nombre_ofi: "Recursos Humanos",
  cod_inv: "INV-001",
  cod_m: "M-001",
  cod_patrim: "PAT-2024-001",  // ← CLAVE DE BÚSQUEDA
  descripcion_denominacion: "Computadora de Escritorio",
  marca: "Dell",
  modelo: "OptiPlex 7090",
  color: "Negro",
  estado_conserv: "Bueno",
  fecha_inv: "10/01/2024",
  usuario: "admin",
  digitador: "juan.perez",
  inventariado: "SI",  // ← ESCRITURA
  f_registro: "15/01/2024 14:30",  // ← ESCRITURA
  registrado_por: "operador1"  // ← ESCRITURA
}
```

## 🔧 Configuración

### config.js
```javascript
sheets.columns = {
    // 21 propiedades con índices 0-20
    // CRÍTICO: cod_patrim: 9
    // CRÍTICO: inventariado: 18, f_registro: 19, registrado_por: 20
}
```

### sheets.js
```javascript
findByCode(code) {
    const codeColumn = CONFIG.sheets.columns.cod_patrim;  // = 9
}

rowToProduct(row) {
    const cols = CONFIG.sheets.columns;
    return {
        // 21 campos usando cols.{nombre}
    };
}

updateLocalData(rowIndex, date, operator) {
    const cols = CONFIG.sheets.columns;
    this.data[dataIndex][cols.inventariado] = 'SI';      // = 18
    this.data[dataIndex][cols.f_registro] = date;        // = 19
    this.data[dataIndex][cols.registrado_por] = operator; // = 20
}
```

### ui.js
```javascript
showProductModal(result, code, onUpdate) {
    // Muestra 21 campos en secciones:
    // 1. Información del Local
    // 2. Información de la Persona
    // 3. Descripción del Bien
    // 4. Información de Codificación
    // 5. Información Adicional
}
```

### google-apps-script.gs
```javascript
function doGet(e) {
    const f_registro = params.f_registro;       // ← Nuevo parámetro
    const registrado_por = params.registrado_por; // ← Nuevo parámetro
    
    sheet.getRange(rowIndex, 19).setValue(inventariado);    // S
    sheet.getRange(rowIndex, 20).setValue(f_registro);      // T
    sheet.getRange(rowIndex, 21).setValue(registrado_por);  // U
}
```

## 🧪 Testing Rápido

### Verificar config
```javascript
console.log(CONFIG.sheets.columns.cod_patrim);  // Debe ser 9
console.log(CONFIG.sheets.columns.f_registro);  // Debe ser 19
console.log(CONFIG.sheets.columns.registrado_por); // Debe ser 20
```

### Buscar producto
```javascript
const resultado = SheetsAPI.findByCode('PAT-2024-001');
console.log(Object.keys(resultado.product).length); // Debe ser 21
```

### Verificar Apps Script
```
GET /exec?sheetId=XXX&row=5&inventariado=SI&f_registro=15/01/2024%2014:30&registrado_por=operador1
```

## 🚨 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Bien no encontrado" | Código no existe en col J | Verificar Cod_Patrim en Excel |
| "No se actualiza el inventario" | Web App URL incorrecta | Copiar URL correcta del Apps Script |
| "Índice fuera de rango" | Excel no tiene 21 columnas | Agregar todas las columnas |
| "Parámetros inválidos" | Apps Script recibe parámetros antiguos | Verificar qu sheets.js envíe f_registro, registrado_por |

## 📍 Ubicaciones Importantes

```
Búsqueda:       findByCode() en sheets.js
Lectura:        rowToProduct() en sheets.js
Presentación:   showProductModal() en ui.js
Registro:       updateInventoryStatus() en sheets.js
Escritura:      doGet() en google-apps-script.gs
Configuración:  CONFIG.sheets.columns en config.js
```

## ⚡ Atajos

### Verificar integridad
```javascript
// Todos los 21 campos están presentes
Object.keys(CONFIG.sheets.columns).length === 21
```

### Limpiar caché
```javascript
localStorage.removeItem('cachedData');
localStorage.removeItem('sheetId');
```

### Ver logs de Apps Script
```
Google Sheet → Extensiones → Apps Script → Ejecuciones → Ver logs
```

---

**Última actualización**: 2024
**Versión**: 1.0
**Estado**: ✅ Completo y funcionando
