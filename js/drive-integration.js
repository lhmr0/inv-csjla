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
        if (this.isAuthenticated) {
            console.log('✅ Ya autenticado (sesión activa)');
            return true;
        }
        
        if (this.CLIENT_ID.includes('TU_CLIENT_ID')) {
            throw new Error('CLIENT_ID no configurado. Contacta al administrador.');
        }

        return new Promise((resolve, reject) => {
            try {
                console.log('🔓 Iniciando autenticación con Google...');
                const auth2 = gapi.auth2.getAuthInstance();
                
                if (!auth2) {
                    console.error('❌ auth2 no está inicializado');
                    throw new Error('Google Auth2 no disponible. Recarga la página.');
                }

                console.log('Auth2 disponible. Verificando sesión...');
                
                // Verificar si ya está autenticado
                if (auth2.isSignedIn.get()) {
                    console.log('✅ Ya existe sesión de Google');
                    this.isAuthenticated = true;
                    const response = auth2.currentUser.get().getAuthResponse(true);
                    this.accessToken = response.access_token || response.id_token;
                    console.log('✅ Token obtenido, autenticado en Google Drive');
                    resolve(true);
                } else {
                    // Intentar signs in
                    console.log('📱 Abriendo popup de login de Google...');
                    auth2.signIn({
                        scope: 'https://www.googleapis.com/auth/drive.file'
                    }).then((user) => {
                        console.log('✅ Usuario autenticado:', user.getEmail());
                        this.isAuthenticated = true;
                        const response = user.getAuthResponse(true);
                        this.accessToken = response.access_token || response.id_token;
                        console.log('✅ Autenticación exitosa en Google Drive');
                        resolve(true);
                    }).catch((error) => {
                        console.error('❌ Error en signIn:', error.type, error.error);
                        
                        // Mensaje específico por tipo de error
                        if (error.error === 'access_denied') {
                            reject(new Error('Acceso denegado. Autoriza la app para continuar.'));
                        } else if (error.type === 'tokenFailed') {
                            reject(new Error('Error de sesión de Google. Recarga e intenta de nuevo.'));
                        } else {
                            reject(new Error('Error de autenticación: ' + (error.error || error.type || error.message)));
                        }
                    });
                }
            } catch (error) {
                console.error('❌ Exception en authenticate:', error.message);
                reject(error);
            }
        });
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
            // Validar que tenemos acceso token
            if (!this.accessToken) {
                throw new Error('No hay token de acceso. Necesita autenticarse primero.');
            }

            console.log(`📸 Preparando foto para subir: ${fileName}`);

            // Convertir base64 a Blob
            const base64Data = photoData.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            
            console.log(`📦 Tamaño de foto: ${Math.round(blob.size / 1024)}KB`);

            const metadata = {
                name: fileName,
                parents: [this.folderId],
                mimeType: 'image/jpeg'
            };

            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', blob);

            console.log('🚀 Iniciando upload a Google Drive API...');

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

            console.log(`📊 Respuesta del servidor: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error?.message || response.statusText;
                
                if (response.status === 401) {
                    throw new Error('Token expirado o inválido. Autentica de nuevo.');
                } else if (response.status === 403) {
                    throw new Error('Permiso denegado. Verifica OAuth en Google Cloud Console.');
                } else if (response.status === 400) {
                    throw new Error(`Error en solicitud: ${errorMsg}`);
                } else {
                    throw new Error(`Error ${response.status}: ${errorMsg}`);
                }
            }

            const file = await response.json();
            
            if (!file.id) {
                throw new Error('No se recibió ID de archivo desde Google Drive');
            }

            console.log('✅ Foto subida a Drive:', file.id);
            return file.id;
        } catch (error) {
            console.error('❌ Error subiendo foto a Drive:', error.message);
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
        if (!photos || photos.length === 0) {
            throw new Error('No hay fotos para subir');
        }

        console.log(`📤 Iniciando upload de ${photos.length} foto(s)...`);

        try {
            const fileIds = [];
            const failedPhotos = [];

            for (let i = 0; i < photos.length; i++) {
                try {
                    const fileName = `${prefix}_foto_${i + 1}_${new Date().getTime()}.jpg`;
                    console.log(`\n📸 Foto ${i + 1}/${photos.length}: ${fileName}`);
                    
                    const fileId = await this.uploadPhoto(photos[i].data, fileName);
                    fileIds.push(fileId);
                    
                    console.log(`✅ Foto ${i + 1}/${photos.length} subida correctamente`);
                } catch (photoError) {
                    console.error(`❌ Error en foto ${i + 1}:`, photoError.message);
                    failedPhotos.push({ index: i + 1, error: photoError.message });
                }
            }

            if (failedPhotos.length > 0) {
                const msg = `Se subieron ${fileIds.length}/${photos.length} fotos. Fallos:\n${failedPhotos.map(f => `• Foto ${f.index}: ${f.error}`).join('\n')}`;
                console.warn('⚠️ ' + msg);
                throw new Error(msg);
            }

            console.log(`\n✅ Todas las ${fileIds.length} fotos subidas exitosamente`);
            return fileIds;
        } catch (error) {
            console.error('❌ Error en proceso de upload:', error.message);
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
    },

    /**
     * Diagnóstico completo del estado de Drive Integration
     * Llamar desde console: DriveIntegration.diagnose()
     */
    diagnose() {
        console.log('\n========================================');
        console.log('🔍 DIAGNÓSTICO GOOGLE DRIVE');
        console.log('========================================\n');

        // 1. Configuración
        console.log('📋 CONFIGURACIÓN:');
        console.log(`   • CLIENT_ID válido: ${!this.CLIENT_ID.includes('TU_CLIENT_ID') ? '✅ SÍ' : '❌ NO'}`);
        console.log(`   • SCOPES: ${this.SCOPES}`);
        console.log(`   • URL actual: ${window.location.href}`);

        // 2. Estado de autenticación
        console.log('\n🔐 AUTENTICACIÓN:');
        console.log(`   • Autenticado: ${this.isAuthenticated ? '✅ SÍ' : '❌ NO'}`);
        console.log(`   • Access Token: ${this.accessToken ? '✅ Presente' : '❌ No disponible'}`);
        
        // 3. Google API disponibilidad
        console.log('\n📡 GOOGLE API:');
        console.log(`   • gapi disponible: ${window.gapi ? '✅ SÍ' : '❌ NO'}`);
        console.log(`   • auth2 disponible: ${window.gapi?.auth2?.getAuthInstance ? '✅ SÍ' : '❌ NO'}`);
        if (window.gapi?.auth2?.getAuthInstance) {
            const auth2 = window.gapi.auth2.getAuthInstance();
            console.log(`   • Auth2 inicializado: ${auth2 ? '✅ SÍ' : '❌ NO'}`);
            if (auth2) {
                console.log(`   • Google session: ${auth2.isSignedIn?.get() ? '✅ Activa' : '❌ No activa'}`);
            }
        }
        console.log(`   • Drive API cargada: ${window.gapi?.client?.drive ? '✅ SÍ' : '❌ NO'}`);

        // 4. Fotos capturadas
        console.log('\n📸 FOTOS:');
        const photos = window.currentProductPhotos || [];
        console.log(`   • Fotos capturadas: ${photos.length}`);
        if (photos.length > 0) {
            photos.forEach((p, i) => {
                const size = p.data ? Math.round(p.data.length / 1024) : 0;
                console.log(`      ${i + 1}. ${size}KB (${p.timestamp ? new Date(p.timestamp).toLocaleString() : 'sin timestamp'})`);
            });
        }

        // 5. Drive config
        console.log('\n📁 CARPETA DRIVE:');
        console.log(`   • Folder ID: ${this.folderId || '❌ No asignado'}`);

        // 6. localStorage
        console.log('\n💾 STORAGE LOCAL:');
        const allPhotos = Storage?.getAllPhotos?.() || [];
        console.log(`   • Fotos en localStorage: ${allPhotos.length}`);

        // 7. Checklist de requisitos
        console.log('\n✅ CHECKLIST:');
        const checks = {
            'CLIENT_ID configurado': !this.CLIENT_ID.includes('TU_CLIENT_ID'),
            'gapi cargado': !!window.gapi,
            'auth2 disponible': !!window.gapi?.auth2?.getAuthInstance(),
            'Drive API cargada': !!window.gapi?.client?.drive,
            'Fotos capturadas': photos.length > 0,
            'Usuario Google autenticado': window.gapi?.auth2?.getAuthInstance?.()?.isSignedIn?.get?.() ?? false,
            'Token de Drive disponible': this.isAuthenticated && !!this.accessToken
        };

        Object.entries(checks).forEach(([check, result]) => {
            console.log(`   ${result ? '✅' : '❌'} ${check}`);
        });

        // 8. Diagnóstico rápido
        console.log('\n🎯 DIAGNÓSTICO:');
        const healthy = Object.values(checks).every(v => v);
        if (healthy && photos.length > 0) {
            console.log('   ✅ TODO LISTO PARA ENVIAR FOTOS');
        } else {
            const missing = Object.entries(checks)
                .filter(([, v]) => !v)
                .map(([k]) => k);
            console.log(`   ⚠️ Faltan: ${missing.join(', ')}`);
        }

        console.log('\n========================================\n');

        // Retornar objeto con estado para programación
        return {
            healthy: Object.values(checks).every(v => v && photos.length > 0),
            checks,
            photos: photos.length,
            authenticated: this.isAuthenticated,
            folderReady: !!this.folderId
        };
    }
};

// Inicializar cuando carga la API de Google
function initGoogleAPI() {
    try {
        if (!window.gapi) {
            console.log('⚠️ Google API no disponible - Drive opcional deshabilitado');
            return;
        }

        console.log('🔄 Iniciando Google API...');

        gapi.load('client:auth2', () => {
            try {
                // Solo inicializar si hay un Client ID válido configurado
                if (DriveIntegration.CLIENT_ID && !DriveIntegration.CLIENT_ID.includes('TU_CLIENT_ID')) {
                    console.log('📲 Inicializando gapi.client con OAuth2...');
                    
                    gapi.client.init({
                        clientId: DriveIntegration.CLIENT_ID,
                        scope: DriveIntegration.SCOPES,  // ← String, not array
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
                    }).then(() => {
                        console.log('✅ gapi.client inicializado correctamente');
                        
                        // ESPERAR A QUE auth2 esté disponible
                        setTimeout(() => {
                            console.log('⏳ Esperando disponibilidad de auth2...');
                            
                            let auth2Attempts = 0;
                            const checkAuth2 = setInterval(() => {
                                auth2Attempts++;
                                const auth2 = gapi.auth2?.getAuthInstance?.();
                                console.log(`   Intento ${auth2Attempts}: gapi.auth2 disponible =`, !!auth2);
                                
                                if (auth2 || auth2Attempts > 10) {
                                    clearInterval(checkAuth2);
                                    
                                    if (auth2) {
                                        console.log('✅ auth2 está disponible y listo');
                                    } else {
                                        console.warn('⚠️ auth2 no disponible después de esperar');
                                    }
                                    
                                    // Cargar Drive API
                                    if (!gapi.client.drive) {
                                        console.log('🔄 Cargando Drive API v3...');
                                        gapi.client.load('drive', 'v3')
                                            .then(() => {
                                                console.log('✅ Drive v3 API cargada exitosamente');
                                                console.log('📊 Todos los componentes listos:');
                                                console.log('   - gapi.client:', !!gapi.client);
                                                console.log('   - gapi.client.drive:', !!gapi.client.drive);
                                                console.log('   - gapi.auth2:', !!gapi.auth2);
                                            })
                                            .catch(err => {
                                                console.error('❌ Error cargando Drive API:', err);
                                            });
                                    } else {
                                        console.log('✅ Drive API ya estaba disponible');
                                    }
                                }
                            }, 200);
                        }, 500);
                    }).catch(error => {
                        console.error('❌ Error inicializando gapi.client:', error);
                        console.error('   Tipo de error:', error.type || error.error);
                        console.error('   Mensaje:', error.message);
                    });
                } else {
                    console.log('ℹ️ Google Drive no configurado - Usando almacenamiento local (recomendado)');
                }
            } catch (error) {
                console.error('❌ Excepción al inicializar Google API:', error.message);
                console.error('Stack:', error.stack);
            }
        });
    } catch (error) {
        console.warn('⚠️ Google API no disponible. App funcionará sin Drive (OK).');
        console.error('Detalles:', error.message);
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
