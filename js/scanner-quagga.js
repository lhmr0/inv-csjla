/**
 * Módulo de escaneo de códigos de barras 1D/2D
 * Utiliza Quagga.js (especializado en Code 128, EAN, QR, etc.)
 */
const BarcodeScanner = {
    isRunning: false,
    onDetected: null,
    lastDetectedCode: null,
    lastDetectedTime: 0,
    debounceTime: 800,
    devices: [],
    currentDeviceIndex: 0,
    videoElement: null,
    currentStream: null,
    overlayCanvas: null,
    lastFrameTime: 0,
    frameCount: 0,
    lastError: '',
    capturedFrames: [],
    maxStoredFrames: 5,
    codeReader: true, // Dummy para compatibilidad con app.js

    /**
     * Solicita permisos de cámara
     */
    async requestPermissions() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Permiso de cámara denegado:', error);
            return false;
        }
    },

    /**
     * Inicializa el escáner
     * @param {Function} callback - Función a llamar cuando se detecta un código
     */
    async init(callback) {
        this.onDetected = callback;

        // Verificar que Quagga esté disponible
        if (typeof Quagga === 'undefined') {
            throw new Error('La librería Quagga no se ha cargado. Recarga la página.');
        }

        console.log('✅ Quagga.js inicializado');

        // Preparar contenedor y elemento de video
        const container = document.getElementById('video');
        const overlayElement = document.getElementById('scannerOverlay');
        if (!container) {
            throw new Error('No se encontró el elemento contenedor del scanner');
        }
        if (!overlayElement) {
            throw new Error('No se encontró el canvas overlay');
        }

        this.overlayCanvas = overlayElement;
        this.videoElement = container;

        // Obtener dispositivos de cámara disponibles
        await this.getAvailableDevices();
        console.log('📱 Cámaras disponibles:', this.devices.length);

        return true;
    },

    /**
     * Obtiene las cámaras disponibles
     */
    async getAvailableDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.devices = devices.filter(device => device.kind === 'videoinput');
            
            if (this.devices.length === 0) {
                throw new Error('No se encontraron cámaras disponibles');
            }

            this.devices.forEach((device, index) => {
                console.log(`📷 Cámara ${index + 1}: ${device.label || 'Sin nombre'}`);
            });

            return this.devices;
        } catch (error) {
            console.error('Error obteniendo cámaras:', error);
            throw error;
        }
    },

    /**
     * Inicia el escaneo
     */
    async start() {
        if (this.isRunning) {
            console.warn('El escáner ya está corriendo');
            return;
        }

        try {
            console.log('▶️ Iniciando escaneo...');

            // Detener cualquier stream anterior
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
            }

            const device = this.devices[this.currentDeviceIndex];
            if (!device) {
                throw new Error('No hay dispositivo de cámara disponible');
            }

            console.log(`🎥 Usando cámara: ${device.label || 'Cámara ' + (this.currentDeviceIndex + 1)}`);

            // Obtener stream de cámara
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: device.deviceId ? { exact: device.deviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            console.log('✅ Cámara iniciada');

            // Configurar Quagga
            this.isRunning = true;
            this.setupQuagga();

        } catch (error) {
            console.error('❌ Error iniciando escaneo:', error);
            this.isRunning = false;
            throw error;
        }
    },

    /**
     * Configura Quagga.js con el stream
     */
    setupQuagga() {
        try {
            Quagga.init({
                inputStream: {
                    type: 'LiveStream',
                    target: this.videoElement,
                    constraints: {
                        width: 1280,
                        height: 720,
                        facingMode: 'environment'
                    },
                    stream: this.currentStream
                },
                decoder: {
                    readers: [
                        'code_128_reader',
                        'ean_reader',
                        'ean_8_reader',
                        'code_39_reader',
                        'code_93_reader',
                        'upc_reader',
                        'codabar_reader',
                        'i2of5_reader',
                        'qr_code_reader'
                    ],
                    debug: {
                        showCanvas: false,
                        showPatternB: false,
                        showPatternA: false,
                        showLinesPos: false
                    }
                },
                locator: {
                    halfSample: true,
                    patchSize: 'medium',
                    debug: {
                        showCanvas: false,
                        showPatternB: false
                    }
                },
                numOfWorkers: 4,
                frequency: 10
            }, (err) => {
                if (err) {
                    console.error('❌ Error configurando Quagga:', err);
                    this.isRunning = false;
                    return;
                }

                console.log('✅ Quagga iniciado correctamente');
                
                // Event listeners
                Quagga.onDetected((result) => this.onQuaggaDetected(result));
                Quagga.onProcessed((result) => this.onQuaggaProcessed(result));

                // Iniciar
                Quagga.start();
                console.log('🟢 Quagga escaneo activo');

                // Dibujar overlay
                this.drawScanBox(false);
            });
        } catch (error) {
            console.error('Error setup Quagga:', error);
            this.isRunning = false;
        }
    },

    /**
     * Callback cuando Quagga detecta un código
     */
    onQuaggaDetected(result) {
        if (!result || !result.codeResult) return;

        const code = result.codeResult.code;
        const format = result.codeResult.format;

        console.log(`✅ Código detectado: ${code} (${format})`);
        this.handleDetection(code, format);
        this.drawScanBox(true, format);
    },

    /**
     * Callback cuando Quagga procesa un frame
     */
    onQuaggaProcessed(result) {
        this.frameCount++;
        this.lastFrameTime = result.processingTime || 0;

        if (!result.boxes) {
            this.drawScanBox(false);
        }
    },

    /**
     * Maneja la detección de un código
     */
    handleDetection(code, format) {
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
        console.log('📊 Formato:', format);

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

        // Callback
        if (this.onDetected) {
            this.onDetected(code, format);
        }
    },

    /**
     * Reproduce un beep de confirmación
     */
    playBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.debug('Beep no disponible');
        }
    },

    /**
     * Detiene el escaneo
     */
    stop() {
        try {
            console.log('⏹️ Deteniendo escaneo...');

            if (Quagga.initialized) {
                Quagga.stop();
            }

            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
                this.currentStream = null;
            }

            this.isRunning = false;
            this.lastDetectedCode = null;
            this.frameCount = 0;
            this.lastFrameTime = 0;

            // Limpiar overlay
            if (this.overlayCanvas) {
                const ctx = this.overlayCanvas.getContext('2d');
                ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            }

            console.log('✅ Escaneo detenido');
        } catch (error) {
            console.error('Error deteniendo escaneo:', error);
        }
    },

    /**
     * Cambia de cámara
     */
    async switchCamera() {
        this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.devices.length;
        console.log(`🔄 Cambiando a cámara ${this.currentDeviceIndex + 1}`);
        
        await this.stop();
        await this.start();
    },

    /**
     * Verifica si el scanner es soportado
     */
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    /**
     * Captura un frame del video
     */
    captureFrame() {
        if (!this.isRunning || !this.videoElement) {
            console.warn('Video no está disponible');
            return null;
        }

        try {
            // Obtener el video element de Quagga
            const videoElement = this.videoElement.querySelector('video');
            if (!videoElement) {
                console.warn('No se encontró el elemento video');
                return null;
            }

            // Crear canvas para captura
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth || 1280;
            canvas.height = videoElement.videoHeight || 720;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(videoElement, 0, 0);

            // Convertir a base64
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const captureInfo = {
                timestamp: Date.now(),
                width: canvas.width,
                height: canvas.height,
                imageData: imageData,
                canvas: canvas,
                base64: canvas.toDataURL('image/jpeg', 0.9)
            };

            // Guardar en historial
            this.capturedFrames.unshift(captureInfo);
            if (this.capturedFrames.length > this.maxStoredFrames) {
                this.capturedFrames.pop();
            }

            console.log(`📸 Frame capturado: ${canvas.width}x${canvas.height}`);
            return captureInfo;
        } catch (error) {
            console.error('Error capturando frame:', error);
            return null;
        }
    },

    /**
     * Analiza una captura manualmente
     */
    async analyzeCapture(captureInfo, showDebug = true) {
        if (!captureInfo) {
            console.error('No hay captura para analizar');
            return null;
        }

        try {
            console.log('🔍 Analizando captura con Quagga...');

            // Intentar decodificar usando Quagga DirectLine reader
            // Crear un ImageData procesado
            const strategies = [
                { name: 'Original', fn: (data) => data },
                { name: 'Contrast', fn: (data) => this.enhanceImage(this.copyImageData(data), 2.0) },
                { name: 'Binarización T130', fn: (data) => this.binarizeImage(this.copyImageData(data), 130) },
                { name: 'Invertir', fn: (data) => this.invertImage(this.copyImageData(data)) }
            ];

            console.log(`📊 Probando ${strategies.length} estrategias...`);

            for (let i = 0; i < strategies.length; i++) {
                const strategy = strategies[i];
                try {
                    let processed = strategy.fn(captureInfo.imageData);

                    // Crear canvas con datos procesados
                    const testCanvas = document.createElement('canvas');
                    testCanvas.width = captureInfo.width;
                    testCanvas.height = captureInfo.height;
                    const testCtx = testCanvas.getContext('2d');
                    testCtx.putImageData(processed, 0, 0);

                    // Intentar decodificar
                    const result = await this.decodeImage(testCanvas);
                    if (result && result.code) {
                        console.log(`✅ DETECTADO con ${strategy.name}: ${result.code}`);
                        this.handleDetection(result.code, result.format);
                        this.drawScanBox(true, `✅ ${strategy.name}`);
                        return {
                            code: result.code,
                            format: result.format,
                            strategy: strategy.name,
                            timestamp: captureInfo.timestamp
                        };
                    }
                    console.log(`⚠️ ${strategy.name}: sin resultado`);
                } catch (e) {
                    console.log(`❌ ${strategy.name}: error -`, e.message);
                }
            }

            console.log('❌ No se detectó con ninguna estrategia');
            if (showDebug) {
                this.drawScanBox(false, `Sin detección (${strategies.length} intentos)`);
            }
            return null;

        } catch (error) {
            console.error('Error analizando captura:', error);
            return null;
        }
    },

    /**
     * Decodifica una imagen usando Quagga
     */
    async decodeImage(canvas) {
        return new Promise((resolve) => {
            try {
                Quagga.decodeSingle({
                    src: canvas.toDataURL('image/jpeg'),
                    num_of_workers: 1,
                    worker: {
                        ImageSrcType: 'canvas',
                        patch: {
                            x: 0,
                            y: 0
                        }
                    }
                }, function (result) {
                    if (result && result.codeResult) {
                        resolve({
                            code: result.codeResult.code,
                            format: result.codeResult.format
                        });
                    } else {
                        resolve(null);
                    }
                });
            } catch (error) {
                console.debug('Decode error:', error.message);
                resolve(null);
            }
        });
    },

    /**
     * Dibuja el recuadro de escaneo en el overlay
     */
    drawScanBox(detected = false, info = '') {
        if (!this.overlayCanvas) return;

        // Actualizar tamaño del canvas
        const container = this.overlayCanvas.parentElement;
        this.overlayCanvas.width = container.offsetWidth;
        this.overlayCanvas.height = container.offsetHeight;

        const ctx = this.overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        // Dibujar recuadro central
        const boxWidth = this.overlayCanvas.width * 0.8;
        const boxHeight = this.overlayCanvas.height * 0.6;
        const x = (this.overlayCanvas.width - boxWidth) / 2;
        const y = (this.overlayCanvas.height - boxHeight) / 2;

        if (detected) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        } else {
            ctx.strokeStyle = '#00ccff';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(0, 204, 255, 0.05)';
        }

        ctx.fillRect(x, y, boxWidth, boxHeight);
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Esquinas
        const cornerSize = 20;
        ctx.lineWidth = 3;
        ctx.strokeStyle = detected ? '#00ff00' : '#00ccff';

        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerSize, y);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + boxWidth - cornerSize, y);
        ctx.lineTo(x + boxWidth, y);
        ctx.lineTo(x + boxWidth, y + cornerSize);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + boxHeight - cornerSize);
        ctx.lineTo(x, y + boxHeight);
        ctx.lineTo(x + cornerSize, y + boxHeight);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + boxWidth - cornerSize, y + boxHeight);
        ctx.lineTo(x + boxWidth, y + boxHeight);
        ctx.lineTo(x + boxWidth, y + boxHeight - cornerSize);
        ctx.stroke();

        // Debug info
        if (info) {
            ctx.fillStyle = detected ? '#00ff00' : '#ffaa00';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(info, 10, 30);
        }

        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Frames: ${this.frameCount} | Tiempo: ${this.lastFrameTime.toFixed(0)}ms`, 10, 50);
    },

    /**
     * Funciones de procesamiento de imagen
     */
    copyImageData(imageData) {
        const copy = new ImageData(imageData.width, imageData.height);
        copy.data.set(imageData.data);
        return copy;
    },

    enhanceImage(imageData, contrast = 1.5) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = r * 0.299 + g * 0.587 + b * 0.114;
            const enhanced = Math.max(0, Math.min(255, (gray - 128) * contrast + 128));
            data[i] = enhanced;
            data[i + 1] = enhanced;
            data[i + 2] = enhanced;
        }
        return imageData;
    },

    binarizeImage(imageData, threshold = 130) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = r * 0.299 + g * 0.587 + b * 0.114;
            const value = gray > threshold ? 255 : 0;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
        return imageData;
    },

    invertImage(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        return imageData;
    },

    /**
     * Procesa una imagen cargada
     */
    processImage(imageFile) {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Crear canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    // Intentar decodificar
                    Quagga.decodeSingle({
                        src: canvas.toDataURL('image/jpeg'),
                        num_of_workers: 1,
                        worker: {
                            ImageSrcType: 'canvas',
                            patch: {
                                x: 0,
                                y: 0
                            }
                        }
                    }, (result) => {
                        if (result && result.codeResult) {
                            console.log('✅ Código detectado en imagen:', result.codeResult.code);
                            resolve({
                                code: result.codeResult.code,
                                format: result.codeResult.format
                            });
                        } else {
                            console.log('No se detectó código en la imagen');
                            resolve(null);
                        }
                    });
                };
                img.src = e.target.result;
            };

            reader.readAsDataURL(imageFile);
        });
    }
};
