# lock_device.py
import cv2
import websockets
import asyncio
import base64

async def send_video(camera_id, uri):
    """Capture video from the camera and send it to the main server."""
    cap = cv2.VideoCapture(0)  # Open default camera (index 0)
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    try:
        async with websockets.connect(f"{uri}/publish/{camera_id}") as websocket:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("Error: Failed to capture frame.")
                    break
                # Encode frame as JPEG
                _, buffer = cv2.imencode('.jpg', frame)
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                # Send the frame to the server
                await websocket.send(jpg_as_text)
                await asyncio.sleep(0.1)  # Control frame rate (10 FPS)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cap.release()

# Configuration
camera_id = "lock1"  # Unique ID for this lock device
uri = "ws://192.168.222.222:8765"  # Main server address

# Run the video sender
asyncio.run(send_video(camera_id, uri))