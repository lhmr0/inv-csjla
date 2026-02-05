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
    const params = e.parameter;
    
    Logger.log('📝 Parámetros recibidos:', JSON.stringify(params));
    
    // Obtener los parámetros
    const sheetId = params.sheetId;
    const sheetName = params.sheetName || 'Hoja1';
    const rowIndex = parseInt(params.row);
    const inventariado = params.inventariado || 'SI';
    const f_registro = params.f_registro || '';
    const registrado_por = params.registrado_por || '';
    
    // Validar parámetros
    if (!sheetId || !rowIndex || rowIndex < 2) {
      Logger.log('❌ Parámetros inválidos');
      return createErrorResponse('Parámetros inválidos: sheetId y row son requeridos');
    }
    
    Logger.log('✅ Parámetros válidos - SheetId: ' + sheetId + ', Row: ' + rowIndex);
    Logger.log('   inventariado=' + inventariado + ', f_registro=' + f_registro + ', registrado_por=' + registrado_por);
    
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
    // Columnas: S=19 (INVENTARIADO), T=20 (F_REGISTRO), U=21 (REGISTRADO_POR)
    try {
      Logger.log('📝 Actualizando fila ' + rowIndex);
      Logger.log('  - Columna S (19): ' + inventariado);
      Logger.log('  - Columna T (20): ' + f_registro);
      Logger.log('  - Columna U (21): ' + registrado_por);
      
      sheet.getRange(rowIndex, 19).setValue(inventariado);      // S - INVENTARIADO
      sheet.getRange(rowIndex, 20).setValue(f_registro);        // T - F_REGISTRO
      sheet.getRange(rowIndex, 21).setValue(registrado_por);    // U - REGISTRADO_POR
      
      Logger.log('✅ Fila actualizada exitosamente');
      
      return createSuccessResponse({
        message: 'Inventario actualizado correctamente',
        row: rowIndex,
        inventariado: inventariado,
        f_registro: f_registro,
        registrado_por: registrado_por,
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
