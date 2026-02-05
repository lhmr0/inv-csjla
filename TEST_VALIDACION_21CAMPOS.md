# 🧪 TEST DE VALIDACIÓN - 21 Campos

## Verificación Automatizada

### 1. config.js - Campos Mapeados

**Esperado**: 21 propiedades en CONFIG.sheets.columns

```javascript
// Verificar en consola:
console.assert(Object.keys(CONFIG.sheets.columns).length === 21, '❌ config.js no tiene 21 campos');
console.assert(CONFIG.sheets.columns.cod_patrim === 9, '❌ cod_patrim no está en índice 9');
console.assert(CONFIG.sheets.columns.inventariado === 18, '❌ inventariado no está en índice 18');
console.assert(CONFIG.sheets.columns.f_registro === 19, '❌ f_registro no está en índice 19');
console.assert(CONFIG.sheets.columns.registrado_por === 20, '❌ registrado_por no está en índice 20');
```

**Resultado**: ✅ PASS si no hay errores

---

### 2. sheets.js - rowToProduct()

**Esperado**: Retorna 21 campos

```javascript
// Verificar en consola:
const testRow = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u'];
const product = SheetsAPI.rowToProduct(testRow);
console.assert(Object.keys(product).length === 21, '❌ rowToProduct no retorna 21 campos');
console.assert(product.nombre_local === 'a', '❌ nombre_local mal asignado');
console.assert(product.cod_patrim === 'j', '❌ cod_patrim mal asignado (índice 9)');
console.assert(product.registrado_por === 'u', '❌ registrado_por mal asignado (índice 20)');
```

**Resultado**: ✅ PASS si no hay errores

---

### 3. ui.js - showProductModal()

**Esperado**: Modal muestra todos los campos

```javascript
// Verificar en el DOM después de hacer clic en "Sí, Registrar":
const modal = document.getElementById('modalBody');
const campos = {
    'nombre_local': 'Nombre del Local',
    'direccion_local': 'Dirección',
    'bloque': 'Bloque',
    'piso': 'Piso',
    'ambiente': 'Ambiente',
    'apellidos_nombres': 'Apellidos y Nombres',
    'nombre_ofi': 'Oficina',
    'cod_inv': 'Código Inventario',
    'cod_m': 'Código M',
    'cod_patrim': 'Código de Patrimonio',
    'descripcion_denominacion': 'Descripción',
    'marca': 'Marca',
    'modelo': 'Modelo',
    'color': 'Color',
    'estado_conserv': 'Estado de Conservación',
    'fecha_inv': 'Fecha de Inventario',
    'usuario': 'Usuario',
    'digitador': 'Digitador'
};

for (const [campo, label] of Object.entries(campos)) {
    console.assert(
        modal.textContent.includes(label),
        `❌ El campo "${label}" no se muestra en el modal`
    );
}
```

**Resultado**: ✅ PASS si los campos aparecen

---

### 4. google-apps-script.gs - Parámetros

**Esperado**: Apps Script recibe nuevos parámetros

```
GET /exec?sheetId=XXX&sheetName=YYY&row=5&inventariado=SI&f_registro=15/01/2024%2014:30&registrado_por=operador

Parámetros esperados:
- sheetId ✓
- sheetName ✓
- row ✓
- inventariado ✓
- f_registro ✓ (nuevo)
- registrado_por ✓ (nuevo)

Columnas esperadas:
- Columna 19 (S): INVENTARIADO
- Columna 20 (T): F_REGISTRO
- Columna 21 (U): REGISTRADO_POR
```

**Verificación**: Ver en Google Sheet después de hacer clic "Sí, Registrar"

---

### 5. sheets.js - updateLocalData()

**Esperado**: Actualiza índices correctos

```javascript
// Verificar en sheets.js:
const cols = CONFIG.sheets.columns;
console.assert(cols.inventariado === 18, '❌ inventariado index incorrecto');
console.assert(cols.f_registro === 19, '❌ f_registro index incorrecto');
console.assert(cols.registrado_por === 20, '❌ registrado_por index incorrecto');

// Verificar que updateLocalData actualiza estos índices:
// this.data[dataIndex][18] = 'SI';
// this.data[dataIndex][19] = date;
// this.data[dataIndex][20] = operator;
```

**Resultado**: ✅ PASS si los índices son correctos

---

## Test de Integración Completa

### Flujo Manual

1. **Preparación**
   ```
   ☐ Abrir index.html
   ☐ Verificar en F12 Console no hay errores
   ☐ Presionar ⚙️ Configuración
   ☐ Ingresar URLs correctas
   ☐ Guardar
   ☐ Ver mensaje "✅ Google Sheet conectado"
   ```

2. **Búsqueda**
   ```
   ☐ Seleccionar pestaña "Escáner"
   ☐ Presionar "Iniciar Cámara" o "Código Manual"
   ☐ Escanear/ingresar código de patrimonio válido (columna J)
   ☐ Sistema debe encontrar el bien
   ```

