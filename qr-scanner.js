class QRScanner {
    constructor(videoElement, statusCallback) {
        this.video = videoElement;
        this.updateStatus = statusCallback;
        this.isScanning = false;
        this.scanInterval = null;
        this.lastQRTime = 0;
    }
    
    start() {
        if (this.isScanning) return;
        
        this.isScanning = true;
        document.getElementById('qr-frame').style.display = 'block';
        this.updateStatus('🔍 Scanning for device QR codes...');
        
        this.scanInterval = setInterval(() => {
            this.scanFrame();
        }, 300);
    }
    
    stop() {
        this.isScanning = false;
        document.getElementById('qr-frame').style.display = 'none';
        
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
    }
    
    scanFrame() {
        if (!this.isScanning || this.video.readyState !== this.video.HAVE_ENOUGH_DATA) {
            return;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        
        ctx.drawImage(this.video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
        });
        
        if (qrCode) {
            this.handleQRDetection(qrCode.data);
        }
    }
    
    handleQRDetection(qrData) {
        const now = Date.now();
        if (now - this.lastQRTime < 2000) return;
        
        this.lastQRTime = now;
        
        // Check if it's a device QR (your QR code or similar patterns)
        if (this.isDeviceQR(qrData)) {
            this.updateStatus('✅ Device detected - Starting diagnostics...');
            this.stop();
            window.startDiagnosis(qrData);
        } else {
            this.updateStatus('⚠️ Unknown QR code detected');
            setTimeout(() => {
                if (this.isScanning) {
                    this.updateStatus('🔍 Looking for device QR codes...');
                }
            }, 2000);
        }
    }
    
    isDeviceQR(qrData) {
        // Generic device patterns - customize based on your QR format
        const devicePatterns = [
            /^DEVICE_/,
            /^DEV-/,
            /^[A-Z]{3,}-\d{3,}$/,
            'KETTLE_001',  // Your specific test QR
            'PRINTER_001',
            'ROUTER_001'
        ];
        
        return devicePatterns.some(pattern => {
            if (pattern instanceof RegExp) {
                return pattern.test(qrData);
            }
            return qrData.includes(pattern);
        });
    }
}
