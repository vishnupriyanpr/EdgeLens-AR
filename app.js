class EdgeLensDeviceDiagnoser {
    constructor() {
        this.video = document.getElementById('camera');
        this.canvas = document.getElementById('overlay');
        this.ctx = this.canvas.getContext('2d');
        this.qrStatus = document.getElementById('qr-status');
        this.diagnosisPanel = document.getElementById('diagnosis-panel');
        this.scanIndicator = document.getElementById('scan-indicator');
        
        // Known device QR codes (expand this for different devices)
        this.knownDevices = {
            'KETTLE_QR_001': {
                name: 'Electric Kettle',
                icon: '🫖',
                issues: [
                    "Won't turn on - Power supply issue detected",
                    "Takes too long to boil - Heating element degradation",
                    "Leaking from body - Seal integrity compromised", 
                    "Auto-shutoff not working - Thermostat malfunction"
                ]
            },
            'PRINTER_QR_001': {
                name: 'Laser Printer',
                icon: '🖨️',
                issues: [
                    "Paper jam detected in feed tray",
                    "Toner cartridge running low",
                    "Network connectivity issues",
                    "Print quality degradation - Drum unit aging"
                ]
            }
        };
        
        this.currentDevice = null;
        this.currentIssue = null;
        this.isScanning = true;
        this.scanInterval = null;
        this.lastQRTime = 0;
        
        this.init();
    }

    async init() {
        try {
            await this.setupCamera();
            this.startQRScanning();
            this.updateStatus('🔍 Ready to scan device QR codes', 'scanning');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.updateStatus('❌ Camera access failed', 'error');
        }
    }

    async setupCamera() {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = stream;
            
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    resolve();
                };
            });
        } catch (error) {
            // Fallback to any available camera
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.video.srcObject = stream;
        }
    }

    startQRScanning() {
        this.scanIndicator.style.display = 'block';
        this.scanInterval = setInterval(() => {
            if (this.isScanning) {
                this.scanForQR();
            }
        }, 300); // Scan every 300ms for better mobile performance
    }

    scanForQR() {
        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            // Create temporary canvas for QR scanning
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCanvas.width = this.video.videoWidth;
            tempCanvas.height = this.video.videoHeight;
            
            tempCtx.drawImage(this.video, 0, 0);
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            
            if (qrCode) {
                this.handleQRDetection(qrCode);
            }
        }
    }

    handleQRDetection(qrCode) {
        const now = Date.now();
        if (now - this.lastQRTime < 2000) return; // Debounce QR detection
        
        this.lastQRTime = now;
        const qrData = qrCode.data;
        
        if (this.knownDevices[qrData]) {
            this.currentDevice = this.knownDevices[qrData];
            this.updateStatus(`✅ ${this.currentDevice.name} detected`, 'success');
            this.stopScanning();
            this.startDeviceDiagnosis();
        } else {
            this.updateStatus(`⚠️ Unknown device QR: ${qrData}`, 'unknown');
            setTimeout(() => {
                this.updateStatus('🔍 Looking for known device QR codes...', 'scanning');
            }, 2000);
        }
    }

    stopScanning() {
        this.isScanning = false;
        this.scanIndicator.style.display = 'none';
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
    }

    startDeviceDiagnosis() {
        // Simulate issue detection with fake sensor readings
        this.currentIssue = this.currentDevice.issues[Math.floor(Math.random() * this.currentDevice.issues.length)];
        
        // Generate realistic sensor data based on the issue
        const sensorData = this.generateSensorData(this.currentIssue);
        
        // Show diagnosis panel with animation
        setTimeout(() => {
            this.showDiagnosisPanel(sensorData);
        }, 500);
    }

    generateSensorData(issue) {
        const baseData = {
            timestamp: new Date().toLocaleTimeString(),
            deviceId: this.currentDevice.name
        };

        if (issue.includes("won't turn on")) {
            return {
                ...baseData,
                voltage: "0.0V",
                current: "0.0A", 
                temperature: "22°C",
                status: "NO_POWER"
            };
        } else if (issue.includes("heating") || issue.includes("boil")) {
            return {
                ...baseData,
                voltage: "220V",
                current: "8.2A",
                temperature: "45°C",
                heatingRate: "0.8°C/min",
                status: "HEATING_SLOW"
            };
        } else if (issue.includes("leak")) {
            return {
                ...baseData,
                voltage: "220V", 
                current: "10.1A",
                temperature: "95°C",
                moistureLevel: "HIGH",
                status: "SEAL_BREACH"
            };
        } else if (issue.includes("auto-shutoff")) {
            return {
                ...baseData,
                voltage: "220V",
                current: "10.5A", 
                temperature: "105°C",
                thermostat: "FAULT",
                status: "OVERHEAT_RISK"
            };
        }
        
        return baseData;
    }

    showDiagnosisPanel(sensorData) {
        // Update device info
        document.getElementById('device-name').textContent = this.currentDevice.name;
        document.querySelector('.device-icon').textContent = this.currentDevice.icon;
        
        // Show issue
        document.getElementById('issue-info').innerHTML = `
            <strong>⚠️ Issue Detected:</strong><br>
            ${this.currentIssue}
        `;
        
        // Show sensor readings
        const sensorHtml = Object.entries(sensorData)
            .map(([key, value]) => {
                const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return `<div class="sensor-reading"><span>${displayKey}:</span><span>${value}</span></div>`;
            }).join('');
        
        document.getElementById('sensor-info').innerHTML = `
            <strong>📊 Live Sensor Readings:</strong>
            ${sensorHtml}
        `;
        
        // Generate AI suggestion
        this.generateAISuggestion(sensorData);
        
        // Show panel with animation
        this.diagnosisPanel.classList.add('show');
    }

    generateAISuggestion(sensorData) {
        let suggestion = "";
        
        if (sensorData.status === "NO_POWER") {
            suggestion = "🔌 **Power Supply Issue Detected**\n\n• Check power cord connection\n• Verify outlet is working\n• Test with different power source\n• Inspect cord for damage";
        } else if (sensorData.status === "HEATING_SLOW") {
            suggestion = "🔥 **Heating Performance Degraded**\n\n• Scale buildup detected on heating element\n• Recommended: Descaling procedure\n• Water quality may be affecting performance\n• Consider professional maintenance";
        } else if (sensorData.status === "SEAL_BREACH") {
            suggestion = "💧 **Seal Integrity Compromised**\n\n• Internal gasket replacement needed\n• Avoid using until repaired\n• Check warranty status\n• Contact service center immediately";
        } else if (sensorData.status === "OVERHEAT_RISK") {
            suggestion = "🌡️ **Critical: Thermostat Malfunction**\n\n• **STOP USING IMMEDIATELY**\n• Unplug device for safety\n• Thermostat replacement required\n• Professional repair mandatory";
        }
        
        const formattedSuggestion = suggestion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                            .replace(/\n/g, '<br>')
                                            .replace(/•/g, '▸');
        
        document.getElementById('ai-response').innerHTML = `
            <strong>🤖 AI Analysis & Recommendations:</strong><br><br>
            ${formattedSuggestion}
        `;
    }

    updateStatus(message, type) {
        this.qrStatus.textContent = message;
        this.qrStatus.className = `ui-overlay ${type === 'scanning' ? 'pulse' : ''}`;
        
        if (type === 'unknown') {
            this.qrStatus.classList.add('unknown-device');
        } else {
            this.qrStatus.classList.remove('unknown-device');
        }
    }

    restart() {
        // Reset everything and start over
        this.diagnosisPanel.classList.remove('show');
        this.currentDevice = null;
        this.currentIssue = null;
        this.isScanning = true;
        this.startQRScanning();
        this.updateStatus('🔍 Ready to scan device QR codes', 'scanning');
    }
}

