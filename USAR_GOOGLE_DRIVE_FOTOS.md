# 📤 GUÍA RÁPIDA: Usar Google Drive para Fotos

## ✅ Funcionalidad Activada

La app **ya puede subir fotos a Google Drive**. El Client ID está configurado correctamente.

---

## 🚀 Cómo Usar

### Paso 1: Capturar Fotos
```
1. Escanea un código de barras
2. Se abre el modal del bien
3. Click en "Agregar foto"
4. Selecciona 1-2 imágenes de tu galería
5. Se muestran previsualizadas
```

### Paso 2: Enviar a Google Drive
```
1. En el modal verás un botón "📤 Enviar Fotos a Google Drive"
   (Solo aparece si hay fotos capturadas)
2. Click en el botón
3. Se abrirá popup de Google para autenticarte
4. Autoriza acceso a "Inventario_Fotos"
5. Las fotos se suben automáticamente
```

### Paso 3: Registrar el Bien
```
1. Click en "✅ Inventariados" (también guarda fotos en local)
2. ¡Listo! Fotos guardadas en:
   - localStorage (este dispositivo)
   - Google Drive (sync en la nube)
```

---

## 📊 Dónde Se Guardan

### Local (Automático)
```
localStorage → "photos_5_1708270245123"
├── rowIndex: 5
├── photos: [image1, image2]
└── operator: "Juan Pérez"
```

### Google Drive (Al usar botón)
```
drive.google.com
└── Mi unidad
    └── Inventario_Fotos/
        ├── inventario_1708270245123_foto_1.jpg
        └── inventario_1708270245123_foto_2.jpg
```

---

## 🔐 Autenticación

Primera vez:
1. Click "📤 Enviar Fotos a Google Drive"
2. Popup: "Inventario quiere acceder a tu Google Drive"
3. Click en tu cuenta de Google
4. Autoriza la app
5. Se cierra el popup → fotos suben

Próximas veces:
- La app recuerda tu autenticación
- No pide autorizar de nuevo

---

## ⚠️ Notas Importantes

| Aspecto | Detalles |
|---------|----------|
| **Almacenamiento local** | ✅ Datos guardados en localStorage (5 MB máximo) |
| **Google Drive** | ✅ Sincronización en https://drive.google.com |
| **Privacidad** | 🔒 Tú controlas quién accede |
| **Internet** | 🌐 Requiere conexión para subir a Drive |
| **Backup** | ✅ Ambas opciones garantizan backup |

---

## 🔍 Verificación

### Ver fotos en Google Drive:
```
1. Ve a: https://drive.google.com
2. Busca carpeta "Inventario_Fotos"
3. Ahí verás tus fotos
4. Puedes compartir o descargar
```

### Ver fotos guardadas localmente:
```javascript
// En consola (F12):
console.log(localStorage.getItem('CACHEKEY_photos'));

// Verás:
{
    rowIndex: 5,
    photos: [{data: "data:image...", ...}],
    operator: "Juan"
}
```

---

## 🐛 Si NO Aparece el Botón

**Razones:**
- ❌ No capturaste fotos (agregar primero)
- ❌ OAuth2 no autenticado aún
- ❌ JavaScript error

**Soluciones:**
```javascript
// En consola:
console.log('CLIENT_ID:', DriveIntegration.CLIENT_ID);
console.log('isAuthenticated:', DriveIntegration.isAuthenticated);
console.log('photos:', window.currentProductPhotos);
```

Si ves `CLIENT_ID = undefined`:
- Recarga la página (Ctrl+Shift+R)

---

## 🔄 Flujo Completo

```
Escanear código
    ↓
Capturar fotos (1-2 máximo)
    ↓
↙─────────────────────────────↘
│                              │
Enviar a Drive         Registrar bien
│ (nuevo botón)        │ (existía antes)
│ ↓                    ↓
│ Google login     Guardar en local
│ ↓               Guardar en Sheets
│ Upload a Drive   ✅ LISTO
│ ✅ LISTO
│
└────────► Ambas opciones funcionan
          independientemente
```

---

## 💡 Casos de Uso

### Caso 1: Conectado a Internet
```
✅ Captura fotos
✅ Envía a Drive
✅ Registra bien
→ Todo sincronizado en la nube
```

### Caso 2: Sin Internet
```
✅ Captura fotos
❌ No puede enviar a Drive (requiere internet)
✅ Registra bien (se guarda localmente)
→ Cuando conectes, puedes enviar manualmente
```

### Caso 3: Múltiples Dispositivos
```
Dispositivo 1: Captura foto, envía a Drive
    ↓
Google Drive (sincroniza automáticamente)
    ↓
Dispositivo 2: Puede ver la foto en Drive
```

---

## 📱 Accesibilidad

**Desktop**: ✅ Funciona perfectamente  
**Tablet**: ✅ Funciona (iOS/Android)  
**Smartphone**: ✅ Funciona (iOS/Android)  

---

## 🎁 Bonus: Descargar Fotos

### Desde Google Drive:
```
1. drive.google.com → Inventario_Fotos
2. Click derecho en foto → Descargar
3. O: Share → Get Link
```

### Desde localStorage:
```javascript
// En consola:
const photos = Object.entries(localStorage)
    .filter(([k, v]) => k.includes('photos_'))
    .map(([k, v]) => JSON.parse(v));

// Exportar como JSON:
const dataStr = JSON.stringify(photos, null, 2);
const blob = new Blob([dataStr], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'fotos-inventario.json';
a.click();
```

---

## ✅ Checklist

- [ ] Recarga la app (Ctrl+Shift+R)
- [ ] Captura una foto
- [ ] Ve el botón "📤 Enviar Fotos a Google Drive"
- [ ] Click en el botón
- [ ] Autoriza Google
- [ ] Espera a que suban (verás toast "✅")
- [ ] Ve a Google Drive y busca "Inventario_Fotos"
- [ ] ¡Verás tus fotos!

---

## 📞 Soporte

Si algo no funciona:
1. Abre consola (F12)
2. Copia los errores
3. Intenta: Ctrl+Shift+R (limpiar caché)
4. Si persiste el error, reporta

