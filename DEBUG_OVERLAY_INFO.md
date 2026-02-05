# 📊 INFORMACIÓN DE DEBUG EN OVERLAY

## Lo que Verás Ahora

El overlay mostrará información en tiempo real para ayudar a diagnosticar por qué no detecta barcodes:

```
┌─────────────────────────────────────────────┐
│                                             │
│   ╔═══════════════════════════════════╗    │
│   ║  Coloca el código aquí            ║    │
│   ║                                   ║    │
│   ║        [VIDEO EN VIVO]            ║    │
│   ║                                   ║    │
│   ╚═══════════════════════════════════╝    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Frame: 1523 | 8.5ms                │   │  ← Número de frames y tiempo
│  │ Video: 1280x720 | Ready: YES       │   │  ← Resolución y estado
│  │ Región: Escaneando...              │   │  ← Qué región intenta
│  │ Debounce: 45%                      │   │  ← Estado de debounce
│  │ ZXing: OK                          │   │  ← Estado de ZXing
│  └─────────────────────────────────────┘   │
│                                             │
│   [Fondo oscuro]                            │
└─────────────────────────────────────────────┘
```

## 📋 Información Mostrada

### 1. **Frame & Tiempo**
```
Frame: 1523 | 8.5ms
```
- Número total de frames procesados
- Tiempo en ms que tardó procesar el último frame
- **Si es > 50ms:** Problema de rendimiento

### 2. **Video Status**
```
Video: 1280x720 | Ready: YES
```
- Resolución actual del video
- **Ready: YES** = Video está listo
- **Ready: NO** = Video aún cargando (no escanea)

### 3. **Región Escaneando**
```
Región: Escaneando...
```
Mientras busca:
- `Escaneando...` = Intentando detectar

Cuando detecta:
- `Original (CENTRAL)` = Detectó con imagen original en región central
- `Contrast Agr. (COMPLETA)` = Detectó con contraste en imagen completa
- `EdgeDetect (CENTRAL)` = Detectó con detección de bordes en central
- etc.

### 4. **Debounce Status**
```
Debounce: 45%
```
- % de tiempo esperado antes del siguiente escaneo
- 0% = Puede detectar ahora
- 100% = Debe esperar aún más

### 5. **ZXing Status**
```
ZXing: OK
```
- `OK` = Librería cargada correctamente
- `FAIL` = Problema con ZXing

## 🔧 Qué Significa Cada Valor

### Scenario 1: Video No Listo
```
Video: 0x0 | Ready: NO
```
**Problema:** Video aún está cargando
**Solución:** Espera 1-2 segundos más

### Scenario 2: ZXing Falla
```
ZXing: FAIL
```
**Problema:** Librería no se cargó
**Solución:** Recarga la página

### Scenario 3: Frames Muy Lentos
```
Frame: 523 | 120ms
```
**Problema:** Procesamiento demasiado lento
**Solución:** Reduce resolución o cambia navegador

### Scenario 4: Detección Exitosa
```
Región: Original (CENTRAL)
```
**Éxito:** Se detectó el barcode
**Info:** Original = sin procesamiento, CENTRAL = región del centro

## 🎯 Cómo Usar Para Debug

1. **Abre** http://localhost:8080
2. **Haz clic** "▶️ Iniciar Cámara"
3. **Observa** el recuadro de debug abajo del overlay
4. **Coloca** un barcode en el centro
5. **Anota** qué dice la info de debug

### Casos de Test

**Test 1: Video Carga**
- Verifica que `Ready: YES`
- Si `NO` → problema de cámara

**Test 2: Frame Time**
- Debería ser < 50ms
- Si > 100ms → navegador lento

**Test 3: Detección**
- Acerca un barcode Code 128
- Observa qué estrategia detecta
- Si ninguna detecta → problemas con barcode

## 📝 Logs en Console (F12)

Además del overlay, verás en Console:

```javascript
✅ DETECTADO en CENTRAL usando Original
✅ Código: 740899503754
```

O si falla:
```
(Nada en console = no detecta)
```

## 🐛 Troubleshooting Rápido

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Ready: NO | Video cargando | Espera más |
| Frame: 0ms | Muy rápido | Normal |
| Frame: >100ms | Navegador lento | Cierra otras apps |
| Región: Escaneando | No detecta | Acerca el barcode |
| ZXing: FAIL | No cargó | Recarga página |

## ✅ Qué Hacer Ahora

1. Abre http://localhost:8080
2. Haz clic en "▶️ Iniciar Cámara"
3. **ESPERA** a que veas `Ready: YES`
4. **COLOCA** un barcode Code 128 en el centro
5. **OBSERVA** la información de debug
6. **REPORTA** qué dice la sección "Región"

---

**Status:** 📊 Debug info agregada y visible en overlay
