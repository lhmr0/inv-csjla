# 📦 Sistema de Inventario con Escáner de Códigos de Barras

Sistema web en JavaScript vanilla para gestión de inventario mediante escaneo de códigos de barras desde dispositivos móviles, con integración a Google Sheets.

## 🚀 Características

- ✅ **Escaneo de códigos de barras** usando la cámara del celular
- ✅ **Múltiples formatos soportados**: EAN, UPC, Code 128, Code 39, Code 93, Codabar, etc.
- ✅ **Integración con Google Sheets** para base de datos
- ✅ **Modo offline** con caché local
- ✅ **PWA instalable** en dispositivos móviles
- ✅ **Historial de escaneos** con exportación
- ✅ **Estadísticas en tiempo real**
- ✅ **Interfaz responsiva** optimizada para móviles

## 📋 Requisitos

1. **Navegador moderno** con soporte para:
   - WebRTC (acceso a cámara)
   - LocalStorage
   - Service Workers

2. **Google Sheet** configurado con las siguientes columnas:
   - A: Código (código de barras)
   - B: Descripción
   - C: Categoría
   - D: Ubicación
   - E: Cantidad
   - F: Inventariado (SI/NO)
   - G: Fecha Inventario
   - H: Realizado Por
   - I: Observaciones

## 🔧 Instalación

### Opción 1: Servidor Local

1. Clona o descarga este repositorio
2. Abre una terminal en la carpeta del proyecto
3. Inicia un servidor local:

```bash
# Con Python 3
python -m http.server 8080

# Con Node.js (si tienes http-server instalado)
npx http-server -p 8080

# Con PHP
php -S localhost:8080
```

4. Abre `http://localhost:8080` en tu navegador

### Opción 2: Hosting Gratuito

Puedes subir los archivos a:
- **GitHub Pages**: Gratis, solo archivos estáticos
- **Netlify**: Gratis, con deploy automático
- **Vercel**: Gratis, con deploy automático

## 📊 Configuración de Google Sheets

### 1. Crear el Spreadsheet

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva hoja de cálculo
3. Configura las columnas como se indica arriba
4. Agrega tus productos con sus códigos de barras

### 2. Compartir el Documento

1. Haz clic en "Compartir"
2. Cambia a "Cualquiera con el enlace"
3. Selecciona permisos de "Editor"
4. Copia la URL del documento

### 3. (Opcional) Configurar Apps Script para Actualizaciones

Para habilitar actualizaciones automáticas:

1. Ve a **Extensiones > Apps Script**
2. Pega el siguiente código:

```javascript
function doGet(e) {
  const params = e.parameter;
  
  const sheetId = params.sheetId;
  const sheetName = params.sheetName || 'Hoja1';
  const row = parseInt(params.row);
  const inventariado = params.inventariado || 'SI';
  const fecha = params.fecha;
  const operador = params.operador;
  const observaciones = params.observaciones || '';
  
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(sheetName);
    
    // Columnas: F=Inventariado, G=Fecha, H=Operador, I=Observaciones
    sheet.getRange(row, 6).setValue(inventariado);
    sheet.getRange(row, 7).setValue(fecha);
    sheet.getRange(row, 8).setValue(operador);
    if (observaciones) {
      sheet.getRange(row, 9).setValue(observaciones);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Inventario actualizado'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Guarda y despliega como **Aplicación Web**
4. Copia la URL del Web App

## 📱 Uso de la Aplicación

### Primer Uso

1. Abre la aplicación en tu navegador móvil
2. Ingresa tu nombre (operador)
3. Pega la URL de Google Sheets
4. Presiona "Conectar"

### Escanear Códigos

1. Ve a la pestaña "Escanear"
2. Presiona "Iniciar Cámara"
3. Permite el acceso a la cámara
4. Apunta al código de barras
5. El sistema detectará automáticamente el código

### Entrada Manual

1. Ve a la pestaña "Manual"
2. Escribe el código de barras
3. Presiona "Buscar"

### Marcar como Inventariado

1. Cuando se muestre el producto, presiona "Marcar Inventariado"
2. Opcionalmente agrega observaciones
3. El sistema actualizará Google Sheets

## 🛠️ Personalización

### Cambiar Columnas

Edita `js/config.js` para ajustar las columnas:

```javascript
columns: {
    codigo: 0,           // A
    descripcion: 1,      // B
    categoria: 2,        // C
    // ... ajustar según tu estructura
}
```

### Cambiar Formatos de Código

En `js/config.js`, modifica los formatos soportados:

```javascript
formats: [
    'code_128_reader',
    'ean_reader',
    'ean_8_reader',
    // Agregar o quitar formatos
]
```

### Cambiar Estilos

Modifica `css/styles.css` para personalizar colores y diseño.

## 🔒 Seguridad

- Los datos se almacenan localmente en el navegador
- La conexión con Google Sheets es directa (sin servidor intermedio)
- Se recomienda usar HTTPS para mayor seguridad
- No se almacenan contraseñas

## 🐛 Solución de Problemas

### La cámara no funciona
- Verifica que estés usando HTTPS o localhost
- Permite el acceso a la cámara en la configuración del navegador
- Prueba con otro navegador (Chrome recomendado)

### No se conecta a Google Sheets
- Verifica que la URL sea correcta
- Asegúrate de que el documento esté compartido públicamente
- Revisa la consola del navegador para errores

### Los códigos no se detectan
- Asegura buena iluminación
- Mantén el código a 15-20 cm de la cámara
- Limpia la lente de la cámara
- Prueba con entrada manual

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

---

Desarrollado con ❤️ para facilitar la gestión de inventarios
