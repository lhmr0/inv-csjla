/**
 * Módulo de escaneo de códigos de barras
 * Utiliza jsQR (ligero y confiable)
 */
const BarcodeScanner = {
    isRunning: false,
    currentCamera: 'environment',
    cameras: [],
    onDetected: null,
    lastDetectedCode: null,
    lastDetectedTime: 0,
    debounceTime: 2000,
    mediaStream: null,
    scanInterval: null,
    canvas: null,
    canvasContext: null,

    /**
     * Inicializa el escáner
     * @param {Function} callback - Función a llamar cuando se detecta un código
     */
    async init(callback) {
        this.onDetected = callback;
        
        console.log('✅ jsQR inicializado');
        
        // Crear canvas para capturar frames
        this.canvas = document.createElement('canvas');
        this.canvasContext = this.canvas.getContext('2d', { willReadFrequently: true });
        
        // Obtener lista de cámaras disponibles
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameras = devices.filter(device => device.kind === 'videoinput');
            console.log('✅ Cámaras disponibles:', this.cameras.length);
        } catch (error) {
            console.error('Error enumerating devices:', error);
        }
    },

    /**
     * Inicia el escaneo
     * @returns {Promise<boolean>} true si se inició correctamente
     */
    async start() {
        if (this.isRunning) {
            return true;
        }

        // Verificar que jsQR esté disponible
        if (typeof jsQR === 'undefined') {
            throw new Error('La librería de escaneo no se ha cargado. Recarga la página e intenta nuevamente.');
        }

        return new Promise(async (resolve, reject) => {
            try {
                const videoElement = document.querySelector('#video');
                
                if (!videoElement) {
                    reject(new Error('Elemento de video no encontrado'));
                    return;
                }

                console.log('📹 Iniciando escaneo con jsQR...');
                console.log('   Cámara: ' + this.currentCamera);

                // Obtener ID de la cámara actual
                let cameraId = undefined;
                if (this.cameras.length > 0) {
                    cameraId = this.cameras[0].deviceId;
                    console.log('   Camera ID:', cameraId.substring(0, 20) + '...');
                }

                // Iniciar el stream de video
                this.mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { min: 320, ideal: 1280, max: 1920 },
                        height: { min: 240, ideal: 720, max: 1080 },
                        facingMode: this.currentCamera
                    },
                    audio: false
                });

                console.log('✅ Stream de video obtenido');

                // Asignar stream al video
                videoElement.srcObject = this.mediaStream;
                
                // Reproducir video
                try {
                    await videoElement.play();
                    console.log('✅ Video iniciado');
                } catch (playError) {
                    console.warn('Advertencia al reproducir video:', playError.message);
                }

                this.isRunning = true;

                // Esperar a que el video tenga metadata
                if (videoElement.readyState === videoElement.HAVE_METADATA) {
                    this.startContinuousScan(videoElement);
                } else {
                    videoElement.onloadedmetadata = () => {
                        console.log('✅ Metadata del video cargado');
                        this.startContinuousScan(videoElement);
                    };
                }

                resolve(true);

            } catch (error) {
                console.error('❌ Error iniciando scanner:', error);
                reject(new Error(CONFIG.messages.cameraError + ': ' + (error.message || error)));
            }
        });
    },

    /**
     * Inicia el escaneo continuo
     * @param {HTMLVideoElement} videoElement - Elemento de video
     */
    startContinuousScan(videoElement) {
        console.log('🔄 Iniciando escaneo continuo...');
        
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }

        this.scanInterval = setInterval(() => {
            if (!this.isRunning || !videoElement.srcObject || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
                return;
            }

            try {
                // Configurar canvas con el tamaño del video
                this.canvas.width = videoElement.videoWidth;
                this.canvas.height = videoElement.videoHeight;

                // Dibujar frame actual del video en el canvas
                this.canvasContext.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);

                // Obtener datos de imagen del canvas
                const imageData = this.canvasContext.getImageData(
                    0, 0, this.canvas.width, this.canvas.height
                );

                // Intentar decodificar con jsQR
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert"
                });

                if (code) {
                    this.handleDetection(code.data);
                }

            } catch (error) {
                // Error en escaneo continuo, es normal
            }
        }, 100); // Escanear cada 100ms

        console.log('✅ Escaneo continuo iniciado');
    },

    /**
     * Maneja la detección de un código
     * @param {string} code - Código detectado
     */
    handleDetection(code) {
        const now = Date.now();

        // Debounce: evitar múltiples detecciones del mismo código
        if (code === this.lastDetectedCode && (now - this.lastDetectedTime) < this.debounceTime) {
            return;
        }

        this.lastDetectedCode = code;
        this.lastDetectedTime = now;

        console.log('✅ Código detectado:', code);

        // Vibrar para feedback (si está disponible)
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        // Reproducir sonido de escaneo
        this.playBeep();

        // Llamar al callback
        if (this.onDetected) {
            this.onDetected(code, 'QR/Barcode');
        }
    },

    /**
     * Detiene el escaneo
     */
    stop() {
        if (!this.isRunning) {
            console.log('❌ El escáner no estaba activo');
            return;
        }

        try {
            console.log('🛑 Deteniendo escaneo...');
            
            // Detener intervalo de escaneo
            if (this.scanInterval) {
                clearInterval(this.scanInterval);
                this.scanInterval = null;
            }

            this.isRunning = false;
            
            // Limpiar el video element
            const video = document.querySelector('#video');
            if (video && video.srcObject) {
                console.log('   Deteniendo stream de video...');
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => {
                    console.log('   - Deteniendo track:', track.label);
                    track.stop();
                });
                video.srcObject = null;
            }
            
            console.log('✅ Escaneo detenido correctamente');
        } catch (error) {
            console.error('❌ Error deteniendo escaneo:', error);
        }
    },

    /**
     * Cambia entre cámaras
     * @returns {Promise<boolean>} true si se cambió correctamente
     */
    async switchCamera() {
        this.stop();
        
        // Alternar entre frontal y trasera
        this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
        
        // Esperar un momento antes de reiniciar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return await this.start();
    },

    /**
     * Reproduce un sonido de beep
     */
    playBeep() {
        if (!CONFIG.notifications.soundEnabled) {
            return;
        }

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.log('No se pudo reproducir sonido:', error.message);
        }
    },

    /**
     * Verifica si el navegador soporta la API de cámara
     * @returns {boolean} true si hay soporte
     */
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    /**
     * Solicita permisos de cámara
     * @returns {Promise<boolean>} true si se otorgaron permisos
     */
    async requestPermissions() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Error requesting camera permissions:', error);
            return false;
        }
    },

    /**
     * Procesa una imagen estática para detectar códigos
     * @param {File|Blob} imageFile - Archivo de imagen
     * @returns {Promise<string|null>} Código detectado o null
     */
    async processImage(imageFile) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const context = canvas.getContext('2d');
                    context.drawImage(img, 0, 0);

                    try {
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert"
                        });
                        resolve(code ? code.data : null);
                    } catch (error) {
                        resolve(null);
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(imageFile);
        });
    }
};
