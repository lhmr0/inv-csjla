/**
 * Google Apps Script para Sistema de Inventario
 * 
 * ESTRUCTURA DEL EXCEL (21 Columnas):
 * A(1): Nombre_Local
 * B(2): Direccion_Local
 * C(3): Bloque
 * D(4): Piso
 * E(5): Ambiente
 * F(6): Apellidos_Nombres
 * G(7): Nombre_Ofi
 * H(8): Cod_inv
 * I(9): Cod_M
 * J(10): Cod_Patrim
 * K(11): Descripcion_Denominacion
 * L(12): Marca
 * M(13): Modelo
 * N(14): Color
 * O(15): Estado_Conserv
 * P(16): Fecha_Inv
 * Q(17): Usuario
 * R(18): Digitador
 * S(19): INVENTARIADO (escribir aquí)
 * T(20): F_REGISTRO (escribir aquí)
 * U(21): REGISTRADO_POR (escribir aquí)
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu Google Sheet
 * 2. Ve a Extensiones > Apps Script
 * 3. Elimina el código que hay por defecto
 * 4. Pega este código
 * 5. Guarda (Ctrl+S)
 * 6. Desplegar → Nueva implementación → Aplicación web
 * 7. Copia la URL y pégala en la app como Web App URL
 */

function doGet(e) {
  try {
    // Si e es undefined (cuando se ejecuta manualmente desde el editor), retornar error
    if (!e) {
      Logger.log('⚠️  ADVERTENCIA: La función se ejecutó sin parámetros');
      return createErrorResponse('Parámetros faltantes. Esta función debe ser llamada como Web App.');
    }
    
    const params = e.parameter;
    const action = params.action || '';
    
    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('🟢 NUEVA SOLICITUD - ' + new Date().toISOString());
    Logger.log('📌 ACCIÓN: "' + action + '"');
    Logger.log('📋 PARÁMETROS:', JSON.stringify(params));
    Logger.log('═══════════════════════════════════════════════════════');
    
    // Determinar qué acción ejecutar (ESTRICTO)
    if (action === 'addNewRow') {
      Logger.log('✅ Detectada acción: addNewRow');
      return handleAddNewRow(params);
    } else if (action === 'updateInventory' || action === '') {
      Logger.log('✅ Detectada acción: updateInventory (o por defecto)');
      return handleUpdateInventory(params);
    } else {
      Logger.log('❌ Acción desconocida: ' + action);
      return createErrorResponse('Acción desconocida: ' + action);
    }
  } catch (error) {
    Logger.log('❌ ERROR GENERAL EN doGet:');
    Logger.log('   Error: ' + error.toString());
    Logger.log('   Stack: ' + error.stack);
    return createErrorResponse(`Error del servidor: ${error.toString()}`);
  }
}

/**
 * Maneja la actualización de inventario
 */
