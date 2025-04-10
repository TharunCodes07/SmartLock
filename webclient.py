import cv2
import websockets
import asyncio
import base64
import ssl

async def send_video(uri):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[Client] Error: Could not open camera.")
        return

    try:
        # Use SSL context for wss
        ssl_context = ssl._create_unverified_context()
        async with websockets.connect(uri, ssl=ssl_context) as websocket:
            print("[Client] Connected to server")
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("[Client] Error: Failed to capture frame.")
                    break
                _, buffer = cv2.imencode('.jpg', frame)
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                await websocket.send(jpg_as_text)
                await asyncio.sleep(0.1)  # Control frame rate
    except Exception as e:
        print(f"[Client] Error: {e}")
    finally:
        cap.release()

# Define a unique camera ID
cameraId = "1"  # Change this for different cameras
import cv2
import websockets
import asyncio
import base64
import ssl

async def send_video(uri):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[Client] Error: Could not open camera.")
        return

    try:
        # Use SSL context for wss
        ssl_context = ssl._create_unverified_context()
        async with websockets.connect(uri, ssl=ssl_context) as websocket:
            print("[Client] Connected to server")
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("[Client] Error: Failed to capture frame.")
                    break
                _, buffer = cv2.imencode('.jpg', frame)
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                await websocket.send(jpg_as_text)
                await asyncio.sleep(0.1)  # Control frame rate
    except Exception as e:
        print(f"[Client] Error: {e}")
    finally:
        cap.release()

# Define a unique camera ID
cameraId = "1"  # Change this for different cameras
uri = f"wss://ef7a-2401-4900-6337-aaef-e90f-bb90-6966-59b6.ngrok-free.app/camera/{cameraId}"
asyncio.run(send_video(uri))