// app/cameras/page.tsx
'use client';

import { useState, useEffect } from 'react';
import CameraView from '@/components/Camera';


interface Camera {
  id: string;
  name: string;
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cameras from the API on mount
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await fetch('/api/cameras', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Unauthorized. Please log in.');
            window.location.href = '/login'; // Redirect to login
            return;
          }
          throw new Error('Failed to fetch cameras');
        }

        const data: Camera[] = await response.json();
        setCameras(data);
      } catch (err) {
        setError('An error occurred while fetching cameras.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCameras();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Your Cameras</h1>
      {cameras.length === 0 ? (
        <p>You have no cameras added yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {cameras.map((camera) => (
            <li
              key={camera.id}
              style={{
                margin: '10px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span>{camera.name}</span>
              <button
                onClick={() => setSelectedCameraId(camera.name)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                View Stream
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedCameraId && (
        <CameraView
          cameraId={selectedCameraId}
          onClose={() => setSelectedCameraId(null)}
        />
      )}
    </div>
  );
}