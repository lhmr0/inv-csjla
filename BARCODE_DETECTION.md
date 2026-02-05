# 🔍 Sistema de Detección de Códigos de Barras y QR

## Descripción General

Este sistema utiliza la librería **ZXing.js** para detectar códigos de barras y QR codes en tiempo real desde la cámara del dispositivo.

## 🎯 Formatos Soportados

El sistema puede detectar y decodificar los siguientes formatos:

- **Códigos de Barras (1D):**
  - `EAN-13` - Más común en retail
  - `EAN-8` - Versión compacta de EAN-13
  - `UPC-A` - Códigos de barras estadounidenses
  - `UPC-E` - Versión compacta de UPC-A
  - `Code 128` - Código alpanumérico flexible
  - `Code 39` - Código alfanumérico
  - `Codabar` - Usado en librerías y medicina
  - `ITF` - Interleaved Two of Five

- **Códigos 2D:**
  - `QR Code` - Código QR estándar
  - `Data Matrix` - Matriz de datos

## 🚀 Cómo Funciona

### 1. **Inicialización**
Cuando presiona **"Iniciar Cámara"**:
- Se solicita permiso de acceso a la cámara
- Se configuran los formatos a detectar con `TRY_HARDER` hint
- La cámara se activa y comienza el escaneo en tiempo real

### 2. **Detección en Tiempo Real**
Una vez la cámara está activa:
- Se ejecuta `decodeFromVideoDevice()` continuamente
- Cada frame se procesa automáticamente
- Cuando detecta un código, se ejecuta el callback

### 3. **Validación y Debounce**
- Los códigos se validan para evitar duplicados
- Hay un sistema de debounce de **1.5 segundos** entre detecciones
- Se produce vibración y sonido como confirmación

### 4. **Búsqueda de Producto**
Cuando se detecta un código:
1. Se muestra un **flash visual** en la pantalla
2. Se reproduce un **beep de confirmación**
3. Se busca el producto en Google Sheets
4. Se muestra un **modal** con la información
5. El usuario puede **marcar como inventariado**

## 🔧 Configuración Técnica

### Ubicación del Código
- **Scanner:** `js/scanner-html5qrcode.js`
- **Lógica principal:** `js/app.js`
- **Estilos:** `css/styles.css`

### Parámetros Clave

```javascript
debounceTime: 1500        // Ms entre detecciones del mismo código
TRY_HARDER: true          // Modo agresivo de detección
hints: [8 formatos]       // Formatos soportados
```

## 📋 Flujo de Ejecución

```
Usuario presiona "Iniciar Cámara"
           ↓
Solicitar permiso de acceso
           ↓
Inicializar ZXing con hints
           ↓
Conectar a dispositivo de cámara
           ↓
decodeFromVideoDevice() en loop
           ↓
¿Código detectado?
    ├─→ Sí: Validar y debounce
    │       ↓
    │       Vibración + Sonido + Flash
    │       ↓
    │       Buscar en Google Sheets
    │       ↓
    │       Mostrar Modal
    │
    └─→ No: Continuar escaneando
```

## ✅ Características de Detección

### Validación
- ✓ Código no vacío
- ✓ No duplicado dentro de 1.5s
- ✓ Se valida el formato

### Feedback al Usuario
- 🔊 **Sonido:** Beep de 1000Hz durante 100ms
- 📳 **Vibración:** Patrón [100, 50, 100]ms
- ⚡ **Flash Visual:** Overlay cyan de 400ms
- 💬 **Toast:** Notificación en pantalla

### Manejo de Errores
- Permisos denegados → Mensaje de alerta
- Cámara no disponible → Fallback automático
- Dispositivo no compatible → Mensaje informativo

## 🛠️ Solución de Problemas

### "No se detectan códigos"
1. ✓ Asegurar que la cámara tiene buena iluminación
2. ✓ Acercar el código a 10-20cm de la cámara
3. ✓ Verificar que el código no esté dañado o borroso
4. ✓ Intentar con código diferente (algunos formatos menos comunes pueden fallar)
5. ✓ Recargar página (Ctrl+Shift+R) e intentar de nuevo

### "Permiso de cámara rechazado"
1. Ir a Configuración del navegador
2. Buscar Permisos → Cámara
3. Permitir acceso para este sitio
4. Recargar página

### "Falsa detección"
- El sistema tiene debounce de 1.5s para evitar duplicados
- Si sigue detectando el mismo código, esperar 1.5s

## 📱 Dispositivos Compatibles

- ✓ Desktop (Chrome, Firefox, Edge)
- ✓ Tablets
- ✓ Smartphones (Android, iOS)
- ✓ PWA instalada como app nativa

## 🎓 Mejoras Futuras

- [ ] Enfoque automático en códigos
- [ ] Zoom digital para códigos lejanos
- [ ] Reducir más el tiempo de detección
- [ ] Soporte para códigos 3D
- [ ] Grabación de video de escaneo para auditoría

## 📚 Referencias

- [ZXing.js Documentation](https://github.com/zxing-js/library)
- [Barcode Standards](https://www.barcodable.com)
- [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

---

**Última actualización:** Febrero 5, 2026
**Versión:** 2.0 - Detección en tiempo real mejorada
