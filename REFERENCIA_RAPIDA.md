# 🔍 REFERENCIA RÁPIDA - Sistema Escáner v3.0

## 📍 Archivos Clave

```
Inventario/
├── index.html                    ← UI principal + canvas overlay
├── js/
│   ├── scanner-html5qrcode.js   ← Motor de escaneo (⭐ PRINCIPAL)
│   ├── app.js                   ← Lógica de aplicación
│   ├── config.js                ← Configuración
│   └── ...otros
├── css/
│   └── styles.css               ← Estilos (overlay incluido)
└── .github/workflows/
    └── deploy.yml               ← GitHub Pages auto-deploy
```

## 🎯 Flujo Principal (scanner-html5qrcode.js)

```javascript
init()          // Inicializa ZXing + obtiene elementos
  ↓
start()         // Comienza stream + polling
  ↓
scanFrame() [Cada 100ms]
  ├─ extractCentralRegion()
  │   └─ tryAllStrategies()
  │       └─ 6 estrategias
  │           ↓ Detectado → handleDetection() → Feedback
  │           ↓ No → Full image fallback
  │
  └─ drawScanBox()  // Dibuja overlay
  
stop()          // Detiene stream + polling
```

## 🔧 Métodos Principales

### `init(callback)`
```javascript
// Prepara el escáner
// Parámetro: función callback al detectar
// Retorna: Promise<boolean>

await BarcodeScanner.init((code, format) => {
    console.log('Detectado:', code, format);
});
```

### `start()`
```javascript
// Inicia cámara y polling
// Retorna: Promise<boolean>

await BarcodeScanner.start();
// Comienza polling cada 100ms
```

### `scanFrame()` 
```javascript
// Escanea UN frame (llamado cada 100ms automáticamente)
// 1. Extrae región central
// 2. Intenta 6 estrategias
// 3. Si falla → imagen completa
// 4. Dibuja overlay
// Sin retorno (interno)
```

### `tryAllStrategies(imageData)`
```javascript
// Aplica 6 estrategias a un imageData
// Retorna: true si detectó, false si no
// Llama drawScanBox(true) al detectar

const success = this.tryAllStrategies(myImageData);
```

### `extractCentralRegion(imageData)`
```javascript
// Extrae región 80% ancho × 40% alto del centro
// Retorna: Nuevo ImageData con solo esa región

const central = this.extractCentralRegion(fullImageData);
```

### `drawScanBox(detected = false)`
```javascript
// Dibuja overlay visual
// Parámetro: true=verde (detectado), false=cyan (buscando)
// Sin retorno

this.drawScanBox(true);  // Recuadro verde
this.drawScanBox(false); // Recuadro cyan
```

## 🎨 6 Estrategias de Detección

### 1. Original
```javascript
const result = multiFormatReader.decodeWithState(imageData);
```

### 2. Aggressive Contrast
```javascript
enhanceImageAggressive(imageData)
// contrast = 3.5
// brightness = -100
```

### 3. Binarization
```javascript
binarizeImage(imageData)
// gray > 130 ? 255 : 0
```

### 4. Invert Colors
```javascript
invertImage(imageData)
// pixel = 255 - pixel
```

### 5. Edge Detection (Sobel)
```javascript
applyEdgeDetection(imageData)
// magnitude = sqrt(gx² + gy²)
// value = magnitude > 100 ? 255 : 0
```

### 6. Adaptive Threshold
```javascript
adaptiveThreshold(imageData)
// Binariza usando promedio local (25x25)
```

## 📊 Parámetros Ajustables

```javascript
// En scanner-html5qrcode.js

// Polling
setInterval(() => this.scanFrame(), 100); // ms

// Contraste
const contrast = 3.5;        // 1.0-5.0

// Brillo
const brightness = -100;     // -200 a 0

// Umbral binarización
const value = gray > 130 ? 255 : 0; // 0-255

// Umbral edge detection  
const value = magnitude > 100 ? 255 : 0; // 0-255

// Ventana adaptativa
const blockSize = 25; // 15-35

// Debounce
this.debounceTime = 800; // ms
```

## 🎯 Casos de Uso

### Inicializar y Escanear
```javascript
// En app.js
async startScanner() {
    try {
        await BarcodeScanner.init((code, format) => {
            console.log('Código:', code, 'Formato:', format);
            this.handleCodeDetected(code, format);
        });
        
        await BarcodeScanner.start();
    } catch (err) {
        console.error('Error:', err);
    }
}
```

### Detener Escáner
```javascript
stopScanner() {
    BarcodeScanner.stop();
    // Detiene cámara y polling
}
```

### Cambiar Cámara
```javascript
switchCamera() {
    // Cicla entre cámaras disponibles
    BarcodeScanner.switchCamera();
}
```

## 🎨 UI Elements

### Canvas Overlay
```html
<canvas id="scannerOverlay" 
        style="position: absolute; 
               top: 0; left: 0; 
               border-radius: 12px; 
               cursor: crosshair;"></canvas>
```

