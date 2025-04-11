'use client';

import { useEffect, useState } from 'react';

interface CameraViewProps {
  cameraId: string;
  onClose: () => void;
}

export default function CameraView({ cameraId, onClose }: CameraViewProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    // Connect to the server's viewer endpoint for this camera
    const websocket = new WebSocket(`wss://9aa5-2401-4900-4df9-ef18-a461-a1f3-1f3b-c908.ngrok-free.app/view/${cameraId}`);

    websocket.onmessage = (event) => {
      const jpgAsText = event.data;
      setImageSrc(`data:image/jpeg;base64,${jpgAsText}`);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed');
      setImageSrc(null); // Optional: Clear image when connection closes
    };

    // Cleanup on unmount
    return () => {
      websocket.close();
    };
  }, [cameraId]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{ position: 'relative' }}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Camera Stream"
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          />
        ) : (
          <p style={{ color: 'white' }}>Loading stream...</p>
        )}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '5px 10px',
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}