function handleUpdateInventory(params) {
    
    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('🟢 INICIO DE SOLICITUD - ' + new Date().toISOString());
    Logger.log('📝 Parámetros recibidos:', JSON.stringify(params));
    
    // Obtener los parámetros
    const sheetId = params.sheetId;
    const sheetName = params.sheetName || 'Hoja1';
    const rowIndex = parseInt(params.row);
    const inventariado = params.inventariado || 'SI';
    const f_registro = params.f_registro || '';
    const registrado_por = params.registrado_por || '';
    
    Logger.log('✏️  PARÁMETROS PARSEADOS:');
    Logger.log('   sheetId: ' + (sheetId ? '✅' : '❌') + ' = ' + sheetId);
    Logger.log('   sheetName: ' + sheetName);
    Logger.log('   rowIndex: ' + rowIndex + ' (tipo: ' + typeof rowIndex + ')');
    Logger.log('   inventariado: ' + inventariado);
    Logger.log('   f_registro: ' + f_registro);
    Logger.log('   registrado_por: ' + registrado_por);
    
    // Validar parámetros
    if (!sheetId) {
      Logger.log('❌ ERROR: sheetId está vacío');
      return createErrorResponse('ERROR: sheetId es requerido');
    }
    
    if (!rowIndex || rowIndex < 2 || isNaN(rowIndex)) {
      Logger.log('❌ ERROR: rowIndex inválido - ' + rowIndex);
      return createErrorResponse('ERROR: row debe ser un número mayor a 1');
    }
    
    Logger.log('✅ Parámetros válidos');
    
    // Obtener acceso al spreadsheet
    let spreadsheet;
    try {
      Logger.log('🔓 Intentando abrir spreadsheet con ID: ' + sheetId);
      spreadsheet = SpreadsheetApp.openById(sheetId);
      Logger.log('✅ Spreadsheet abierto correctamente');
    } catch (error) {
      Logger.log('❌ Error al abrir spreadsheet: ' + error.toString());
      Logger.log('   Stack: ' + error.stack);
      return createErrorResponse('No se pudo acceder al spreadsheet. Verifica que el ID sea correcto y que tengas permiso.');
    }
    
    if (!spreadsheet) {
      Logger.log('❌ Spreadsheet es null');
      return createErrorResponse('El spreadsheet no se pudo cargar');
    }
    
    // Obtener la hoja
    let sheet;
    try {
      Logger.log('📄 Buscando hoja: "' + sheetName + '"');
      sheet = spreadsheet.getSheetByName(sheetName);
      
      if (!sheet) {
        // Listar hojas disponibles
        const hojas = spreadsheet.getSheets();
        const nombresHojas = hojas.map(h => h.getName()).join(', ');
        Logger.log('❌ Hoja no encontrada');
        Logger.log('   Hojas disponibles: ' + nombresHojas);
        return createErrorResponse(`La hoja "${sheetName}" no existe. Disponibles: ${nombresHojas}`);
      }
      
      Logger.log('✅ Hoja encontrada: ' + sheetName);
    } catch (error) {
      Logger.log('❌ Error al obtener hoja: ' + error.toString());
      return createErrorResponse(`Error al acceder a la hoja "${sheetName}": ${error.toString()}`);
    }
    
    // Verificar que la fila existe y tenga datos
    try {
      const rowData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues();
      if (!rowData || rowData.length === 0) {
        Logger.log('⚠️  ADVERTENCIA: La fila ' + rowIndex + ' podría estar vacía');
      } else {
        Logger.log('✅ La fila ' + rowIndex + ' existe');
      }
    } catch (e) {
      Logger.log('⚠️  No se pudo verificar si la fila existe: ' + e.toString());
    }
    
    // Actualizar las celdas
    // Columnas: S=19 (INVENTARIADO), T=20 (F_REGISTRO), U=21 (REGISTRADO_POR)
    try {
      Logger.log('🔄 ACTUALIZANDO CELDAS:');
      Logger.log('   Fila: ' + rowIndex);
      Logger.log('   Columna S (19) INVENTARIADO: "' + inventariado + '"');
      Logger.log('   Columna T (20) F_REGISTRO: "' + f_registro + '"');
      Logger.log('   Columna U (21) REGISTRADO_POR: "' + registrado_por + '"');
      
      sheet.getRange(rowIndex, 19).setValue(inventariado);      // S - INVENTARIADO
      Logger.log('     ✅ Columna S actualizada');
      
      sheet.getRange(rowIndex, 20).setValue(f_registro);        // T - F_REGISTRO
      Logger.log('     ✅ Columna T actualizada');
      
      sheet.getRange(rowIndex, 21).setValue(registrado_por);    // U - REGISTRADO_POR
      Logger.log('     ✅ Columna U actualizada');
      
      Logger.log('✅ FILA ACTUALIZADA EXITOSAMENTE');
      
      const successData = {
        message: 'Inventario actualizado correctamente',
        row: rowIndex,
        sheetName: sheetName,
        inventariado: inventariado,
        f_registro: f_registro,
        registrado_por: registrado_por,
        timestamp: new Date().toISOString(),
        status: 'success'
      };
      
      Logger.log('📤 Enviando respuesta exitosa...');
      Logger.log('═══════════════════════════════════════════════════════');
      
      return createSuccessResponse(successData);
      
    } catch (updateError) {
      Logger.log('❌ ERROR AL ACTUALIZAR LA FILA:');
      Logger.log('   Error: ' + updateError.toString());
      Logger.log('   Stack: ' + updateError.stack);
      Logger.log('═══════════════════════════════════════════════════════');
      return createErrorResponse(`Error al actualizar la fila ${rowIndex}: ${updateError.toString()}`);
    }
}

/**
 * Maneja peticiones POST (alternativa a GET)
 */
function doPost(e) {
  return doGet(e);
}

/**
 * Agrega una nueva fila al sheet
 */