3. **Visualización**
   ```
   ☐ Aparece modal con:
     ☐ Sección "🏢 Información del Local" (5 campos)
     ☐ Sección "👤 Información de la Persona" (2 campos)
     ☐ Sección "📦 Descripción del Bien" (5 campos)
     ☐ Sección "🔖 Información de Codificación" (3 campos)
     ☐ Sección "📋 Información Adicional" (3 campos)
     ☐ Todos los 18 campos de solo lectura
   ```

4. **Registro**
   ```
   ☐ Hacer clic "✅ Sí, Registrar Bien"
   ☐ Verificar en Google Sheet que se actualizó:
     ☐ Columna S (INVENTARIADO) = "SI"
     ☐ Columna T (F_REGISTRO) = fecha/hora actual
     ☐ Columna U (REGISTRADO_POR) = nombre del operador
   ```

5. **Revalidación**
   ```
   ☐ Escanear el mismo código nuevamente
   ☐ Debe aparecer ✅ "Este bien ya fue registrado"
   ☐ Mostrar: "Por: [operador] - [fecha/hora]"
   ☐ Las tres columnas deben estar llenas
   ```

---

## Validación de Datos

### Formato Esperado

| Campo | Tipo | Ejemplo | Validación |
|-------|------|---------|-----------|
| nombre_local | Text | "ALCALDÍA" | No vacío |
| direccion_local | Text | "Calle Principal 123" | No vacío |
| bloque | Text | "A" | Alfanumérico |
| piso | Text | "2" | Numérico/Texto |
| ambiente | Text | "Oficina" | No vacío |
| apellidos_nombres | Text | "Juan Pérez" | No vacío |
| nombre_ofi | Text | "Recursos Humanos" | Texto |
| cod_inv | Text | "INV-001" | Alfanumérico |
| cod_m | Text | "M-001" | Alfanumérico |
| cod_patrim | Text | "PAT-2024-001" | **Clave primaria** |
| descripcion_denominacion | Text | "Computadora de Escritorio" | No vacío |
| marca | Text | "Dell" | Texto |
| modelo | Text | "OptiPlex 7090" | Alfanumérico |
| color | Text | "Negro" | Texto |
| estado_conserv | Text | "Bueno" | Enum: Bueno/Regular/Malo |
| fecha_inv | Date | "10/01/2024" | Formato DD/MM/YYYY |
| usuario | Text | "admin" | Texto |
| digitador | Text | "juan.perez" | Texto |
| inventariado | Text | "SI" o "NO" | **Enum: SI/NO** |
| f_registro | DateTime | "15/01/2024 14:30" | **Formato DD/MM/YYYY HH:MM** |
| registrado_por | Text | "operador1" | **Nombre del operador** |

---

## Checklist de Validación

```
CONFIGURACIÓN
☐ CONFIG.sheets.columns tiene 21 propiedades
☐ Índices van de 0 a 20
☐ cod_patrim = 9 (búsqueda)
☐ inventariado = 18 (escritura)
☐ f_registro = 19 (escritura)
☐ registrado_por = 20 (escritura)

DATA
☐ rowToProduct() retorna 21 campos
☐ Todos los campos tienen valores por defecto ('')
☐ No hay errores al cargar datos

UI
☐ Modal muestra 6 secciones organizadas
☐ Todos los 21 campos son visibles
☐ Estilos aplicados correctamente (colores, emojis)
☐ Botones funcionan correctamente

APPS SCRIPT
☐ Recibe parámetros correctos
☐ Valida sheetId y row
☐ Escribe en columnas 19, 20, 21
☐ Retorna respuesta JSON correcta

INTEGRACIÓN
☐ Búsqueda funciona (encuentra por cod_patrim)
☐ Modal muestra datos correctos
☐ Registro actualiza Google Sheet
☐ Validación redetecta bien registrado
☐ No hay errores en consola
```

---

## Comandos para Testing

### Verificar integridad en consola (F12)

```javascript
// Test 1: Config
console.log('📋 Campos:', Object.keys(CONFIG.sheets.columns).length);
console.log('📋 cod_patrim index:', CONFIG.sheets.columns.cod_patrim);
console.log('📋 f_registro index:', CONFIG.sheets.columns.f_registro);

// Test 2: Datos
const testRow = Array(21).fill('test');
const prod = SheetsAPI.rowToProduct(testRow);
console.log('📦 Producto campos:', Object.keys(prod).length);

// Test 3: Búsqueda
const result = SheetsAPI.findByCode('CODIGO_PATRIM');
if (result) {
  console.log('✅ Encontrado:', result.product);
} else {
  console.log('❌ No encontrado');
}

// Test 4: Actualizar
await SheetsAPI.updateInventoryStatus(5, 'TEST_OPERATOR');
console.log('✅ Actualización enviada');
```

---

**Fecha de validación**: 2024
**Versión de prueba**: 1.0
**Estado esperado**: ✅ Todo PASS
