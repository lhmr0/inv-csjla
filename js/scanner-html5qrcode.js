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
    debounceTime: 800,
    devices: [],
    currentDeviceIndex: 0,
    videoElement: null,
    scanningInterval: null,
    currentStream: null,
    overlayCanvas: null,
    lastFrameTime: 0,
    frameCount: 0,
    lastError: '',

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
        const overlayElement = document.getElementById('scannerOverlay');
        if (!container) {
            throw new Error('No se encontró el elemento contenedor del scanner');
        }
        if (!overlayElement) {
            throw new Error('No se encontró el canvas overlay');
        }

        this.overlayCanvas = overlayElement;
        // NO almacenar overlayCtx aquí - se obtiene en drawScanBox() después de redimensionar

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

    lastFrameTime: 0,
    frameCount: 0,
    lastError: '',
    capturedFrames: [],
    maxStoredFrames: 5,

    /**
     * Captura el frame actual del video
     */
    captureFrame() {
        if (!this.videoElement || this.videoElement.readyState !== 4) {
            console.warn('Video no está listo');
            return null;
        }

        try {
            // Crear canvas para captura
            const canvas = document.createElement('canvas');
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(this.videoElement, 0, 0);

            // Convertir a blob/base64
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Guardar captura
            const captureInfo = {
                timestamp: Date.now(),
                width: canvas.width,
                height: canvas.height,
                imageData: imageData,
                canvas: canvas,
                base64: canvas.toDataURL('image/jpeg', 0.9)
            };

            // Guardar en historial (máximo 5 capturas)
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
     * Analiza una captura con todas las estrategias
     */
    analyzeCapture(captureInfo, showDebug = true) {
        if (!captureInfo) {
            console.error('No hay captura para analizar');
            return null;
        }

        try {
            console.log('🔍 Analizando captura...');
            const strategies = [
                { name: 'Original', fn: (data) => data },
                { name: 'Contrast Agr.', fn: (data) => this.enhanceImageAggressive(this.copyImageData(data)) },
                { name: 'Binarización', fn: (data) => this.binarizeImage(this.copyImageData(data)) },
                { name: 'Invertir', fn: (data) => this.invertImage(this.copyImageData(data)) },
                { name: 'EdgeDetect', fn: (data) => this.applyEdgeDetection(this.copyImageData(data)) },
                { name: 'Adaptativo', fn: (data) => this.adaptiveThreshold(this.copyImageData(data)) }
            ];

            for (let i = 0; i < strategies.length; i++) {
                const strategy = strategies[i];
                try {
                    let processed = strategy.fn(captureInfo.imageData);
                    const result = this.multiFormatReader.decodeWithState(processed);
                    if (result) {
                        const code = result.getText();
                        console.log(`✅ DETECTADO con ${strategy.name}: ${code}`);
                        this.handleDetection(code);
                        this.drawScanBox(true, `${strategy.name}`);
                        return {
                            code: code,
                            format: result.getBarcodeFormat(),
                            strategy: strategy.name,
                            timestamp: captureInfo.timestamp
                        };
                    }
                } catch (e) {
                    // Continuar
                }
            }

            console.log('❌ No se detectó con ninguna estrategia');
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
     * Escanea un frame del video - versión mejorada con captura
     */
    scanFrame() {
        if (!this.isRunning || !this.videoElement || this.videoElement.readyState !== 4) {
            return;
        }

        this.frameCount++;
        const frameStartTime = performance.now();

        try {
            // Capturar frame
            const capture = this.captureFrame();
            if (!capture) {
                this.drawScanBox(false, 'Error en captura');
                return;
            }

            // Analizar la captura
            const detected = this.analyzeCapture(capture, false);

            this.lastFrameTime = performance.now() - frameStartTime;

            // Dibujar overlay
            if (!detected) {
                this.drawScanBox(false);
            }

        } catch (error) {
            this.lastError = error.message;
            console.debug('Error en scanFrame:', error.message);
        }
    },

    /**
     * Extrae la región central (donde está el recuadro de escaneo)
     */
    extractCentralRegion(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const regionWidth = Math.floor(width * 0.8);
        const regionHeight = Math.floor(height * 0.4);
        const startX = Math.floor((width - regionWidth) / 2);
        const startY = Math.floor((height - regionHeight) / 2);

        const canvas = document.createElement('canvas');
        canvas.width = regionWidth;
        canvas.height = regionHeight;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        // Crear imageData para región
        const regionImageData = ctx.createImageData(regionWidth, regionHeight);
        const regionData = regionImageData.data;
        const sourceData = imageData.data;

        let regionIdx = 0;
        for (let y = 0; y < regionHeight; y++) {
            for (let x = 0; x < regionWidth; x++) {
                const sourceIdx = ((startY + y) * width + (startX + x)) * 4;
                regionData[regionIdx++] = sourceData[sourceIdx];     // R
                regionData[regionIdx++] = sourceData[sourceIdx + 1]; // G
                regionData[regionIdx++] = sourceData[sourceIdx + 2]; // B
                regionData[regionIdx++] = sourceData[sourceIdx + 3]; // A
            }
        }

        return regionImageData;
    },

    /**
     * Intenta todas las estrategias de detección en un imageData dado
     * DEPRECATED - Usar analyzeCapture() en su lugar
     */
    tryAllStrategies(imageData, regionType = 'DESCONOCIDA') {
        const strategies = [
            { name: 'Original', fn: (data) => data },
            { name: 'Contrast Agr.', fn: (data) => this.enhanceImageAggressive(this.copyImageData(data)) },
            { name: 'Binarización', fn: (data) => this.binarizeImage(this.copyImageData(data)) },
            { name: 'Invertir', fn: (data) => this.invertImage(this.copyImageData(data)) },
            { name: 'EdgeDetect', fn: (data) => this.applyEdgeDetection(this.copyImageData(data)) },
            { name: 'Adaptativo', fn: (data) => this.adaptiveThreshold(this.copyImageData(data)) }
        ];

        for (let i = 0; i < strategies.length; i++) {
            const strategy = strategies[i];
            try {
                let processed = strategy.fn(imageData);
                const result = this.multiFormatReader.decodeWithState(processed);
                if (result) {
                    console.log(`✅ DETECTADO en ${regionType} usando ${strategy.name}`);
                    this.handleDetection(result.getText());
                    this.drawScanBox(true, `${strategy.name} (${regionType})`);
                    return true;
                }
            } catch (e) {
                // Continuar con siguiente estrategia
            }
        }

        return false;
    },

    /**
     * Copia un ImageData
     */
    copyImageData(imageData) {
        return new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );
    },

    /**
     * Dibuja el recuadro de escaneo con información de debug
     */
    drawScanBox(detected = false, strategyUsed = '') {
        if (!this.overlayCanvas || !this.videoElement) {
            return;
        }

        try {
            const w = this.videoElement.videoWidth;
            const h = this.videoElement.videoHeight;

            if (w === 0 || h === 0) {
                return;
            }

            // Redimensionar canvas al tamaño exacto del video
            this.overlayCanvas.width = w;
            this.overlayCanvas.height = h;

            // Obtener contexto (puede cambiar después de redimensionar)
            const ctx = this.overlayCanvas.getContext('2d', { alpha: true });
            if (!ctx) {
                return;
            }

            const boxWidth = w * 0.8;
            const boxHeight = h * 0.4;
            const x = (w - boxWidth) / 2;
            const y = (h - boxHeight) / 2;

            // Limpiar canvas completamente
            ctx.clearRect(0, 0, w, h);

            // Fondo oscuro fuera del recuadro
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, w, h);

            // Área clara para escaneo (agujero en el fondo oscuro)
            ctx.clearRect(x, y, boxWidth, boxHeight);

            // Recuadro principal
            const color = detected ? '#10B981' : '#06B6D4';
            const lineWidth = detected ? 4 : 2;
            
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.shadowColor = color;
            ctx.shadowBlur = detected ? 15 : 5;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.strokeRect(x, y, boxWidth, boxHeight);

            // Esquinas decorativas
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            const cornerLen = 30;
            const corners = [
                { x: x, y: y }, // arriba-izq
                { x: x + boxWidth, y: y }, // arriba-der
                { x: x, y: y + boxHeight }, // abajo-izq
                { x: x + boxWidth, y: y + boxHeight } // abajo-der
            ];

            corners.forEach((corner, i) => {
                ctx.beginPath();
                if (i === 0) { // arriba-izq
                    ctx.moveTo(corner.x, corner.y + cornerLen);
                    ctx.lineTo(corner.x, corner.y);
                    ctx.lineTo(corner.x + cornerLen, corner.y);
                } else if (i === 1) { // arriba-der
                    ctx.moveTo(corner.x - cornerLen, corner.y);
                    ctx.lineTo(corner.x, corner.y);
                    ctx.lineTo(corner.x, corner.y + cornerLen);
                } else if (i === 2) { // abajo-izq
                    ctx.moveTo(corner.x, corner.y - cornerLen);
                    ctx.lineTo(corner.x, corner.y);
                    ctx.lineTo(corner.x + cornerLen, corner.y);
                } else { // abajo-der
                    ctx.moveTo(corner.x - cornerLen, corner.y);
                    ctx.lineTo(corner.x, corner.y);
                    ctx.lineTo(corner.x, corner.y - cornerLen);
                }
                ctx.stroke();
            });

            // Texto indicativo principal
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.font = 'bold 18px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            
            if (detected) {
                ctx.fillStyle = '#10B981';
                ctx.fillText('✅ CÓDIGO DETECTADO', x + 15, y - 15);
            } else {
                ctx.fillStyle = '#06B6D4';
                ctx.fillText('Coloca el código aquí', x + 15, y - 15);
            }

            // ====== INFORMACIÓN DE DEBUG ======
            const debugInfoY = y + boxHeight + 30;
            ctx.font = '12px monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            const debugLines = [
                `Frame: ${this.frameCount} | ${this.lastFrameTime.toFixed(1)}ms`,
                `Video: ${w}x${h} | Ready: ${this.videoElement.readyState === 4 ? 'YES' : 'NO'}`,
                `Región: ${detected ? strategyUsed : 'Escaneando...'}`,
                `Debounce: ${((Date.now() - this.lastDetectedTime) / this.debounceTime * 100).toFixed(0)}%`,
                `ZXing: ${typeof ZXing !== 'undefined' ? 'OK' : 'FAIL'}`
            ];

            // Fondo oscuro para debug info
            const lineHeight = 18;
            const debugHeight = (debugLines.length + 1) * lineHeight;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(x, debugInfoY - 5, boxWidth, debugHeight);

            // Dibujar líneas de debug
            debugLines.forEach((line, idx) => {
                ctx.fillStyle = '#0f0';
                ctx.font = '11px Courier New, monospace';
                ctx.fillText(line, x + 10, debugInfoY + (idx * lineHeight));
            });

            // Error info si existe
            if (this.lastError) {
                ctx.fillStyle = '#ff6666';
                ctx.font = 'bold 11px Courier New, monospace';
                ctx.fillText(`Error: ${this.lastError.substring(0, 40)}...`, x + 10, debugInfoY + (debugLines.length * lineHeight));
            }

        } catch (e) {
            console.error('Error dibujando scan box:', e);
        }
    },

    /**
     * Mejora la imagen de forma agresiva
     */
    enhanceImageAggressive(imageData) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const gray = (r + g + b) / 3;
            
            // Contraste muy agresivo + brillo negativo
            const contrast = 3.5;
            const brightness = -100;
            const enhanced = Math.max(0, Math.min(255, (gray - 128) * contrast + 128 + brightness));
            
            // Binarización
            const value = enhanced > 128 ? 255 : 0;
            
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
        
        return imageData;
    },

    /**
     * Binarización simple
     */
    binarizeImage(imageData) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const gray = (r * 0.299 + g * 0.587 + b * 0.114);
            const value = gray > 130 ? 255 : 0;
            
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
        
        return imageData;
    },

    /**
     * Invierte la imagen (blanco por negro)
     */
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
    },

    /**
     * Detección de bordes usando Sobel
     */
    applyEdgeDetection(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const output = new Uint8ClampedArray(data.length);

        // Kernel Sobel X
        const sobelX = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];

        // Kernel Sobel Y
        const sobelY = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        gx += gray * sobelX[ky + 1][kx + 1];
                        gy += gray * sobelY[ky + 1][kx + 1];
                    }
                }

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const idx = (y * width + x) * 4;
                const value = magnitude > 100 ? 255 : 0;

                output[idx] = value;
                output[idx + 1] = value;
                output[idx + 2] = value;
                output[idx + 3] = 255;
            }
        }

        return new ImageData(output, width, height);
    },

    /**
     * Umbral adaptativo (binarización local)
     */
    adaptiveThreshold(imageData) {
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const output = new Uint8ClampedArray(data.length);
        const blockSize = 25;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const gray = (r + g + b) / 3;

                // Calcular promedio local
                let sum = 0;
                let count = 0;
                const half = Math.floor(blockSize / 2);

                for (let dy = -half; dy <= half; dy++) {
                    for (let dx = -half; dx <= half; dx++) {
                        const ny = Math.min(Math.max(y + dy, 0), height - 1);
                        const nx = Math.min(Math.max(x + dx, 0), width - 1);
                        const nidx = (ny * width + nx) * 4;
                        sum += (data[nidx] + data[nidx + 1] + data[nidx + 2]) / 3;
                        count++;
                    }
                }

                const avg = sum / count;
                const value = gray > avg ? 255 : 0;

                output[idx] = value;
                output[idx + 1] = value;
                output[idx + 2] = value;
                output[idx + 3] = 255;
            }
        }

        return new ImageData(output, width, height);
    }
};