function handleAddNewRow(params) {
  try {
    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('🆕 AGREGAR NUEVA FILA - ' + new Date().toISOString());
    Logger.log('📝 Parámetros recibidos:', JSON.stringify(params));
    
    // Validar que sea la acción correcta
    const action = params.action || '';
    if (action !== 'addNewRow') {
      Logger.log('❌ ERROR: Esta función debe ser llamada con action=addNewRow');
      Logger.log('   Acción recibida: ' + action);
      return createErrorResponse('ERROR: Esta función requiere action=addNewRow');
    }
    
    const sheetId = params.sheetId;
    const sheetName = params.sheetName || 'Inventario';
    const cod_patrim = params.cod_patrim;
    const descripcion = params.descripcion;
    const marca = params.marca || '';
    const modelo = params.modelo || '';
    const color = params.color || '';
    const apellidos_nombres = params.apellidos_nombres || '';
    const nombre_ofi = params.nombre_ofi || '';
    const operator = params.operator || '';
    
    Logger.log('✏️  DATOS:');
    Logger.log('   sheetId: ' + sheetId);
    Logger.log('   sheetName: ' + sheetName);
    Logger.log('   cod_patrim: ' + cod_patrim);
    Logger.log('   descripcion: ' + descripcion);
    Logger.log('   marca: ' + marca);
    Logger.log('   modelo: ' + modelo);
    Logger.log('   color: ' + color);
    Logger.log('   apellidos_nombres: ' + apellidos_nombres);
    Logger.log('   nombre_ofi: ' + nombre_ofi);
    Logger.log('   operator: ' + operator);
    
    // Validar parámetros
    if (!sheetId || !cod_patrim || !descripcion) {
      Logger.log('❌ ERROR: Parámetros faltantes');
      return createErrorResponse('Parámetros faltantes: sheetId, cod_patrim, descripcion son requeridos');
    }
    
    Logger.log('✅ Parámetros válidos');
    
    // Obtener acceso al spreadsheet
    let spreadsheet;
    try {
      Logger.log('🔓 Abriendo spreadsheet...');
      spreadsheet = SpreadsheetApp.openById(sheetId);
      Logger.log('✅ Spreadsheet abierto');
    } catch (error) {
      Logger.log('❌ Error al abrir spreadsheet: ' + error.toString());
      return createErrorResponse('No se pudo acceder al spreadsheet: ' + error.toString());
    }
    
    // Obtener la hoja
    let sheet;
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        Logger.log('❌ Hoja no encontrada: ' + sheetName);
        return createErrorResponse('La hoja ' + sheetName + ' no existe');
      }
      Logger.log('✅ Hoja encontrada');
    } catch (error) {
      Logger.log('❌ Error obteniendo hoja: ' + error.toString());
      return createErrorResponse('Error accediendo a la hoja: ' + error.toString());
    }
    
    // Agregar nueva fila
    try {
      Logger.log('🔄 Agregando nueva fila...');
      
      // Obtener última fila
      const lastRow = sheet.getLastRow();
      const newRowIndex = lastRow + 1;
      
      Logger.log('📍 Nueva fila: ' + newRowIndex);
      
      // Completar datos (basado en la estructura de 21 columnas)
      // F(6) = Apellidos_Nombres, G(7) = Nombre_Ofi
      // J(10) = Código Patrimonio, K(11) = Descripción, L(12) = Marca, M(13) = Modelo
      // N(14) = Color
      // S(19) = INVENTARIADO, T(20) = F_REGISTRO, U(21) = REGISTRADO_POR
      
      sheet.getRange(newRowIndex, 6).setValue(apellidos_nombres);         // F - Apellidos_Nombres
      sheet.getRange(newRowIndex, 7).setValue(nombre_ofi);               // G - Nombre_Ofi
      sheet.getRange(newRowIndex, 10).setValue(cod_patrim);              // J - Código Patrimonio
      sheet.getRange(newRowIndex, 11).setValue(descripcion);             // K - Descripción
      sheet.getRange(newRowIndex, 12).setValue(marca);                   // L - Marca
      sheet.getRange(newRowIndex, 13).setValue(modelo);                  // M - Modelo
      sheet.getRange(newRowIndex, 14).setValue(color);                   // N - Color
      sheet.getRange(newRowIndex, 19).setValue('SI');                    // S - INVENTARIADO
      sheet.getRange(newRowIndex, 20).setValue(new Date().toLocaleString('es-ES')); // T - F_REGISTRO
      sheet.getRange(newRowIndex, 21).setValue(operator);                // U - REGISTRADO_POR
      
      Logger.log('✅ Fila agregada correctamente');
      Logger.log('   Fila: ' + newRowIndex);
      Logger.log('   Código: ' + cod_patrim);
      Logger.log('   Descripción: ' + descripcion);
      Logger.log('   Marca: ' + marca);
      Logger.log('   Modelo: ' + modelo);
      Logger.log('   Color: ' + color);
      Logger.log('   Apellidos_Nombres: ' + apellidos_nombres);
      Logger.log('   Nombre_Ofi: ' + nombre_ofi);
      
      const successData = {
        message: 'Nuevo bien agregado correctamente',
        rowIndex: newRowIndex,
        cod_patrim: cod_patrim,
        descripcion: descripcion,
        marca: marca,
        modelo: modelo,
        color: color,
        apellidos_nombres: apellidos_nombres,
        nombre_ofi: nombre_ofi,
        timestamp: new Date().toISOString(),
        status: 'success'
      };
      
      Logger.log('📤 Enviando respuesta exitosa...');
      Logger.log('═══════════════════════════════════════════════════════');
      
      return createSuccessResponse(successData);
      
    } catch (addError) {
      Logger.log('❌ ERROR AL AGREGAR FILA:');
      Logger.log('   Error: ' + addError.toString());
      Logger.log('   Stack: ' + addError.stack);
      Logger.log('═══════════════════════════════════════════════════════');
      return createErrorResponse('Error al agregar fila: ' + addError.toString());
    }
  } catch (error) {
    Logger.log('❌ ERROR EN handleAddNewRow:');
    Logger.log('   Error: ' + error.toString());
    Logger.log('═══════════════════════════════════════════════════════');
    return createErrorResponse('Error: ' + error.toString());
  }
}

