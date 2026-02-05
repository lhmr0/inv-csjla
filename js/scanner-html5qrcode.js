/**
 * Módulo de escaneo de códigos de barras y QR codes
 * Utiliza ZXing (soporta EAN, Code128, QR, y más)
 */
const BarcodeScanner = {
    codeReader: null,
    multiFormatReader: null,
    hints: null,
    isRunning: false,
    onDetected: null,
    lastDetectedCode: null,
    lastDetectedTime: 0,
    debounceTime: 800,  // Reducido a 800ms para mejor detección
    devices: [],
    currentDeviceIndex: 0,
    videoElement: null,
    scanningInterval: null,
    currentStream: null,

    /**
     * Inicializa el escáner
     * @param {Function} callback - Función a llamar cuando se detecta un código
     */
    async init(callback) {
        this.onDetected = callback;

        // Verificar que ZXing esté disponible
        if (typeof ZXing === 'undefined') {
            throw new Error('La librería de escaneo no se ha cargado. Recarga la página e intenta nuevamente.');
        }

        console.log('✅ ZXing inicializado');

        // Preparar contenedor y elemento de video
        const container = document.getElementById('video');
        if (!container) {
            throw new Error('No se encontró el elemento contenedor del scanner');
        }

        container.innerHTML = '';
        const video = document.createElement('video');
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        video.autoplay = true;
        video.id = 'scannerVideo';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        container.appendChild(video);
        this.videoElement = video;

        // Configurar formatos soportados
        const hints = new Map();
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
            ZXing.BarcodeFormat.EAN_13,
            ZXing.BarcodeFormat.EAN_8,
            ZXing.BarcodeFormat.UPC_A,
            ZXing.BarcodeFormat.UPC_E,
            ZXing.BarcodeFormat.CODE_128,
            ZXing.BarcodeFormat.CODE_39,
            ZXing.BarcodeFormat.CODABAR,
            ZXing.BarcodeFormat.ITF,
            ZXing.BarcodeFormat.QR_CODE,
            ZXing.BarcodeFormat.DATA_MATRIX
        ]);
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

        this.hints = hints;
        this.multiFormatReader = new ZXing.MultiFormatReader();
        this.multiFormatReader.setHints(hints);
        this.codeReader = new ZXing.BrowserMultiFormatReader(hints, 500);
        console.log('✅ Scanner ZXing creado correctamente');
    },

    /**
     * Inicia el escaneo
     * @returns {Promise<boolean>} true si se inició correctamente
     */
    async start() {
        if (this.isRunning) {
            return true;
        }

        if (!this.codeReader || !this.videoElement) {
            throw new Error('El escáner no ha sido inicializado. Llama a init() primero.');
        }

        try {
            console.log('📹 Iniciando escaneo con polling manual...');

            // Obtener dispositivos de cámara
            let devices = [];
            try {
                devices = await navigator.mediaDevices.enumerateDevices();
                devices = devices.filter(device => device.kind === 'videoinput');
            } catch (err) {
                console.warn('No se pudo enumerar dispositivos:', err);
                throw err;
            }
            
            if (!devices || devices.length === 0) {
                throw new Error('No se encontraron dispositivos de cámara');
            }

            // Si es la primera vez, guardar dispositivos
            if (this.devices.length === 0) {
                this.devices = devices;
                this.currentDeviceIndex = 0;
            } else {
                // Actualizar la lista de dispositivos
                this.devices = devices;
            }

            // Usar el índice actual (puede haber sido cambiado por switchCamera)
            const deviceId = this.devices[this.currentDeviceIndex].deviceId;
            
            console.log('📱 Cámaras disponibles:', devices.map(d => d.label || 'Cámara').join(', '));
            console.log('✅ Usando (índice ' + this.currentDeviceIndex + '):', this.devices[this.currentDeviceIndex].label || 'Cámara predeterminada');

            // Obtener stream de video
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            // Asignar stream al video element
            this.videoElement.srcObject = this.currentStream;

            // Esperar a que el video esté listo
            await new Promise((resolve) => {
                const checkReady = () => {
                    if (this.videoElement.readyState === 4) {
                        resolve();
                    } else {
                        this.videoElement.addEventListener('canplay', resolve, { once: true });
                    }
                };
                checkReady();
            });

            console.log('✅ Video stream conectado');

            this.isRunning = true;
            
            // Iniciar polling manual cada 100ms para detección más rápida
            this.scanningInterval = setInterval(() => {
                this.scanFrame();
            }, 100);

            console.log('✅ Escaneo activo - Polling cada 100ms');
            return true;

        } catch (error) {
            console.error('❌ Error iniciando scanner:', error);
            this.isRunning = false;
            throw new Error('No se pudo acceder a la cámara: ' + (error.message || error));
        }
    },

    /**
     * Escanea un frame del video con pre-procesamiento
     */
    scanFrame() {
        if (!this.isRunning || !this.videoElement || this.videoElement.readyState !== 4) {
            return;
        }

        try {
            // Crear canvas
            const canvas = document.createElement('canvas');
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;
            
            if (canvas.width === 0 || canvas.height === 0) {
                return;
            }

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(this.videoElement, 0, 0);

            // Obtener imagen original
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Intentar decodificar imagen original
            try {
                const result = this.multiFormatReader.decodeWithState(imageData);
                if (result) {
                    this.handleDetection(result.getText());
                    return;
                }
            } catch (e) {
                // Continuar con pre-procesamiento
            }

            // Pre-procesamiento: Aumentar contraste para mejor detección de Code 128
            imageData = this.enhanceImage(imageData);

            // Intentar decodificar imagen mejorada
            try {
                const result = this.multiFormatReader.decodeWithState(imageData);
                if (result) {
                    this.handleDetection(result.getText());
                    return;
                }
            } catch (e) {
                // Ignorar - continuar siguiente frame
            }

        } catch (error) {
            // Silencioso
        }
    },

    /**
     * Mejora la calidad de la imagen para detección de códigos de barras
     */
    enhanceImage(imageData) {
        const data = imageData.data;
        
        // Aumentar contraste y brillo
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convertir a escala de grises
            const gray = (r + g + b) / 3;
            
            // Aumentar contraste agresivamente
            const contrast = 2.5;
            const brightness = -50;
            const enhanced = (gray - 128) * contrast + 128 + brightness;
            
            // Aplicar umbral adaptativo (binarización)
            const value = enhanced > 128 ? 255 : 0;
            
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
            data[i + 3] = 255;
        }
        
        return imageData;
    },

    /**
     * Maneja la detección de un código
     * @param {string} code - Código detectado
     */
    handleDetection(code) {
        if (!code || code.trim() === '') {
            return;
        }

        const now = Date.now();

        // Debounce: evitar múltiples detecciones del mismo código
        if (code === this.lastDetectedCode && (now - this.lastDetectedTime) < this.debounceTime) {
            return;
        }

        this.lastDetectedCode = code;
        this.lastDetectedTime = now;

        console.log('✅ ✅ ✅ ¡CÓDIGO DETECTADO! ✅ ✅ ✅', code);
        console.log('📊 Longitud:', code.length, '| Tipo:', code.match(/^\d+$/) ? 'Numérico' : 'Alfanumérico');

        // Vibrar para feedback
        try {
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        } catch (e) {
            console.debug('Vibración no disponible');
        }

        // Reproducir sonido
        this.playBeep();

        // Flash visual
        this.addDetectionFlash();

        // Callback
        if (this.onDetected) {
            try {
                this.onDetected(code, 'Barcode');
            } catch (err) {
                console.error('Error en callback:', err);
            }
        }
    },

    /**
     * Agrega un flash visual cuando detecta un código
     */
    addDetectionFlash() {
        if (!this.videoElement) return;
        
        try {
            // Crear overlay flash
            const flash = document.createElement('div');
            flash.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(6, 182, 212, 0.3);
                pointer-events: none;
                z-index: 500;
                animation: flashAnimation 0.4s ease-out;
            `;
            document.body.appendChild(flash);
            
            setTimeout(() => {
                flash.remove();
            }, 400);
        } catch (err) {
            console.debug('Flash visual no disponible');
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
            
            // Detener polling
            if (this.scanningInterval) {
                clearInterval(this.scanningInterval);
                this.scanningInterval = null;
            }

            // Detener stream de video
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
                this.currentStream = null;
            }

            if (this.videoElement) {
                this.videoElement.srcObject = null;
            }

            // Limpiar reader
            if (this.codeReader) {
                try {
                    this.codeReader.reset();
                } catch (e) {
                    // Ignorar errores en reset
                }
            }

            this.isRunning = false;
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
        try {
            if (!this.devices || this.devices.length === 0) {
                throw new Error('No hay cámaras disponibles');
            }

            if (this.devices.length <= 1) {
                const msg = 'Solo hay ' + this.devices.length + ' cámara disponible';
                console.warn(msg);
                throw new Error(msg);
            }

            console.log('🔄 Disponibles:', this.devices.length, 'cámaras');
            console.log('   Actual:', this.devices[this.currentDeviceIndex].label);

            // Cambiar índice
            this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.devices.length;
            const cameraLabel = this.devices[this.currentDeviceIndex].label || ('Cámara ' + (this.currentDeviceIndex + 1));
            
            console.log('🔄 Cambiando a:', cameraLabel);

            // Detener escaneo actual
            this.stop();

            // Pequeña pausa antes de iniciar
            await new Promise(r => setTimeout(r, 300));

            // Iniciar escaneo con nueva cámara
            await this.start();

            console.log('✅ Cámara cambiada exitosamente a:', cameraLabel);
            return true;
        } catch (error) {
            console.error('❌ Error cambiando cámara:', error);
            throw error;
        }
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
        if (!this.codeReader || !this.multiFormatReader) {
            throw new Error('El escáner no ha sido inicializado. Llama a init() primero.');
        }

        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsDataURL(imageFile);
        });

        const img = new Image();
        img.src = dataUrl;

        await new Promise((resolve, reject) => {
            img.onload = () => resolve(true);
            img.onerror = () => reject(new Error('Error cargando imagen'));
        });

        const scales = [1, 1.5, 2, 3];
        const rotations = [0, 90, 180, 270];
        const thresholds = [null, 96, 128, 160, 192];

        for (const scale of scales) {
            const baseCanvas = document.createElement('canvas');
            baseCanvas.width = Math.round(img.width * scale);
            baseCanvas.height = Math.round(img.height * scale);
            const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
            baseCtx.imageSmoothingEnabled = true;
            baseCtx.drawImage(img, 0, 0, baseCanvas.width, baseCanvas.height);

            for (const rotation of rotations) {
                const rotatedCanvas = this.rotateCanvas(baseCanvas, rotation);
                const ctx = rotatedCanvas.getContext('2d', { willReadFrequently: true });
                const imageData = ctx.getImageData(0, 0, rotatedCanvas.width, rotatedCanvas.height);

                for (const threshold of thresholds) {
                    const processed = threshold === null
                        ? imageData
                        : this.applyThreshold(imageData, threshold);

                    const decodedHybrid = this.decodeFromImageData(processed, 'hybrid');
                    if (decodedHybrid) {
                        return decodedHybrid;
                    }

                    const decodedGlobal = this.decodeFromImageData(processed, 'global');
                    if (decodedGlobal) {
                        return decodedGlobal;
                    }
                }
            }
        }

        console.log('❌ No se detectó código en la imagen');
        return null;
    },

    decodeFromImageData(imageData, mode = 'hybrid') {
        try {
            const luminanceSource = new ZXing.RGBLuminanceSource(
                imageData.data,
                imageData.width,
                imageData.height
            );
            const binarizer = mode === 'global'
                ? new ZXing.GlobalHistogramBinarizer(luminanceSource)
                : new ZXing.HybridBinarizer(luminanceSource);
            const binaryBitmap = new ZXing.BinaryBitmap(binarizer);
            const result = this.multiFormatReader.decode(binaryBitmap);
            return result ? result.getText() : null;
        } catch (error) {
            return null;
        }
    },

    rotateCanvas(canvas, degrees) {
        if (degrees === 0) {
            return canvas;
        }

        const rotated = document.createElement('canvas');
        const ctx = rotated.getContext('2d', { willReadFrequently: true });

        if (degrees === 90 || degrees === 270) {
            rotated.width = canvas.height;
            rotated.height = canvas.width;
        } else {
            rotated.width = canvas.width;
            rotated.height = canvas.height;
        }

        ctx.translate(rotated.width / 2, rotated.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

        return rotated;
    },

    applyThreshold(imageData, threshold) {
        const data = new Uint8ClampedArray(imageData.data);
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luminance = (r * 0.299 + g * 0.587 + b * 0.114);
            const value = luminance >= threshold ? 255 : 0;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
        return new ImageData(data, imageData.width, imageData.height);
    }
};
