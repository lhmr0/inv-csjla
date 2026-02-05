# 🚀 Instrucciones Rápidas: OCR con Selección de Usuario

## ¿Qué cambió?

**ANTES** ❌
```
Escanea → OCR lee → Busca automáticamente → Resultado
```

**AHORA** ✅
```
Escanea → OCR lee → USUARIO elige → Busca lo seleccionado → Resultado
```

---

## 📱 Cómo Usar

### En la App Principal (index.html)

1. **Inicia sesión** y ve a la pestaña "SCANNER"
2. **Haz click en "Iniciar Escaneo"**
3. **Apunta la cámara a un código** (barras, QR, números impresos)
4. **Espera a que aparezca el modal** con el texto que leyó OCR
5. **Selecciona con el ratón** la parte que quieres buscar (o deja todo seleccionado)
6. **Haz click en "✅ Buscar Seleccionado"**
7. **Listo** - El producto aparecerá si existe

### En la Página de Prueba (test-ocr-selection.html)

1. **Abre** `test-ocr-selection.html` en el navegador
2. **Click en "▶️ Iniciar Cámara"** - Autoriza acceso a cámara
3. **Apunta a un código/número**
4. **Click en "📸 Capturar Frame"** - Captura y procesa
5. **Selecciona el texto** que quieres buscar
6. **Click en "🔍 Buscar Seleccionado"**
7. **Verás un alert** con lo que buscaría

---

## 🎯 El Modal Explicado

```
┌─────────────────────────────────────────┐
│  📋 Texto OCR Leído                     │  ← Título
├─────────────────────────────────────────┤
│ Selecciona el texto que deseas buscar:  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │  12345XYZ789ABC                     │ │  ← Textarea
│ │  (Puedes seleccionar solo parte)    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Caracteres seleccionados: 5             │  ← Contador
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [📋 Copiar] [🔄 Limpiar]            │ │  ← Botones helpers
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [❌ Cancelar]    [✅ Buscar Seleccionado] │  ← Acciones finales
└─────────────────────────────────────────┘
```

### Botones del Modal

| Botón | Función |
|-------|---------|
| **📋 Copiar Todo** | Copia el texto completo |
| **🔄 Limpiar** | Borra lo que seleccionaste |
| **❌ Cancelar** | Cierra sin buscar |
| **✅ Buscar** | Busca lo seleccionado (o todo) |

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Código de Barras Sucio
```
OCR Lee:  "12345A6789"
Problema: Leyó una "A" por un "0"
Solución: Selecciona "12345" + "6789" (sin la A)
Resultado: Busca "123456789" ✅
```

### Ejemplo 2: Código Parcial
```
OCR Lee:  "12345CODIGO67890"
Quieres: Solo el código 
Solución: Selecciona "CODIGO"
Resultado: Busca solo "CODIGO" ✅
```

### Ejemplo 3: Confianza en OCR
```
OCR Lee:  "987654XYZ"
Perfecto:  Es lo que necesitas
Solución: No selecciones nada (o selecciona todo)
Resultado: Busca "987654XYZ" ✅
```

---

## ⚙️ Detrás de Escenas

### Qué Hace OCR
- Lee texto/números de imágenes usando **Tesseract.js**
- Mejora la imagen (aumenta contraste) para mejor lectura
- Convierte a escala de grises y binariza
- Tarda ~500-1000ms por frame

### Cómo Selecciona
- **Click y arrastra** en el textarea para seleccionar
- **Triple-click** para seleccionar una línea
- **Ctrl+A** para seleccionar todo
- El contador muestra caracteres en tiempo real

### Cómo Busca
- Cuando confirmas, llama `BarcodeScanner.searchCode(texto)`
- Luego busca en la base de datos de productos
- Si existe, muestra los detalles
- Si no existe, muestra "Producto no encontrado"

---

## 🔧 Configuración (Para Desarrolladores)

### En `scanner-ocr.js`
```javascript
// Cambiar tiempo de análisis (ms)
this.analysisInterval = 500;  // Cada 500ms

// Cambiar factor de contraste
const contrast = ((gray - 128) * 2.5) + 128;  // 2.5x
// Aumentar a 3.0 si OCR falla mucho, bajar a 2.0 si es muy agresivo
```

### En `ui.js`
```javascript
// Personalizar textos del modal
modal.innerHTML = `...`  // Edita aquí los textos
```

### En `styles.css`
```css
.ocr-text-area {
    font-size: 1rem;  /* Aumentar si quieres más grande */
    min-height: 200px;  /* Aumentar altura */
}
```

---

## ❓ Preguntas Frecuentes

**P: ¿Y si OCR Lee Mal?**
A: Por eso existe la selección. Ves lo que leyó, corriges y buscas.

**P: ¿Puedo buscar solo parte del código?**
A: Sí, selecciona solo esa parte en el modal.

**P: ¿Qué pasa si cancelo?**
A: Se cierra el modal sin hacer nada. Puedes intentar de nuevo.

**P: ¿Cómo mejoro la lectura OCR?**
A: Asegúrate que el código esté claro, iluminado y enfocado.

**P: ¿Puedo editar el texto?**
A: No, es readonly. Pero puedes seleccionar lo que quieras buscar.

---

## 🎬 Flujo Visual Completo

```
┌──────────────┐
│  Aplicación  │
│  Abierta     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Click:       │
│ Iniciar      │
│ Escaneo      │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Cámara Activa    │
│ Buscando código  │
│ (Video en vivo)  │
└──────┬───────────┘
       │
       │ (Usuario apunta a código)
       │
       ▼
┌──────────────────┐
│ OCR Detecta      │
│ Texto/Números    │
│ (500-1000ms)     │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────┐
│  MODAL DE SELECCIÓN      │
│  ┌────────────────────┐  │
│  │ [Texto OCR Leído]  │  │
│  │ > Usuario          │  │
│  │ > Selecciona       │  │
│  │ > Confirma         │  │
│  └────────────────────┘  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────┐
│ Sistema Busca    │
│ Producto         │
│ (Con texto       │
│  seleccionado)   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Muestra          │
│ Resultado        │
│ (Si existe)      │
└──────────────────┘
```

---

## 📊 Estadísticas

Durante el test, verás:
- **FPS**: Frames por segundo capturados
- **Resolución**: Tamaño de video (ej: 1280x720)
- **Frames capturados**: Cuántos has procesado con OCR

---

**¡Listo para usar! 🎉**

Cualquier duda, revisa los logs en la página de prueba o abre la consola (F12) para ver mensajes detallados.
