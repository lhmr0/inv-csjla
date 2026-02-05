/**
 * Módulo de escaneo de códigos de barras usando OCR
 * Utiliza Tesseract.js para leer números de la imagen
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
    codeReader: true, // Dummy para compatibilidad
    tesseractWorker: null,
    ocrEnabled: false,

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
     */
    async init(callback) {
        this.onDetected = callback;

        // Esperar a que Tesseract esté disponible
        if (typeof Tesseract === 'undefined') {
            throw new Error('La librería Tesseract.js no se ha cargado. Intenta recargar la página.');
        }

        console.log('✅ Tesseract.js disponible');

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

        // Inicializar Tesseract
        await this.initTesseract();

        return true;
    },

    /**
     * Inicializa Tesseract worker
     */
    async initTesseract() {
        try {
            console.log('🔧 Inicializando Tesseract.js para OCR...');
            
            // Esperar a que Tesseract esté completamente cargado
            const { createWorker } = Tesseract;
            this.tesseractWorker = await createWorker('eng');
            
            console.log('✅ Tesseract.js iniciado correctamente');
            this.ocrEnabled = true;
        } catch (error) {
            console.error('❌ Error inicializando Tesseract:', error);
            this.ocrEnabled = false;
            throw error;
        }
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
            console.log('▶️ Iniciando escaneo OCR...');

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

            // Insertar video en el DOM
            let videoElement = this.videoElement.querySelector('video');
            if (!videoElement) {
                videoElement = document.createElement('video');
                videoElement.setAttribute('playsinline', 'true');
                videoElement.setAttribute('autoplay', 'true');
                videoElement.setAttribute('muted', 'true');
                this.videoElement.appendChild(videoElement);
            }

            videoElement.srcObject = this.currentStream;
            
            // Esperar a que el video esté listo
            await new Promise(resolve => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve();
                };
            });

            this.isRunning = true;
            this.frameCount = 0;
            this.lastDetectedCode = null;

            console.log('🟢 Iniciando análisis OCR en tiempo real...');

            // Iniciar loop de análisis
            this.startOCRAnalysis();
            this.drawScanBox(false);

        } catch (error) {
            console.error('❌ Error iniciando escaneo:', error);
            this.isRunning = false;
            throw error;
        }
    },

    /**
     * Inicia el análisis OCR en tiempo real
     */
    startOCRAnalysis() {
        if (!this.isRunning) return;

        // Analizar cada 500ms (2 FPS) para no sobrecargar
        setInterval(() => {
            if (this.isRunning) {
                this.analyzeCurrentFrame();
            }
        }, 500);
    },

    /**
     * Analiza el frame actual del video
     */
    async analyzeCurrentFrame() {
        if (!this.isRunning || !this.ocrEnabled) return;

        try {
            const videoElement = this.videoElement.querySelector('video');
            if (!videoElement || videoElement.readyState !== 4) {
                return;
            }

            this.frameCount++;
            const startTime = performance.now();

            // Crear canvas
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0);

            // Procesar imagen: aumentar contraste
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            this.enhanceImageForOCR(imageData);
            ctx.putImageData(imageData, 0, 0);

            // OCR
            const result = await this.tesseractWorker.recognize(canvas);
            this.lastFrameTime = performance.now() - startTime;

            if (result && result.data && result.data.text) {
                const text = result.data.text.trim();
                const numbers = text.replace(/\D/g, ''); // Extraer solo números

                if (numbers.length >= 10) { // Code 128 típicamente tiene más de 10 dígitos
                    console.log(`📊 OCR encontró: "${text}" → Números: "${numbers}"`);
                    
                    if (this.validateAndDetect(numbers)) {
                        this.drawScanBox(true, 'OCR');
                    }
                } else {
                    this.drawScanBox(false);
                }
            } else {
                this.drawScanBox(false);
            }

        } catch (error) {
            console.debug('Error en OCR:', error.message);
            this.drawScanBox(false);
        }
    },

    /**
     * Valida y reporta código detectado
     */
    validateAndDetect(code) {
        if (!code || code.length < 10) return false;

        const now = Date.now();

        // Debounce
        if (code === this.lastDetectedCode && (now - this.lastDetectedTime) < this.debounceTime) {
            return false;
        }

        this.lastDetectedCode = code;
        this.lastDetectedTime = now;

        console.log('✅ ✅ ✅ ¡CÓDIGO DETECTADO! ✅ ✅ ✅', code);

        // Vibrar
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
            this.onDetected(code, 'CODE_128');
        }

        return true;
    },

    /**
     * Mejora imagen para OCR
     */
    enhanceImageForOCR(imageData) {
        const data = imageData.data;
        
        // Convertir a escala de grises y aumentar contraste
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Luminancia
            const gray = r * 0.299 + g * 0.587 + b * 0.114;
            
            // Contraste agresivo (simular binarización)
            const contrast = 2.5;
            const enhanced = Math.max(0, Math.min(255, (gray - 128) * contrast + 128));
            
            data[i] = enhanced;
            data[i + 1] = enhanced;
            data[i + 2] = enhanced;
        }
    },

    /**
     * Reproduce un beep
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

            this.isRunning = false;

            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
                this.currentStream = null;
            }

            this.lastDetectedCode = null;
            this.frameCount = 0;

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
     * Verifica soporte
     */
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    /**
     * Captura un frame
     */
    captureFrame() {
        if (!this.isRunning) {
            console.warn('Video no está disponible');
            return null;
        }

        try {
            const videoElement = this.videoElement.querySelector('video');
            if (!videoElement) {
                console.warn('No se encontró el elemento video');
                return null;
            }

            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth || 1280;
            canvas.height = videoElement.videoHeight || 720;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const captureInfo = {
                timestamp: Date.now(),
                width: canvas.width,
                height: canvas.height,
                imageData: imageData,
                canvas: canvas,
                base64: canvas.toDataURL('image/jpeg', 0.9)
            };

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
     * Analiza una captura manualmente con OCR
     */
    async analyzeCapture(captureInfo, showDebug = true) {
        if (!captureInfo || !this.ocrEnabled) {
            console.error('No se puede analizar captura');
            return null;
        }

        try {
            console.log('🔍 Analizando captura con OCR...');

            // Mejorar imagen
            const enhanced = this.copyImageData(captureInfo.imageData);
            this.enhanceImageForOCR(enhanced);

            // Crear canvas con imagen mejorada
            const canvas = document.createElement('canvas');
            canvas.width = captureInfo.width;
            canvas.height = captureInfo.height;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(enhanced, 0, 0);

            // OCR
            const result = await this.tesseractWorker.recognize(canvas);

            if (result && result.data && result.data.text) {
                const text = result.data.text.trim();
                const numbers = text.replace(/\D/g, '');

                console.log(`📊 OCR: Texto = "${text}" | Números = "${numbers}"`);

                if (numbers.length >= 10) {
                    console.log(`✅ Código detectado: ${numbers}`);
                    this.handleDetection(numbers);
                    this.drawScanBox(true, '✅ OCR');
                    
                    return {
                        code: numbers,
                        format: 'CODE_128_OCR',
                        strategy: 'Tesseract OCR',
                        timestamp: captureInfo.timestamp
                    };
                }
            }

            console.log('❌ No se encontraron números en la imagen');
            if (showDebug) {
                this.drawScanBox(false, 'Sin detección');
            }
            return null;

        } catch (error) {
            console.error('Error analizando captura:', error);
            return null;
        }
    },

    /**
     * Maneja la detección
     */
    handleDetection(code) {
        if (!code || code.trim() === '') return;

        const now = Date.now();
        if (code === this.lastDetectedCode && (now - this.lastDetectedTime) < this.debounceTime) {
            return;
        }

        this.lastDetectedCode = code;
        this.lastDetectedTime = now;

        console.log('✅ CÓDIGO DETECTADO:', code);
        this.playBeep();

        if (this.onDetected) {
            this.onDetected(code, 'CODE_128');
        }
    },

    /**
     * Procesa una imagen cargada
     */
    async processImage(imageFile) {
        return new Promise((resolve) => {
            if (!this.ocrEnabled) {
                resolve(null);
                return;
            }

            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const img = new Image();
                    img.onload = async () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);

                        // Mejorar imagen
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        this.enhanceImageForOCR(imageData);
                        ctx.putImageData(imageData, 0, 0);

                        // OCR
                        const result = await this.tesseractWorker.recognize(canvas);

                        if (result && result.data && result.data.text) {
                            const text = result.data.text.trim();
                            const numbers = text.replace(/\D/g, '');

                            if (numbers.length >= 10) {
                                console.log('✅ Código detectado en imagen:', numbers);
                                resolve({
                                    code: numbers,
                                    format: 'CODE_128_OCR'
                                });
                            } else {
                                resolve(null);
                            }
                        } else {
                            resolve(null);
                        }
                    };
                    img.src = e.target.result;
                } catch (error) {
                    console.error('Error procesando imagen:', error);
                    resolve(null);
                }
            };

            reader.readAsDataURL(imageFile);
        });
    },

    /**
     * Dibuja overlay
     */
    drawScanBox(detected = false, info = '') {
        if (!this.overlayCanvas) return;

        const container = this.overlayCanvas.parentElement;
        this.overlayCanvas.width = container.offsetWidth;
        this.overlayCanvas.height = container.offsetHeight;

        const ctx = this.overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

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

        ctx.beginPath();
        ctx.moveTo(x, y + cornerSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerSize, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + boxWidth - cornerSize, y);
        ctx.lineTo(x + boxWidth, y);
        ctx.lineTo(x + boxWidth, y + cornerSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y + boxHeight - cornerSize);
        ctx.lineTo(x, y + boxHeight);
        ctx.lineTo(x + cornerSize, y + boxHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + boxWidth - cornerSize, y + boxHeight);
        ctx.lineTo(x + boxWidth, y + boxHeight);
        ctx.lineTo(x + boxWidth, y + boxHeight - cornerSize);
        ctx.stroke();

        // Info
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
     * Funciones de utilidad
     */
    copyImageData(imageData) {
        const copy = new ImageData(imageData.width, imageData.height);
        copy.data.set(imageData.data);
        return copy;
    }
};

console.log('🎯 Scanner OCR cargado');
