import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Camera, Upload, X, CheckCircle } from 'lucide-react';

function QRScanner({ onScanSuccess, onClose }) {
  const [scanResult, setScanResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner when component unmounts
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanning = () => {
    setIsScanning(true);
    setScanResult('');

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true
    };

    const scanner = new Html5QrcodeScanner("qr-reader", config, false);
    html5QrcodeScannerRef.current = scanner;

    scanner.render(
      // Success callback
      (decodedText, decodedResult) => {
        console.log('QR Code scanned successfully:', decodedText);
        setScanResult(decodedText);
        setIsScanning(false);
        
        // Try to parse and validate the scanned data
        try {
          const parsedData = JSON.parse(decodedText);
          if (parsedData.type === 'bus-pass') {
            onScanSuccess(parsedData);
          } else {
            alert('This QR code does not contain valid bus pass data.');
          }
        } catch (err) {
          // If it's not JSON, treat as regular text
          alert(`Scanned: ${decodedText}\n\nThis doesn't appear to be a bus pass QR code.`);
        }
        
        scanner.clear();
      },
      // Error callback
      (error) => {
        // Ignore frequent "No QR code found" errors during scanning
        if (!error.includes('No QR code found')) {
          console.warn('QR scan error:', error);
        }
      }
    );
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(console.error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const html5QrCode = new Html5QrcodeScanner("temp", {}, false);
    
    html5QrCode.scanFile(file, true)
      .then(decodedText => {
        console.log('QR Code from file:', decodedText);
        setScanResult(decodedText);
        
        try {
          const parsedData = JSON.parse(decodedText);
          if (parsedData.type === 'bus-pass') {
            onScanSuccess(parsedData);
          } else {
            alert('This QR code does not contain valid bus pass data.');
          }
        } catch (err) {
          alert(`Scanned from file: ${decodedText}\n\nThis doesn't appear to be a bus pass QR code.`);
        }
      })
      .catch(err => {
        console.error('File scan failed:', err);
        alert('Unable to scan QR code from this image. Please try a clearer image.');
      });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        style={{
          background: 'white',
          borderRadius: 16,
          padding: 20,
          maxWidth: 500,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h3 style={{ margin: 0 }}>📱 Scan QR Code</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scanner Controls */}
        {!isScanning && !scanResult && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ color: '#6b7280', marginBottom: 20 }}>
              Choose how you want to scan the QR code:
            </p>
            
            <div style={{ display: 'grid', gap: 12 }}>
              <button
                onClick={startScanning}
                className="btn-chip btn-approve"
                style={{ 
                  width: '100%',
                  justifyContent: 'center',
                  padding: 16,
                  fontSize: 16
                }}
              >
                <Camera size={20} />
                Use Camera to Scan
              </button>
              
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                />
                <button
                  className="btn-chip"
                  style={{ 
                    width: '100%',
                    justifyContent: 'center',
                    padding: 16,
                    fontSize: 16,
                    background: '#f8fafc',
                    border: '2px dashed #cbd5e1'
                  }}
                >
                  <Upload size={20} />
                  Upload QR Code Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Display */}
        {isScanning && (
          <div>
            <div 
              id="qr-reader" 
              ref={scannerRef}
              style={{ 
                width: '100%',
                marginBottom: 20
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={stopScanning}
                className="btn-chip btn-reject"
              >
                Stop Scanning
              </button>
            </div>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div style={{ 
            textAlign: 'center',
            padding: 20,
            background: '#f0fdf4',
            borderRadius: 12,
            border: '1px solid #bbf7d0'
          }}>
            <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 15px' }} />
            <h4 style={{ color: '#166534', margin: '0 0 10px' }}>QR Code Scanned!</h4>
            <p style={{ color: '#15803d', fontSize: 14 }}>
              Processing the scanned data...
            </p>
          </div>
        )}

        {/* Instructions */}
        {!isScanning && !scanResult && (
          <div style={{
            background: '#f8fafc',
            padding: 15,
            borderRadius: 8,
            fontSize: 14,
            color: '#475569'
          }}>
            <strong>Tips for better scanning:</strong>
            <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
              <li>Ensure good lighting</li>
              <li>Hold your device steady</li>
              <li>Keep the QR code centered in the frame</li>
              <li>Make sure the QR code is not blurry or damaged</li>
            </ul>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default QRScanner;