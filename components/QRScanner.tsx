'use client';
import { useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner'; // Ensure you have the right path to qr-scanner.min.js

interface QRScannerProps {
  onScan: (result: string, timestamp: string) => void; // Callback function to send results
}

const QRScanner = ({ onScan }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    const initScanner = async () => {
      if (!videoRef.current) return;
      
      try {
        if (scannerRef.current) {
          scannerRef.current.stop();
        }

        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            if (result?.data) {
              const timestamp = new Date().toString();
              onScan(result.data, timestamp); // Send result and timestamp to the parent
              scannerRef.current?.stop(); // Stop the scanner once a QR code is detected
            }
          },
          {
            onDecodeError: (error) => {
              console.warn('Decode Error:', error); // Log the error but do not trigger onScan
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        await scannerRef.current.start().then(() => {
          // Optionally, list cameras or select a default camera
          QrScanner.listCameras(true).then((cameras) => {
            const rearCamera = cameras.find((camera) =>
              camera.id.includes('environment')
            )?.id;
            if (rearCamera) {
              scannerRef.current?.setCamera(rearCamera); // Use rear camera by default
            }
          });
        });
      } catch (error) {
        console.error('Error starting QR scanner:', error);
      }
    };

    initScanner();
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
    };
  }, [onScan]);

  return (
    <div className="text-foreground">
      <div id="video-container" className="example-style-2">
        <video ref={videoRef} id="qr-video" />
      </div>
    </div>
  );
};

export default QRScanner;
