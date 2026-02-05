# 🚀 GUÍA DE DEPLOYMENT Y TESTING - Sistema Escáner v3.0

## 🎯 Objetivo
Verificar que la detección de códigos de barras funciona con el nuevo overlay visual y 6 estrategias de detección simultáneas.

## 📋 Prerequisitos
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Dispositivo con cámara web
- HTTPS o localhost (seguridad del navegador)
- Permiso de acceso a cámara

## 🧪 Test Local

### Step 1: Verificar Archivos
```bash
# Archivos clave que deben existir:
✓ index.html                      # UI principal
✓ js/scanner-html5qrcode.js      # Motor de escaneo (850+ líneas)
✓ js/app.js                       # Lógica de aplicación
✓ css/styles.css                  # Estilos
✓ .github/workflows/deploy.yml    # CI/CD
```

### Step 2: Abrir en Navegador
```
1. Abre: file:///c:/Users/LOCALADMINPJ/Music/Inventario/index.html
   (O copia la ruta completa en navegador)

2. Deberías ver:
   - Encabezado: "Inventario - CSJLA"
   - Botón azul: "Iniciar Escaneo"
   - Fondo blanco
   - Modal normalmente cerrado
```

### Step 3: Dar Permisos de Cámara
```
1. Haz clic en "Iniciar Escaneo"
2. Navegador pedirá: "¿Permitir acceso a cámara?"
3. Selecciona: ✓ Permitir (Allow)
4. Espera 1-2 segundos para que se cargue
```

### Step 4: Verificar Overlay Visual
```
Deberías ver en la pantalla:
┌─────────────────────────────────────────────┐
│                                             │
│  Video en vivo de tu cara/objeto            │
│                                             │
│   ╔═══════════════════════════════════╗   │
│   ║                                   ║   │
│   ║  "Coloca el código aquí" (texto)  ║   │
│   ║                                   ║   │
│   ║     [Video vivo aquí]             ║   │
│   ║                                   ║   │
│   ║     (Área clara)                  ║   │
│   ║                                   ║   │
│   ╚═══════════════════════════════════╝   │
│                                             │
│  [Fondo oscuro]                             │
│                                             │
│  Color del recuadro: CYAN (#06B6D4)        │
│  Grosor línea: 2px                          │
│  Esquinas: Decorativas (30px)              │
└─────────────────────────────────────────────┘
```

✅ **Checkpoints:**
- [ ] Video carga en tiempo real
- [ ] Recuadro cyan es visible
- [ ] Texto "Coloca el código aquí" aparece
- [ ] Fondo fuera del recuadro está más oscuro
- [ ] Esquinas decorativas en las 4 esquinas

### Step 5: Probar con Barcode Real

**Para Code 128 (740899503754):**

```
1. Abre imagen del barcode o imprime etiqueta
2. Coloca dentro del recuadro cyan
3. Posición ideal: centrado, horizontal
4. Iluminación: buena luz (no contraluces)
5. Ángulo: perpendicular a cámara
6. Distancia: 15-30cm de la cámara
```

**Esperado al detectar:**
```
✅ Recuadro cambia a VERDE (#10B981)
✅ Texto cambia a "✅ CÓDIGO DETECTADO"
✅ Vibración (si dispositivo lo permite)
✅ Sonido beep 1000Hz durante 100ms
✅ Código aparece en campo de entrada abajo
✅ Campo se llena automáticamente
```

### Step 6: Probar Otros Barcodes

**Intentar con:**
- [ ] EAN-13 (código de supermercado)
- [ ] Code 39 
- [ ] QR Code
- [ ] Diferentes ángulos (45°, 90°)
- [ ] Diferentes iluminaciones
- [ ] Diferentes distancias

### Step 7: Cambiar de Cámara (Si hay 2+)
```
1. Haz clic en botón "Cambiar Cámara"
2. Debería cambiar a otra cámara disponible
3. Muestra nombre: "Cámara frontal" o "Cámara trasera"
```

### Step 8: Input Manual de Fallback
```
1. Haz clic en el campo de texto "Código Detectado"
2. Ingresa manualmente: 740899503754
3. Haz clic "Agregar a Inventario"
4. Debería procesarse igual que automático
```

## 📊 Debug Console (F12)

### Abrir Developer Tools
```
Windows/Linux: F12 o Ctrl+Shift+I
Mac: Cmd+Option+I
```

### Logs Esperados
```javascript
// Al iniciar escaneo:
✅ ZXing inicializado
✅ Video stream conectado
✅ Escaneo activo - Polling cada 100ms

// Cada frame (verás en consola):
[Multiple "Escaneando frame..." logs]

// Al detectar:
🎉 Código detectado: 740899503754
Vibración activada
Sonido 1000Hz
Flash visual
```

### Ver Errores
```javascript
// Si hay errores:
❌ Error iniciando scanner: [mensaje]
❌ Error en scanFrame: [mensaje]
console.error() mostrará detalles
```

## 🎯 Test Manual Específico

### Test 1: Región Central Priority
```
Instrucciones:
1. Abre scanner
2. Coloca barcode SOLO en centro (donde está el recuadro)
3. Debería detectar en ~500ms
4. Coloca barcode FUERA del centro (esquina)
5. Debería detectar en ~1-2 segundos (fallback)
```

