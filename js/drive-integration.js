/**
 * Módulo de integración con Google Drive
 * Permite guardar fotos en Google Drive (requiere autenticación)
 */
const DriveIntegration = {
    isAuthenticated: false,
    accessToken: null,
    folderId: null,

    /**
     * Inicializa Google Drive API (requiere configuración OAuth2)
     * Para habilitar esta funcionalidad:
     * 1. Ve a Google Cloud Console
     * 2. Crea un proyecto
     * 3. Habilita Google Drive API
     * 4. Crea credenciales OAuth2 (tipo: Web Application)
     * 5. Copia el Client ID
     * 6. Actualiza CLIENT_ID en este archivo
     */
    CLIENT_ID: '712747266136-7ifncp4urd4hve1kl4nemhf8t735v5mi.apps.googleusercontent.com', // Reemplazar con Client ID de Google Cloud
    SCOPES: 'https://www.googleapis.com/auth/drive.file',

    /**
     * Autentica con Google Drive
     */
    async authenticate() {
        if (!this.isAuthenticated && !this.CLIENT_ID.includes('TU_CLIENT_ID')) {
            return new Promise((resolve, reject) => {
                gapi.auth2.getAuthInstance()
                    .signIn()
                    .then(user => {
                        this.isAuthenticated = true;
                        this.accessToken = user.getAuthResponse().id_token;
                        console.log('✅ Autenticado en Google Drive');
                        resolve(true);
                    })
                    .catch(error => {
                        console.error('Error autenticando en Google Drive:', error);
                        reject(error);
                    });
            });
        }
        return false;
    },

    /**
     * Crea/obtiene carpeta para almacenar fotos
     */
    async getOrCreateFolder(folderName = 'Inventario_Fotos') {
        try {
            // Buscar carpeta existente
            const response = await gapi.client.drive.files.list({
                q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name)',
                pageSize: 1
            });

            if (response.result.files && response.result.files.length > 0) {
                this.folderId = response.result.files[0].id;
                console.log('📁 Carpeta encontrada:', this.folderId);
                return this.folderId;
            }

            // Crear carpeta si no existe
            const createResponse = await gapi.client.drive.files.create({
                resource: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder'
                },
                fields: 'id'
            });

            this.folderId = createResponse.result.id;
            console.log('📁 Carpeta creada:', this.folderId);
            return this.folderId;
        } catch (error) {
            console.error('Error manejando carpeta de Drive:', error);
            throw error;
        }
    },

    /**
     * Sube una foto a Google Drive
     * @param {string} photoData - Datos de la foto en base64
     * @param {string} fileName - Nombre del archivo
     * @returns {string} File ID de Google Drive
     */
    async uploadPhoto(photoData, fileName) {
        try {
            // Convertir base64 a Blob
            const base64Data = photoData.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });

            const metadata = {
                name: fileName,
                parents: [this.folderId],
                mimeType: 'image/jpeg'
            };

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', blob);

            const response = await fetch(
                'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    body: formData
                }
            );

            const file = await response.json();
            console.log('📤 Foto subida a Drive:', file.id);
            return file.id;
        } catch (error) {
            console.error('Error subiendo foto a Drive:', error);
            throw error;
        }
    },

    /**
     * Sube múltiples fotos
     * @param {Array} photos - Array de datos de fotos
     * @param {string} prefix - Prefijo para nombres de archivo
     * @returns {Array} Array de File IDs
     */
    async uploadPhotos(photos, prefix = 'inventario') {
        try {
            const fileIds = [];
            for (let i = 0; i < photos.length; i++) {
                const fileName = `${prefix}_foto_${i + 1}_${new Date().getTime()}.jpg`;
                const fileId = await this.uploadPhoto(photos[i].data, fileName);
                fileIds.push(fileId);
                console.log(`✅ Foto ${i + 1}/${photos.length} subida`);
            }
            return fileIds;
        } catch (error) {
            console.error('Error subiendo fotos:', error);
            throw error;
        }
    },

    /**
     * Elimina un archivo de Google Drive
     * @param {string} fileId - ID del archivo en Drive
     */
    async deleteFile(fileId) {
        try {
            await gapi.client.drive.files.delete({
                fileId: fileId
            });
            console.log('🗑️ Archivo eliminado de Drive');
        } catch (error) {
            console.error('Error eliminando archivo de Drive:', error);
            throw error;
        }
    },

    /**
     * Obtiene URL compartible de un archivo
     * @param {string} fileId - ID del archivo en Drive
     * @returns {string} URL compartible
     */
    getShareableLink(fileId) {
        return `https://drive.google.com/uc?id=${fileId}&export=view`;
    }
};

// Inicializar cuando carga la API de Google
function initGoogleAPI() {
    try {
        if (!window.gapi) {
            console.log('⚠️ Google API no disponible - Drive opcional deshabilitado');
            return;
        }

        gapi.load('client:auth2', () => {
            try {
                // Solo inicializar si hay un Client ID válido configurado
                if (DriveIntegration.CLIENT_ID && !DriveIntegration.CLIENT_ID.includes('TU_CLIENT_ID')) {
                    gapi.client.init({
                        clientId: DriveIntegration.CLIENT_ID,
                        scope: DriveIntegration.SCOPES
                    }).then(() => {
                        console.log('✅ Google Drive API iniciado');
                    }).catch(error => {
                        console.warn('⚠️ Google Drive no inicializado (OK - es opcional)');
                        console.log('Para usar Drive, registra http://127.0.0.1:5500 en Google Cloud Console');
                    });
                } else {
                    console.log('ℹ️ Google Drive no configurado - Usando almacenamiento local (recomendado)');
                }
            } catch (error) {
                console.warn('⚠️ Error incializando Google API:', error.message);
            }
        });
    } catch (error) {
        console.warn('⚠️ Google API no disponible. App funcionará sin Drive (OK).');
    }
}

// Cargar Google API cuando esté disponible (pero no bloquear si falla)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initGoogleAPI, 200);
    });
} else {
    setTimeout(initGoogleAPI, 200);
}
