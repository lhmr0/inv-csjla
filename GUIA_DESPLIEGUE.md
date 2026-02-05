# 🚀 GUÍA DE DESPLIEGUE - Sistema de Inventario 21 Campos

## Paso 1: Preparar Google Sheet

### Estructura Excel (21 columnas)
```
Fila 1 (Headers):
A: Nombre_Local
B: Direccion_Local
C: Bloque
D: Piso
E: Ambiente
F: Apellidos_Nombres
G: Nombre_Ofi
H: Cod_inv
I: Cod_M
J: Cod_Patrim
K: Descripcion_Denominacion
L: Marca
M: Modelo
N: Color
O: Estado_Conserv
P: Fecha_Inv
Q: Usuario
R: Digitador
S: INVENTARIADO
T: F_REGISTRO
U: REGISTRADO_POR
```

### Compartir Hoja
1. Google Sheet → Compartir (engranaje arriba a la derecha)
2. "Personas": Agregar "Cualquiera"
3. Seleccionar: "Acceso público - Leer"
4. Copiar ID de la URL: `/spreadsheets/d/{ID}/`

## Paso 2: Desplegar Google Apps Script

### Crear nuevo Apps Script
1. Ir a [script.google.com](https://script.google.com)
2. Nuevo proyecto
3. Pegar contenido de `google-apps-script.gs`
4. Guardar (Ctrl+S)
5. Desplegar → Nueva implementación
6. Tipo: "Aplicación web"
7. Usuario: "Yo mismo"
8. Ejecutar como: [Tu cuenta]
9. Copiar URL de implementación

### Ejemplo de URL:
```
https://script.google.com/macros/s/AKfycbwnYwze4g9Ax5ACdd9RblheVueboaGY7YaFINLK6IiDNLx58YJ.../exec
```

## Paso 3: Configurar la App

### Actualizar config.js
```javascript
CONFIG.defaults.sheetId = '1cIPjvg6Kfi79d6810JosSKCk4HSYcxqNYpTtdZ28bYQ'; // Tu ID
CONFIG.defaults.webAppUrl = 'https://script.google.com/macros/s/...'; // Tu URL
CONFIG.defaults.sheetName = 'Inventario'; // Nombre de tu hoja
```

### O usar la interfaz de la app:
1. Abrir `index.html` en navegador
2. ⚙️ Configuración
3. Pegar Google Sheet URL
4. Pegar Web App URL
5. Guardar

## Paso 4: Prueba Básica

### Verificar conexión
1. Abrir `index.html`
2. Ver que aparece: "✅ Google Sheet conectado"
3. En consola (F12): Ver logs de carga

### Buscar un bien
1. Seleccionar "Cámara" o "Código Manual"
2. Escanear/ingresar código de patrimonio (columna J)
3. Verificar que aparecen los 21 campos
4. Si no aparece nada: Revisar código de patrimonio en Excel

### Registrar un bien
1. Hacer clic en "Sí, Registrar Bien"
2. Verificar en Google Sheet:
   - Columna S (INVENTARIADO): debe ser "SI"
   - Columna T (F_REGISTRO): debe tener fecha/hora
   - Columna U (REGISTRADO_POR): debe tener nombre del operador

## Paso 5: Troubleshooting

### "No se puede acceder al documento"
- ✅ Verificar que Sheet esté compartido públicamente
- ✅ Verificar que el ID sea correcto (sin /edit)
- ✅ Esperar 1 minuto después de compartir

### "Código no encontrado"
- ✅ Verificar que el código existe en columna J (Cod_Patrim)
- ✅ Verificar que no hay espacios extra al escanear
- ✅ Verificar que la primera fila sea headers (no se busca en fila 1)

### "Error al actualizar el inventario"
- ✅ Abrir Apps Script → Ejecuciones
- ✅ Ver error exacto en el registro
- ✅ Verificar que Web App URL es correcta
- ✅ Verificar que el Apps Script tiene permisos en el Sheet

### Acceso denegado en Apps Script
1. Abrir Google Sheet
2. Extensiones → Apps Script (desde el Sheet, no script.google.com)
3. Pegar código de google-apps-script.gs
4. Guardar
5. Esto dará permisos automáticamente

## Configuración Manual (Sin interfaz)

Si quieres configurar sin usar la interfaz:

### 1. Editar config.js
```javascript
const CONFIG = {
    defaults: {
        sheetId: 'TU_ID_AQUI',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/TU_ID_AQUI/edit',
        webAppUrl: 'https://script.google.com/macros/s/TU_URL_AQUI/exec',
        sheetName: 'Inventario'
    },
    // ... resto igual
};
```

### 2. Limpiar Storage
```javascript
// En consola (F12):
localStorage.clear();
```

### 3. Recargar la app
```
Ctrl+F5 (limpiar caché)
```

## URLs Requeridas

### Sheet (Lectura)
```
https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=Inventario
```

### Apps Script (Escritura)
```
https://script.google.com/macros/s/{ID}/exec?sheetId=...&sheetName=...&row=5&inventariado=SI&f_registro=15/01/2024%2014:30&registrado_por=OPERADOR
```

## Checklist de Despliegue

```
☐ Google Sheet creado con 21 columnas
☐ Datos de prueba agregados
☐ Sheet compartido públicamente
☐ Apps Script creado y desplegado
☐ URL de Apps Script copiada
☐ config.js actualizado
☐ index.html probado localmente
☐ Búsqueda funciona (encuentra código)
☐ Modal muestra 21 campos
☐ Registro actualiza columnas S, T, U
☐ Logs en consola no muestran errores
```

## Comandos Útiles

### Ver logs en Apps Script
```
Apps Script → Ejecuciones → Ver logs
```

### Probar URL directamente
```
Copiar URL del Apps Script, agregar parámetros y probar en navegador
```

### Invalidar caché
```javascript
// En consola:
localStorage.removeItem('cachedData');
localStorage.removeItem('sheetId');
```

## Soporte

Si algo no funciona:
1. Abrir consola (F12 → Console)
2. Ver errores rojo
3. Abrir Apps Script → Ejecuciones
4. Ver logs y errores
5. Revisar que config.js tenga URLs correctas

---

**Tiempo estimado de despliegue**: 10-15 minutos
**Requisitos**: Cuenta Google, navegador moderno
**Versión**: 1.0 con 21 campos
