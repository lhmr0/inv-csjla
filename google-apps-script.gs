/**
 * Google Apps Script para Sistema de Inventario
 * 
 * ESTRUCTURA DEL EXCEL:
 * A: Código | B: Descripción | C: Categoría | D: Ubicación
 * E: Cantidad | F: Inventariado | G: Fecha Inventario | H: Realizado Por
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Abre tu Google Sheet
 * 2. Ve a Extensiones > Apps Script
 * 3. Elimina el código que hay por defecto
 * 4. Pega este código
 * 5. Guarda (Ctrl+S)
 * 6. Desplegar → Nueva implementación → Aplicación web
 * 7. Copia la URL y pégala en la app
 */

/**
 * Maneja peticiones GET
 */
function doGet(e) {
  try {
    const params = e.parameter;
    
    Logger.log('📝 Parámetros recibidos:', JSON.stringify(params));
    
    // Obtener el ID del sheet de los parámetros
    const sheetId = params.sheetId;
    const sheetName = params.sheetName || 'Hoja1';
    const rowIndex = parseInt(params.row);
    const inventariado = params.inventariado || 'SI';
    const fecha = params.fecha || '';
    const realizado = params.realizado || '';
    
    // Validar parámetros
    if (!sheetId || !rowIndex || rowIndex < 2) {
      Logger.log('❌ Parámetros inválidos');
      return createErrorResponse('Parámetros inválidos: sheetId y row son requeridos');
    }
    
    Logger.log('✅ Parámetros válidos - SheetId: ' + sheetId + ', Row: ' + rowIndex);
    
    // Obtener acceso al spreadsheet
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(sheetId);
      Logger.log('✅ Spreadsheet abierto correctamente');
    } catch (error) {
      Logger.log('❌ Error al abrir spreadsheet: ' + error.toString());
      return createErrorResponse('No se pudo acceder al spreadsheet. Verifica el ID.');
    }
    
    // Obtener la hoja
    let sheet;
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
      Logger.log('✅ Hoja encontrada: ' + sheetName);
    } catch (error) {
      Logger.log('❌ Error al obtener hoja: ' + error.toString());
      return createErrorResponse(`La hoja "${sheetName}" no existe`);
    }
    
    if (!sheet) {
      Logger.log('❌ La hoja es null');
      return createErrorResponse(`La hoja "${sheetName}" no existe`);
    }
    
    // Actualizar las celdas
    // Columnas: F=6 (Inventariado), G=7 (Fecha), H=8 (Realizado Por)
    try {
      Logger.log('📝 Actualizando fila ' + rowIndex);
      Logger.log('  - Columna F (6): ' + inventariado);
      Logger.log('  - Columna G (7): ' + fecha);
      Logger.log('  - Columna H (8): ' + realizado);
      
      sheet.getRange(rowIndex, 6).setValue(inventariado);      // F - Inventariado
      sheet.getRange(rowIndex, 7).setValue(fecha);             // G - Fecha Inventario
      sheet.getRange(rowIndex, 8).setValue(realizado);         // H - Realizado Por
      
      Logger.log('✅ Fila actualizada exitosamente');
      
      return createSuccessResponse({
        message: 'Inventario actualizado correctamente',
        row: rowIndex,
        date: fecha,
        operator: realizado,
        timestamp: new Date().toISOString()
      });
      
    } catch (updateError) {
      Logger.log('❌ Error al actualizar la fila: ' + updateError.toString());
      return createErrorResponse(`Error al actualizar la fila ${rowIndex}: ${updateError.toString()}`);
    }
    
  } catch (error) {
    Logger.log('❌ Error general en doGet: ' + error.toString());
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
  const response = ContentService.createTextOutput(JSON.stringify({
    success: true,
    timestamp: new Date().toISOString(),
    data: data
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeader('Access-Control-Allow-Origin', '*')
  .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  Logger.log('✅ Respuesta enviada correctamente');
  return response;
}

/**
 * Crea una respuesta de error
 */
function createErrorResponse(message) {
  const response = ContentService.createTextOutput(JSON.stringify({
    success: false,
    timestamp: new Date().toISOString(),
    error: message
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeader('Access-Control-Allow-Origin', '*')
  .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  Logger.log('❌ Error enviado: ' + message);
  return response;
}

/**
 * Maneja peticiones OPTIONS para CORS
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Función de prueba para verificar que el Apps Script funciona
 */
function testAppsScript() {
  Logger.log('Google Apps Script para inventario está configurado correctamente');
}
