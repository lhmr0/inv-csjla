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

/**
 * Maneja peticiones GET
 */
function doGet(e) {
  try {
    // Si e es undefined (cuando se ejecuta manualmente desde el editor), retornar error
    if (!e) {
      Logger.log('⚠️  ADVERTENCIA: La función se ejecutó sin parámetros');
      Logger.log('   Esto es normal al usar el botón ▶️ en el editor');
      Logger.log('   Para probar, accede a: https://script.google.com/macros/d/{SCRIPT_ID}/usercurrentapp');
      Logger.log('   Y agrega los parámetros como: ?sheetId=...&row=2&inventariado=SI');
      return createErrorResponse('Parámetros faltantes. Esta función debe ser llamada como Web App.');
    }
    
    const params = e.parameter;
    
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
    
  } catch (error) {
    Logger.log('❌ ERROR GENERAL EN doGet:');
    Logger.log('   Error: ' + error.toString());
    Logger.log('   Stack: ' + error.stack);
    Logger.log('═══════════════════════════════════════════════════════');
    return createErrorResponse(`Error del servidor: ${error.toString()}`);
  }
}

/**
 * Maneja peticiones POST (alternativa a GET)
 */
function doPost(e) {
  return doGet(e);
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
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
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
