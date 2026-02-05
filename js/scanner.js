/**
 * Módulo de escaneo de códigos de barras
 * Utiliza QuaggaJS para la detección
 */
const BarcodeScanner = {
    isRunning: false,
    currentCamera: 'environment',
    cameras: [],
    onDetected: null,
    lastDetectedCode: null,
    lastDetectedTime: 0,
    debounceTime: 2000, // 2 segundos entre escaneos del mismo código

    /**
     * Inicializa el escáner
     * @param {Function} callback - Función a llamar cuando se detecta un código
     */
    async init(callback) {
        this.onDetected = callback;
        
        // Obtener lista de cámaras disponibles
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameras = devices.filter(device => device.kind === 'videoinput');
            console.log('Cámaras disponibles:', this.cameras);
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

        // Verificar que Quagga esté disponible
        if (typeof Quagga === 'undefined') {
            throw new Error('La librería de escaneo no se ha cargado. Recarga la página e intenta nuevamente.');
        }

        // Limpiar cualquier instancia anterior
        try {
            Quagga.stop();
        } catch (e) {
            console.log('No había instancia anterior que detener');
        }

        return new Promise((resolve, reject) => {
            const videoElement = document.querySelector('#video');
            
            // Asegurar que el elemento existe
            if (!videoElement) {
                reject(new Error('Elemento de video no encontrado'));
                return;
            }

            console.log('📹 Iniciando escaneo...');
            console.log('   Resolución máxima: 1920x1080');
            console.log('   Cámara: ' + this.currentCamera);

            const config = {
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: videoElement,
                    constraints: {
                        width: { min: 320, ideal: 1280, max: 1920 },
                        height: { min: 240, ideal: 720, max: 1080 },
                        facingMode: this.currentCamera,
                        aspectRatio: { ideal: 4 / 3 }
                    }
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: CONFIG.scanner.numOfWorkers,
                frequency: CONFIG.scanner.frequency,
                decoder: {
                    readers: CONFIG.scanner.formats,
                    debug: {
                        showCanvas: false,
                        showPatches: false,
                        showFoundPatches: false,
                        showSkeleton: false,
                        showLabels: false,
                        showCandidates: false,
                        showBoundingBox: false
                    }
                },
                locate: CONFIG.scanner.locate
            };

            Quagga.init(config, (err) => {
                if (err) {
                    console.error('❌ Error inicializando Quagga:', err);
                    reject(new Error(CONFIG.messages.cameraError + ': ' + (err.message || err)));
                    return;
                }

                console.log('✅ Quagga inicializado');
                
                try {
                    Quagga.start();
                    this.isRunning = true;
                    console.log('✅ Stream de video iniciado');
                    
                    // Configurar detector de códigos
                    Quagga.onDetected(this.handleDetection.bind(this));
                    
                    // Dibujar área de detección (opcional)
                    Quagga.onProcessed(this.handleProcessed.bind(this));
                    
                    resolve(true);
                } catch (startError) {
                    console.error('❌ Error iniciando stream:', startError);
                    reject(new Error('Error iniciando el stream de video'));
                }
            });
        });
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
            Quagga.stop();
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
     * Maneja la detección de un código
     * @param {Object} result - Resultado de Quagga
     */
    handleDetection(result) {
        const code = result.codeResult.code;
        const now = Date.now();

        // Debounce: evitar múltiples detecciones del mismo código
        if (code === this.lastDetectedCode && (now - this.lastDetectedTime) < this.debounceTime) {
            return;
        }

        // Verificar confiabilidad del escaneo
        const errors = result.codeResult.decodedCodes
            .filter(x => x.error !== undefined)
            .map(x => x.error);
        
        const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
        
        // Solo aceptar si el error promedio es bajo
        if (avgError > 0.1) {
            console.log('Código descartado por baja confiabilidad:', code, avgError);
            return;
        }

        this.lastDetectedCode = code;
        this.lastDetectedTime = now;

        // Vibrar para feedback (si está disponible)
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        // Reproducir sonido de escaneo
        this.playBeep();

        // Llamar al callback
        if (this.onDetected) {
            this.onDetected(code, result.codeResult.format);
        }
    },

    /**
     * Maneja el procesamiento de frames (para debug visual)
     * @param {Object} result - Resultado del procesamiento
     */
    handleProcessed(result) {
        // Opcional: dibujar rectángulos de detección
        // Esto puede ser útil para debugging pero consume recursos
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
            console.log('No se pudo reproducir sonido');
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
     * Reinicia el detector con nueva configuración
     * @param {Array} formats - Formatos de código de barras a detectar
     */
    async setFormats(formats) {
        if (this.isRunning) {
            this.stop();
            CONFIG.scanner.formats = formats;
            await this.start();
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
                Quagga.decodeSingle({
                    src: e.target.result,
                    numOfWorkers: 0,
                    decoder: {
                        readers: CONFIG.scanner.formats
                    }
                }, (result) => {
                    if (result && result.codeResult) {
                        resolve(result.codeResult.code);
                    } else {
                        resolve(null);
                    }
                });
            };
            reader.readAsDataURL(imageFile);
        });
    }
};