### Test 2: Todas las Estrategias

```
Escanea mismo barcode en 6 situaciones:
1. Luz normal ✓
2. Luz tenue ✓
3. Luz brillante ✓
4. Ángulo 45° ✓
5. Ángulo 90° (vertical) ✓
6. Invertido (blanco fondo oscuro) ✓

Esperado: Mínimo 4 de 6 deben detectar
```

### Test 3: Performance

```
Requisitos:
- No lag visual en el video
- CPU no explota (monitor Ctrl+Alt+Del)
- Sin crashes del navegador
- Sin memory leaks (revisar cada 5 min)
```

### Test 4: Feedback Systems

```
Vibración:
- [ ] Se siente cuando detecta
- [ ] Patrón: 100ms ON, 50ms OFF, 100ms ON

Sonido:
- [ ] Se escucha beep 1000Hz
- [ ] Dura ~100ms
- [ ] Volumen: audible pero no fuerte

Visual:
- [ ] Recuadro se vuelve verde
- [ ] Flash de 400ms
- [ ] Texto cambia a "DETECTADO"
```

## 🚀 Deploy a GitHub Pages

### Step 1: Verificar Git
```bash
cd c:\Users\LOCALADMINPJ\Music\Inventario
git status
```

### Step 2: Commit Changes
```bash
git add -A
git commit -m "Upgrade scanner v3.0: overlay visual + 6 estrategias + edge detection"
```

### Step 3: Push a GitHub
```bash
git push origin main
```

### Step 4: Verificar Deploy Automation
```
1. Abre https://github.com/[tu-usuario]/Inventario
2. Ve a "Actions" tab
3. Debería ver workflow "Deploy" corriendo
4. Espera a que termine (verde ✓)
5. Sitio disponible en: https://[tu-usuario].github.io/Inventario/
```

## 🔍 Checklist de Validación

### Funcionalidad
- [ ] Overlay visual aparece
- [ ] Recuadro cyan es visible
- [ ] Texto "Coloca aquí" aparece
- [ ] Al detectar: recuadro → verde
- [ ] Código se llena automáticamente
- [ ] Vibración funciona
- [ ] Sonido funciona
- [ ] Input manual funciona

### Performance
- [ ] Video es fluido (no lag)
- [ ] Detección rápida (<2s típicamente)
- [ ] CPU bajo (~15-20%)
- [ ] Sin crashes
- [ ] Sin memory leaks

### Compatibilidad
- [ ] Chrome ✓
- [ ] Firefox ✓
- [ ] Safari ✓
- [ ] Edge ✓
- [ ] Mobile ✓

### Seguridad
- [ ] Requiere HTTPS (o localhost)
- [ ] Pide permisos de cámara
- [ ] No transmite datos sin consentimiento
- [ ] Funciona sin internet (excepto GSheets sync)

## 🆘 Troubleshooting

### "No aparece overlay"
```
Solución 1: Recargar página (Ctrl+R o Cmd+R)
Solución 2: Abrir DevTools (F12) y revisar console
Solución 3: Probar en navegador diferente
Solución 4: Verificar que HTML tiene <canvas id="scannerOverlay">
```

### "No detecta barcode"
```
Solución 1: Mejorar iluminación (luz natural mejor)
Solución 2: Acercar/alejar (15-30cm es ideal)
Solución 3: Cambiar ángulo (perpendicular mejor)
Solución 4: En console, verificar logs de escaneo
Solución 5: Si nada funciona → Usar input manual
```

### "Video no carga"
```
Solución 1: Permitir acceso a cámara en navegador
Solución 2: Verificar que cámara funciona en otra app
Solución 3: Reiniciar navegador
Solución 4: Verificar permisos del SO
```

### "Sonido no se escucha"
```
Solución 1: Verificar volumen (no mute)
Solución 2: En console: navigator.mediaSession
Solución 3: Probar en navegador diferente
Solución 4: Puede estar bloqueado por permisos de audio
```

## 📈 Métricas de Éxito

| Métrica | Mínimo | Objetivo |
|---------|--------|----------|
| Tiempo Detección | <3s | <1s |
| Tasa Éxito | >70% | >90% |
| CPU | <50% | <20% |
| Latencia Video | <100ms | <50ms |
| Falsos Positivos | <5% | <1% |

## 📝 Reporte de Testing

### Crear reporte local:
```
1. Prueba cada test manual
2. Anota resultados
3. Guarda en: TESTING_RESULTS.md
4. Incluye:
   - Fecha
   - Navegador + Versión
   - OS + Dispositivo
   - Barcodes probados
   - Resultados detallados
```

## 🎉 Conclusión

Si todo funciona según este checklist:

```
✅ Sistema de escaneo listo para producción v3.0
✅ Overlay visual confirma usabilidad mejorada
✅ Detección en tiempo real funcionando
✅ Listo para desplegar en GitHub Pages
✅ Listo para usar en dispositivos reales
```

---

**Versión**: 3.0  
**Fecha**: 2024  
**Status**: ✅ Listo para Testing Completo