// Global functions for button interactions
function handleUserResponse(confirmed) {
    if (confirmed) {
        document.getElementById('ai-response').innerHTML += `
            <br><br><div style="background: rgba(52, 199, 89, 0.2); padding: 10px; border-radius: 8px; margin-top: 10px;">
                ✅ <strong>Diagnosis Confirmed</strong><br>
                Proceeding with recommended maintenance protocol...
            </div>
        `;
        
        // Auto-restart after 3 seconds
        setTimeout(() => {
            edgeLensApp.restart();
        }, 3000);
        
    } else {
        document.getElementById('ai-response').innerHTML = `
            <strong>🤖 Re-analyzing Device State...</strong><br><br>
            Running additional diagnostic tests...<br>
            Please wait while I gather more sensor data.
        `;
        
        // Simulate re-analysis with different issue
        setTimeout(() => {
            edgeLensApp.currentIssue = edgeLensApp.currentDevice.issues[Math.floor(Math.random() * edgeLensApp.currentDevice.issues.length)];
            const newSensorData = edgeLensApp.generateSensorData(edgeLensApp.currentIssue);
            
            document.getElementById('issue-info').innerHTML = `
                <strong>🔄 Updated Analysis:</strong><br>
                ${edgeLensApp.currentIssue}
            `;
            
            edgeLensApp.generateAISuggestion(newSensorData);
        }, 2000);
    }
}

// Initialize the application
let edgeLensApp;
window.addEventListener('load', () => {
    edgeLensApp = new EdgeLensDeviceDiagnoser();
});

// Handle page visibility changes for mobile optimization
document.addEventListener('visibilitychange', () => {
    if (document.hidden && edgeLensApp) {
        edgeLensApp.stopScanning();
    } else if (!document.hidden && edgeLensApp && edgeLensApp.isScanning) {
        edgeLensApp.startQRScanning();
    }
});