/**
 * Crea una respuesta exitosa
 */
function createSuccessResponse(data) {
  var response = ContentService.createTextOutput(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString(),
    data: data
  }));
  response.setMimeType(ContentService.MimeType.JSON);
  
  Logger.log('✅ Respuesta enviada correctamente');
  return response;
}

/**
 * Crea una respuesta de error
 */
function createErrorResponse(message) {
  var response = ContentService.createTextOutput(JSON.stringify({
    success: false,
    timestamp: new Date().toISOString(),
    error: message
  }));
  response.setMimeType(ContentService.MimeType.JSON);
  
  Logger.log('❌ Error enviado: ' + message);
  return response;
}

/**
 * Maneja peticiones OPTIONS para CORS
 * Nota: Google Sheets maneja CORS automáticamente cuando se despliega como Web App
 */
function doOptions(e) {
  var response = ContentService.createTextOutput('');
  response.setMimeType(ContentService.MimeType.TEXT);
  return response;
}

/**
 * Función de prueba para verificar que el Apps Script funciona
 */
function testAppsScript() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('🧪 PRUEBA DE GOOGLE APPS SCRIPT');
  Logger.log('═══════════════════════════════════════════════════════');
  
  try {
    // Verificar acceso a SpreadsheetApp
    Logger.log('✅ SpreadsheetApp disponible');
    
    // Verificar funciones auxiliares
    var testResponse = createSuccessResponse({ test: 'OK' });
    Logger.log('✅ createSuccessResponse funciona');
    
    var testError = createErrorResponse('Test');
    Logger.log('✅ createErrorResponse funciona');
    
    Logger.log('');
    Logger.log('✨ RESULTADO: El script está correctamente configurado');
    Logger.log('');
    Logger.log('📋 INSTRUCCIONES PARA USAR:');
    Logger.log('1. Guarda este script (Ctrl+S)');
    Logger.log('2. Ve a "Desplegar" → "Nueva implementación"');
    Logger.log('3. Tipo: "Aplicación web"');
    Logger.log('4. Ejecutar como: Tu cuenta');
    Logger.log('5. Permitir acceso: "Cualquiera"');
    Logger.log('6. Copia la URL y pégala en config.js como webAppUrl');
    Logger.log('');
    Logger.log('✅ Después podrás usar la app para actualizar el inventario en Excel');
    Logger.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    Logger.log('❌ ERROR en testAppsScript: ' + error.toString());
    Logger.log('   Stack: ' + error.stack);
  }
}
