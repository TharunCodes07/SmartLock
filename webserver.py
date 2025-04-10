import asyncio
import websockets

PORT = 8765

# Store camera and viewer connections
camera_websockets = {}  # {camera_id: websocket}
viewer_websockets = {}  # {camera_id: set of viewer websockets}

async def handle_camera(websocket, camera_id):
    """Handle a camera client sending video frames."""
    if camera_id in camera_websockets:
        # Close existing camera connection if any
        await camera_websockets[camera_id].close()
    camera_websockets[camera_id] = websocket
    print(f"[Server] Camera {camera_id} connected")
    try:
        async for message in websocket:
            # Forward the base64-encoded frame to all viewers for this camera
            if camera_id in viewer_websockets:
                for viewer in viewer_websockets[camera_id]:
                    await viewer.send(message)
    except websockets.exceptions.ConnectionClosed:
        print(f"[Server] Camera {camera_id} disconnected")
    finally:
        if camera_id in camera_websockets and camera_websockets[camera_id] == websocket:
            del camera_websockets[camera_id]

async def handle_viewer(websocket, camera_id):
    """Handle a viewer (e.g., Next.js component) receiving video frames."""
    if camera_id not in viewer_websockets:
        viewer_websockets[camera_id] = set()
    viewer_websockets[camera_id].add(websocket)
    print(f"[Server] Viewer connected to camera {camera_id}")
    try:
        # Keep the connection open to receive messages
        await websocket.wait_closed()
    except websockets.exceptions.ConnectionClosed:
        print(f"[Server] Viewer disconnected from camera {camera_id}")
    finally:
        viewer_websockets[camera_id].remove(websocket)
        if not viewer_websockets[camera_id]:
            del viewer_websockets[camera_id]

async def handler(websocket, path):
    """Route WebSocket connections based on path."""
    if path.startswith('/camera/'):
        camera_id = path[len('/camera/'):]
        await handle_camera(websocket, camera_id)
    elif path.startswith('/view/'):
        camera_id = path[len('/view/'):]
        await handle_viewer(websocket, camera_id)
    else:
        print("[Server] Invalid path, closing connection")
        await websocket.close()

async def main():
    async with websockets.serve(handler, "localhost", PORT):
        print(f"[Server] Listening on port {PORT}...")
        await asyncio.Future()  # Run forever

asyncio.run(main())