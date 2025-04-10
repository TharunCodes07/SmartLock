# client.py
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

    ssl_context = ssl._create_unverified_context()
    try:
        async with websockets.connect(uri, ssl=ssl_context) as websocket:
            print("[Client] Connected to server")
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("[Client] Error: Failed to capture frame.")
                    break
                _, buffer = cv2.imencode('.jpg', frame)
                img_b64 = base64.b64encode(buffer).decode('utf-8')
                await websocket.send(img_b64)
                await asyncio.sleep(0.1)
    except Exception as e:
        print(f"[Client] Error: {e}")
    finally:
        cap.release()

# Use your ngrok WSS URL here:
uri = "wss://e3a4-171-79-49-166.ngrok-free.app"  # Replace this

asyncio.run(send_video(uri))