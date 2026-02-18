# 🚀 INSTRUCCIONES DE DESPLIEGUE v2.1.0

## Pre-Despliegue: Verificación

### 1️⃣ **Verificar Archivos**
```bash
# Verificar que estos archivos existan:
✓ index.html (modificado)
✓ js/app.js (modificado)
✓ js/ui.js (modificado)
✓ js/sheets.js (modificado)
✓ js/storage.js (modificado)
✓ css/styles.css (modificado)
✓ js/drive-integration.js (nuevo)
✓ NUEVAS_FUNCIONALIDADES.md (nuevo)
✓ GUIA_RAPIDA_FOTOS.md (nuevo)
✓ CHANGELOG_v2.1.0.md (nuevo)
```

### 2️⃣ **Verificar Librerías Externas**
Las siguientes librerías ahora se cargan desde CDN (verificar en index.html):
```html
✓ <script src="https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js"></script>
✓ <script src="https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"></script>
✓ <script src="https://apis.google.com/js/api.js"></script>
```

### 3️⃣ **Verificar Google Apps Script**
El archivo `google-apps-script.gs` **NO requiere cambios**.
Sigue funcionando igual, solo se agregaron funciones JS del lado del cliente.

---

## 📋 Pasos de Despliegue

### Opción A: Reemplazo Manual en Hosting

1. **Hacer backup de archivos actuales**
   ```bash
   cp -r . ../backup_inventario_v2.0/
   ```

2. **Copiar archivos modificados**
   ```
   Reemplazar:
   - index.html
   - js/app.js
   - js/ui.js
   - js/sheets.js
   - js/storage.js
   - css/styles.css
   
   Agregar nuevos:
   - js/drive-integration.js
   - NUEVAS_FUNCIONALIDADES.md
   - GUIA_RAPIDA_FOTOS.md
   - CHANGELOG_v2.1.0.md
   ```

3. **Verificar carga de archivos**
   - Abrir app en navegador
   - Abrir DevTools (F12) → Console
   - No debe haber errores en rojo
   - Debe mostrar "✅ Conectado"

### Opción B: Despliegue en GitHub Pages

```bash
# Si tu proyecto está en GitHub
git add .
git commit -m "Versión 2.1.0: Fotos, estadísticas mejoradas, reportes Word"
git push origin main
# GitHub automáticamente despliega los cambios
```

### Opción C: Despliegue en Google Cloud/Firebase

```bash
# Si usas Firebase Hosting
firebase deploy --only hosting:inventario
```

---

## ✅ Verificaciones Post-Despliegue

### 1. Prueba de Funcionalidad Básica

```
En el navegador:
1. [] Cargar página - No hay errores
2. [] Ingresar nombre y conectar - OK
3. [] Ver pestaña "✅ Inventariados" - Aparece
4. [] Click en "🔄 Actualizar" - Carga datos
5. [] "📄 Generar Documento" - Se descarga Word
6. [] "📊 Exportar CSV" - Se descarga CSV
```

### 2. Prueba de Captura de Fotos

```
1. [] Ir a pestaña "📷 Escanear"
2. [] Escanear o buscar un bien
3. [] En el modal, click "Agregar foto"
4. [] Cargar imagen de test
5. [] Ver previsualización
6. [] Click "Registrar bien"
7. [] Abrir DevTools → Application → LocalStorage
8. [] Buscar clave "photos_*"
9. [] Verificar foto guardada
```

### 3. Prueba de Estadísticas

```
1. [] Pestaña "📊 Estadísticas"
2. [] Verificar Total Items > 0
3. [] Verificar Inventariados ≤ Total
4. [] Verificar Pendientes = Total - Inventariados
5. [] Verificar Hoy ≤ Inventariados
6. [] Click "🔄 Actualizar" - Números se actualizan
```

### 4. Prueba de Documento Word

```
1. [] Pestaña "✅ Inventariados"
2. [] Asegurarse que hay ≥1 bien inventariado
3. [] Click "📄 Generar Documento Word"
4. [] Esperar ~3 segundos
5. [] Archivo "Evaluacion_Tecnica_*.docx" se descarga
6. [] Abrir archivo en Word/LibreOffice
7. [] Verificar formato correcto
8. [] Verificar datos completos
```

