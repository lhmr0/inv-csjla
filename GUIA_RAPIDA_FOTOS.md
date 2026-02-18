# 🚀 Guía Rápida - Flujo de Inventariación con Fotos

## Paso a Paso

### 1️⃣ **Iniciar Sesión**
```
- Ingresa tu nombre
- Click "Conectar"
- La app se conectará con Google Sheets
```

### 2️⃣ **Escanear Bien**
```
- Pestaña "📷 Escanear"
- Click "▶️ Iniciar Cámara"
- Acerca el código de barras a la cámara
- Automáticamente detectará el código
```

### 3️⃣ **Verificar Bien**
```
- Se mostrará información del bien encontrado
- Revisar que todos los datos sean correctos
- Verificar estado físico del equipo
```

### 4️⃣ **Capturar Fotos** ⭐ NUEVA FUNCIONALIDAD
```
- En el modal de verificación:
- Click en "Agregar foto" 
- Selecciona hasta 2 fotos del bien
- Verás miniaturas de las fotos
- Puedes eliminar fotos antes de guardar
```

### 5️⃣ **Registrar Bien**
```
- Si todo está correcto
- Click "✅ Sí, Registrar Bien"
- Se actualizará automáticamente en Google Sheets
- Se guardarán las fotos localmente
- Se mostrará mensaje de confirmación
```

### 6️⃣ **Ver Inventariados**
```
- Pestaña "✅ Inventariados"
- Verás lista de todos los bienes inventariados
- Información resumida de cada bien
- Ordenados por fecha más reciente
```

### 7️⃣ **Generar Documentos**
```
- Click "📄 Generar Documento Word"
- Se generará un documento profesional:
  * Una página por cada bien inventariado
  * Incluye evaluación técnica
  * Incluye recomendaciones
  * Se descarga automáticamente
```

### 8️⃣ **Exportar Datos**
```
- Click "📊 Exportar CSV"
- Se descargará archivo para Excel/Sheets
- Contiene todos los registros con fotos
```

## Estadísticas en Tiempo Real

### Pestaña "📊 Estadísticas"
- **Total Items**: Todos los bienes en el sistema
- **Inventariados**: ✅ Bienes registrados
- **Pendientes**: ⏳ Aún no registrados  
- **Hoy**: 📅 Bienes registrados hoy

Click "🔄 Actualizar Estadísticas" para refrescar

## Gestión de Fotos

### Almacenamiento Local
- Las fotos se guardan automáticamente en el navegador
- Máximo 2 fotos por bien
- Máximo ~5MB de almacenamiento local
- Se mantienen aunque cierres la app

### Google Drive (Opcional)
Para sincronizar en Google Drive:
1. Configurar OAuth2 (ver NUEVAS_FUNCIONALIDADES.md)
2. Las fotos se subirán automáticamente
3. Se crearán enlaces compartibles

## Atajos Útiles

| Acción | Atajo |
|--------|-------|
| Cancelar modal | Esc |
| Cambiar cámara | 🔄 En modo escaneo |
| Entrada manual | Pestaña "✏️ Manual" |
| Historial | Pestaña "📋 Historial" |

## Resolución de Problemas

### ❌ Cámara no funciona
- Permitir permisos de cámara
- Probar con HTTP**S** (línea de producción)
- Algunos navegadores requieren HTTPS

### ❌ Fotos no se guardan
- Verificar que localStorage esté habilitado
- Limpiar caché del navegador
- Reiniciar la aplicación

### ❌ Documento Word no se genera
- Verificar conexión a internet
- Asegurarse que hay al menos 1 bien inventariado
- Permitir descarga de archivos en navegador

### ❌ Datos no se actualizan
- Click "🔄 Actualizar Estadísticas"
- Verificar conexión con Google Sheets
- Asegurarse que el Sheet esté compartido

## Datos que se Recopilan

```
Por cada bien inventariado se guarda:
├── Código de Patrimonio
├── Descripción/Tipo
├── Marca
├── Modelo
├── Código de Inventario
├── Código M
├── Color
├── Estado de Conservación
├── Información del local
├── Información de responsable
├── Fecha de inventario
├── Operador (tu nombre)
├── Fotos (hasta 2 archivos base64)
└── Timestamp del registro
```

## Exportación de Datos

### Archivos Descargables
1. **Documento Word** - Evaluación técnica formal
2. **CSV** - Datos tabulados para análisis

### Nombres de Archivos
```
Evaluacion_Tecnica_2024-02-18.docx
Inventoriados_2024-02-18.csv
```

## Seguridad y Privacidad

- ✅ Las fotos se guardan localmente en tu navegador
- ✅ No se trasmiten a servidores de terceros (excepto Google Sheets/Drive)
- ✅ Puedes eliminar fotos en cualquier momento
- ✅ Los datos se limpian al cerrar sesión

## Próximas Características (Planeado)

- 🔄 Sincronización automática con Google Drive
- 📄 Generación de reportes en PDF
- 🔍 Búsqueda y filtrado avanzado
- 📈 Gráficos y análisis estadstico
- 👥 Estadísticas por usuario
- 🏢 Reportes por departamento

---

**¿Necesitas ayuda?** Consulta la documentación completa en `NUEVAS_FUNCIONALIDADES.md`