### Video Container
```html
<div id="video" style="position: relative; 
                        width: 100%; 
                        aspect-ratio: 16/9;"></div>
```

## 🔍 Debug Console

### Ver logs activos
```javascript
// Abrir F12 → Console

// Ver estado del escaneo
BarcodeScanner.isRunning        // true/false

// Ver último código detectado
BarcodeScanner.lastDetectedCode // "740899503754"

// Ver intervalo de polling
BarcodeScanner.scanningInterval // ID del interval

// Ver dispositivos conectados
BarcodeScanner.devices          // Array de cámaras
BarcodeScanner.currentDeviceIndex // Índice actual
```

## ⚡ Performance Tips

### Aumentar Velocidad
```javascript
// Cambiar polling de 100ms a 50ms
setInterval(() => this.scanFrame(), 50);

// Reducir debounce de 800ms a 500ms
this.debounceTime = 500;

// Aumentar sensibilidad edge detection
const value = magnitude > 50 ? 255 : 0;
```

### Mejorar Precisión
```javascript
// Aumentar contraste
const contrast = 4.5; // Cambiar de 3.5

// Reducir brillo más
const brightness = -150; // Cambiar de -100

// Umbral adaptativo más agresivo
const blockSize = 35; // Cambiar de 25
```

## 🆘 Debugging

### No detecta
```javascript
// En scanFrame(), agregar logs:
console.log('Región central:', centralRegion);
console.log('Intentando estrategias...');

// Verificar que ZXing está cargado
typeof ZXing !== 'undefined'   // Debe ser true

// Verificar stream
this.videoElement.readyState   // Debe ser 4
```

### Lento
```javascript
// Medir tiempo de scanFrame
console.time('scanFrame');
this.scanFrame();
console.timeEnd('scanFrame');

// Debería ser < 50ms
```

### Memory leak
```javascript
// Ver memoria en DevTools
// Abrir → Memory tab
// Tomar snapshot → buscar crecimiento

// Si crece: Posible leak en copyImageData()
// Solución: Usar pool de ImageData
```

## 📚 Estructuras de Datos

### ImageData
```javascript
{
    data: Uint8ClampedArray,  // Píxeles RGBA
    width: number,             // Ancho en píxeles
    height: number             // Alto en píxeles
}

// Acceso a píxel (x, y):
const idx = (y * width + x) * 4;
const r = data[idx];
const g = data[idx + 1];
const b = data[idx + 2];
const a = data[idx + 3];
```

### Hints ZXing
```javascript
{
    DecodeHintType.POSSIBLE_FORMATS: [
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13,
        BarcodeFormat.QR_CODE,
        // ...
    ],
    DecodeHintType.TRY_HARDER: true
}
```

## 🔗 Relaciones entre Módulos

```
app.js (Lógica principal)
  ├─ Llama: BarcodeScanner.init()
  ├─ Llama: BarcodeScanner.start()
  ├─ Escucha: callback (código detectado)
  └─ Llama: BarcodeScanner.stop()

scanner-html5qrcode.js (Motor)
  ├─ Usa: ZXing.js (detección)
  ├─ Usa: Canvas 2D (pre-procesamiento)
  ├─ Usa: MediaDevices API (cámara)
  └─ Llama: onDetected callback

styles.css (Estilos)
  └─ Estiliza: modal + botones + overlay
```

## 📝 Convenciones

```javascript
// Nombres
this.isRunning              // boolean con 'is'
this.currentDeviceIndex     // índice con 'Index'
this.lastDetectedCode       // variable importante con '_Code'
this.debounceTime           // config con 'Time'

// Métodos privados (pseudo-privados)
scanFrame()                 // Interno (no llamar directo)
handleDetection()           // Interno

// Métodos públicos
init()                      // API externa
start()                     // API externa
stop()                      // API externa
```

## 🎓 Ejemplo de Extensión

### Agregar nueva estrategia

```javascript
// 1. Crear método
blurryThreshold(imageData) {
    // Tu lógica aquí
    return processedImageData;
}

// 2. Agregar a tryAllStrategies()
let blurred = this.blurryThreshold(this.copyImageData(imageData));
try {
    const result = this.multiFormatReader.decodeWithState(blurred);
    if (result) {
        this.handleDetection(result.getText());
        this.drawScanBox(true);
        return true;
    }
} catch (e) {}

// ¡Listo! Ahora tienes 7 estrategias
```

---

## 📞 Soporte Rápido

| Problema | Solución |
|----------|----------|
| No detecta | Revisar iluminación, aumentar contraste |
| Lento | Reducir intervalo de 100ms a 50ms |
| Memory leak | Revisar copyImageData() |
| Crash | Ver console.error() |
| Sin permiso cámara | Verificar navegador |

---

**Versión:** 3.0  
**Última Actualización:** 2024  
**Estado:** ✅ Producción