### 5. Prueba en Navegadores Diferentes

```
Chrome/Edge  ✓
Firefox      ✓
Safari       ✓
Mobile       ✓ (si aplica)
```

---

## 🐛 Troubleshooting

### Problema: "Archivo no encontrado: drive-integration.js"

**Solución:**
- Verificar que `js/drive-integration.js` existe
- Verificar ruta en `index.html`: `<script src="js/drive-integration.js"></script>`
- Limpiar caché (Ctrl+Shift+R en Chrome)

### Problema: "docx is not defined"

**Solución:**
- La librería docx.js debe estar incluida en index.html
- Verificar CDN de docx.js está accesible
- Ver en DevTools → Network que se cargue

### Problema: Fotos no se guardan

**Solución:**
- Verificar localStorage esté habilitado
- En Chrome: Configuración → Privacidad → Cookies → Debe permitir
- localStorage tiene límite de ~5-10MB

### Problema: Estadísticas incorrectas

**Solución:**
- Verificar que Google Sheets esté publlicado ("/edit?usp=sharing")
- Hacer click "🔄 Actualizar Estadísticas"
- Verificar que la columna INVENTARIADO contiene "SI" o "NO"

---

## 📊 Monitoreo Post-Despliegue

### Registro de Errores (DevTools Console)

```javascript
// En DevTools → Console, ejecutar:
localStorage.getItem('inventory_operator');        // Debe retornar nombre
SheetsAPI.getStats();                              // Debe retornar objeto stats
SheetsAPI.getInventoried().length;                 // Debe retornar número
```

### Métricas a Monitorear

1. **Usuarios activos** - Ver en Analytics
2. **Errores de consola** - Monitorear en DevTools
3. **Descarga de reportes** - Verificar manualmente
4. **Almacenamiento de fotos** - Revisar localStorage

---

## 🔄 Rollback si es Necesario

Si algo sale mal:

```bash
# Restaurar desde backup
cp -r ../backup_inventario_v2.0/* .

# O en Git
git revert HEAD~1
git push origin main
```

---

## 📞 Checklist Final

- [ ] Todos los archivos en lugar
- [ ] Sin errores en DevTools Console
- [ ] Nueva pestaña visible
- [ ] Imágenes se cargan correctamente
- [ ] Documentos se generan sin errores
- [ ] CSV se descarga correctamente
- [ ] Estadísticas se calculan bien
- [ ] Pruebas en múltiples navegadores
- [ ] Usuarios notificados de cambios

---

## 🎓 Capacitación de Usuarios

### Para administrador:
1. Leer `CHANGELOG_v2.1.0.md`
2. Leer `NUEVAS_FUNCIONALIDADES.md`

### Para operadores:
1. Leer `GUIA_RAPIDA_FOTOS.md`
2. Ver demo de captura de fotos
3. Probar generación de reporte

---

## 📝 Notas Importantes

### Sobre Google Drive
- La integración con Google Drive es **OPCIONAL**
- Si no se configura, las fotos se guardan localmente (OK)
- Para habilitar Drive, seguir las instrucciones en `NUEVAS_FUNCIONALIDADES.md`

### Sobre Compatibilidad
- El cambio es **100% retrocompatible**
- Los datos antigüos siguen siendo válidos
- No se pierden datos existentes

### Sobre Performance
- No hay degradación de performance
- Librerías se cargan desde CDN (caché del navegador)
- localStorage es más eficiente que antes

---

## ✨ Resumen

**Cambios realizados:** 7 archivos modificados, 1 nuevo módulo, 3 documentos de ayuda

**Tiempo de despliegue estimado:** 5-10 minutos

**Riesgo:** BAJO (cambios principalmente en UI y frontend)

**Testing requerido:** Con 1-2 usuarios reales

**Comunicación a usuarios:** Recomendado 24 horas antes

---

**¿Preguntas?** 
Ver documentación completa en:
- `NUEVAS_FUNCIONALIDADES.md`
- `GUIA_RAPIDA_FOTOS.md`
- `CHANGELOG_v2.1.0.md`
