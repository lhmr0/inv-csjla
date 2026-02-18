# 🔧 Cómo Arreglar el Error - Pasos Simples

## El Problema
Cuando intentas agregar un nuevo producto, sale este error:
```
ERROR: row debe ser un número mayor a 1
```

## La Solución
Google Apps Script necesita ser **actualizado y redeployado**. Sigue estos pasos exactamente:

---

## PASO 1: Abre Google Apps Script

1. Abre tu Google Sheet: https://docs.google.com/spreadsheets/d/1cIPjvg6Kfi79d6810JosSKCk4HSYcxqNYpTtdZ28bYQ

2. En la barra superior, busca **"Extensiones"**

3. Haz clic en **"Apps Script"**

   *Se abrirá una nueva pestaña*

---

## PASO 2: Reemplaza el Código

1. En el editor (lado izquierdo), ves "Code.gs"

2. **Selecciona TODO el código:**
   - Presiona `Ctrl+A` (selecciona todo)
   - O haz clic derecho y elige "Seleccionar todo"

3. **Borra el código:**
   - Presiona `Delete` o `Backspace`

4. **Copia el código nuevo:**
   - Abre el archivo `google-apps-script.gs` del proyecto
   - Copia TODO el contenido (`Ctrl+A`, luego `Ctrl+C`)

5. **Pega en Google Apps Script:**
   - Haz clic en el editor
   - Presiona `Ctrl+V`

6. **Guarda:**
   - Presiona `Ctrl+S` o haz clic en "Guardar"

   *Verás un mensaje "Script saved"*

---

## PASO 3: Desplegar Nueva Versión

1. En la parte superior, busca el botón **"Desplegar"** (se ve como una llave)

2. Haz clic en **"Desplegar"**

3. En el menú, haz clic en **"Nueva Implementación"**

   *Se abrirá un panel en la derecha*

---

## PASO 4: Configurar el Deployment

En el panel derecho que se abrió:

1. **"Seleccionar tipo"** → Haz clic en el desplegable
   - Elige **"Aplicación web"**

2. **"Ejecutar como"** → Debe estar tu email (usuario de Google)
   - Si no está, haz clic y selecciona tu cuenta

3. **"Permitir acceso a"** → Desplegable
   - Elige **"Cualquiera"**

4. Haz clic en **"Desplegar"** (botón azul)

   *Puede pedir autorización*

---

## PASO 5: Si Pide Autorización

Si aparece un popup diciendo "Este sitio requiere autorización":

1. Haz clic en tu nombre/foto (arriba a la derecha del popup)

2. Elige tu cuenta

3. Haz clic en **"Ir a [tu nombre]"** (abajo)

4. Lee los permisos

5. Haz clic en **"Permitir"**

   *Volverás al editor*

---

## PASO 6: Copia la Nueva URL

Después de desplegar, verás un mensaje como:
```
Implementación completada

https://script.google.com/macros/s/AKfyc...
```

**Copia esa URL** (es larga):
- Haz triple-clic sobre ella para seleccionar todo
- Presiona `Ctrl+C`

---

## PASO 7: Actualiza la App

1. Abre el proyecto en VS Code (o tu editor)

2. Abre el archivo: `js/config.js`

3. Busca la línea que dice `webAppUrl:`

4. Reemplaza lo que está ahí (la URL antigua) con la nueva que copiaste:
   ```javascript
   webAppUrl: 'https://script.google.com/macros/s/[PEGA_LA_URL_NUEVA_AQUI]/exec',
   ```

5. **Guarda el archivo:**
   - Presiona `Ctrl+S`

---

## PASO 8: Verifica que Funcione

1. Abre la app en el navegador

2. Presiona **F12** para abrir la consola

3. Intenta agregar un nuevo producto:
   - Escanea un código que NO existe
   - Haz clic en "Agregar como Nuevo Producto"
   - Rellena los datos
   - Presiona "Guardar"

4. En la consola deberías ver:
   ```
   ✅ Fila agregada correctamente
   ```

   Si ves esto, ¡funciona! 🎉

5. **Verifica en Google Sheet:**
   - Abre tu Google Sheet
   - Desplázate al final
   - Busca la nueva fila que agregaste

---

## Si Algo Sale Mal

### Error: "Authorization required"
**Solución:**
1. Haz clic en "Autorizar"
2. Elige tu cuenta de Google
3. Permite los permisos
4. Intenta desplegar de nuevo

### Error: "mismatched types" o algo de código
**Solución:**
1. Vuelve al paso 2
2. Asegúrate de copiar TODO el código (Ctrl+A)
3. Asegúrate de borrar TODO el código anterior (Ctrl+A + Delete)
4. Pega el código nuevo completo
5. Guarda y desplega

### La app sigue mostrando el error antiguo
**Solución:**
1. Abre F12 y escribe en la consola:
   ```javascript
   Storage.getWebAppUrl()
   ```
2. Verifica que muestre una URL que comience con `https://script.google.com`
3. Si no, actualiza `config.js` nuevamente
4. Recarga la página (F5)

---

## Checklist Final

Antes de decir que funciona, verifica:

- [ ] Abriste Google Apps Script desde tu Sheet
- [ ] Copiaste el código completo de `google-apps-script.gs`
- [ ] Pegaste en Google Apps Script (reemplazando TODO)
- [ ] Presionaste Ctrl+S
- [ ] Hiciste "Nueva Implementación"
- [ ] Configuraste: Aplicación web, Tu cuenta, Cualquiera
- [ ] Copiaste la nueva URL
- [ ] Actualizaste `config.js` con la nueva URL
- [ ] Guardaste `config.js` (Ctrl+S)
- [ ] Abriste F12 y viste logs correctos
- [ ] Verificaste en Google Sheet que se creó la fila

---

## ¿Cuánto Tarda?
- Copiar código: 1 minuto
- Desplegar: 2 minutos
- Autorizar (si pide): 1 minuto
- Actualizar config.js: 1 minuto
- **Total: 5-10 minutos**

---

## Preguntas Rápidas

**P: ¿Pierdo datos si reemplazo el código?**
A: No. Google Sheet permanece intacto. Solo cambias el código que interactúa con él.

**P: ¿Puedo tener varias implementaciones activas?**
A: Sí, pero solo una es la "actual". Google usará la más reciente.

**P: ¿Qué pasa si no hago redeploy?**
A: La app seguirá usando el código antiguo y el error continuará.

**P: ¿Puedo deshacer el deployment?**
A: Sí. En Google Apps Script, puedes borrar implementaciones anteriores.

---

## Soporte

Si después de hacer TODOS estos pasos sigue fallando:

1. Abre F12 Console
2. Intenta agregar un producto
3. Copia TODOS los logs que aparezcan en rojo
4. Revisa la documentación:
   - `DIAGNOSTICO_AGREGAR_FILA.md`
   - `GUIA_REDEPLOY.md`

---

**¡Eso es todo! El error debería desaparecer después de estos pasos.**

*Si tienes dudas, revisa la guía completa en: GUIA_REDEPLOY.md*
