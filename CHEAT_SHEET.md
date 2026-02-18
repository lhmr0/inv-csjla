# ⚡ Cheat Sheet - Arregla el Error en 5 Minutos

## El Error
```
ERROR: row debe ser un número mayor a 1
```

## La Causa
Google Apps Script está usando código antiguo.

## La Solución
**3 PASOS SOLAMENTE:**

### PASO 1: Actualiza Google Apps Script
```
1. Ve a: Extensiones → Apps Script
2. Ctrl+A (selecciona todo) → Delete
3. Copia google-apps-script.gs del proyecto
4. Ctrl+V (pega)
5. Ctrl+S (guarda)
```
⏱️ 2 minutos

### PASO 2: Desplega
```
1. Clic en "Desplegar"
2. Clic en "Nueva Implementación"
3. Tipo: "Aplicación web"
4. Ejecutar como: Tu Cuenta
5. Acceso: "Cualquiera"
6. Clic en "Desplegar"
7. Copia la URL que aparece
```
⏱️ 2 minutos

### PASO 3: Actualiza config.js
```
1. Abre: js/config.js
2. Busca la línea webAppUrl
3. Reemplaza con la URL del Paso 2
4. Ctrl+S (guarda)
```
⏱️ 1 minuto

---

## Verifica que Funcione

Presiona **F12** → Console → Intenta agregar producto

Deberías ver:
```
✨ Fila agregada correctamente
```

---

## Si No Funciona

### Error 1: "Authorization failed"
→ Haz clic en "Autorizar" cuando pida

### Error 2: "Parámetros faltantes"
→ Completaste los datos del producto?

### Error 3: El error sigue
→ Recarga la página (F5)
→ Revisa que config.js sea la URL nueva

---

## Checklist Final
- [ ] Copié el código de google-apps-script.gs
- [ ] Pegué en Google Apps Script
- [ ] Presioné Ctrl+S
- [ ] Hice "Nueva Implementación"
- [ ] Copié la URL nueva
- [ ] Actualicé config.js
- [ ] Presioné Ctrl+S en config.js
- [ ] F12 sin errores rojos

---

**¿Listo?** Intenta agregar un producto. Debería funcionar. 🎉
