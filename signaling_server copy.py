# main_server.py
import asyncio
import websockets
from collections import defaultdict

publishers = {}
subscribers = defaultdict(list)

async def handle_connection(websocket, path):
    """Handle WebSocket connections from lock devices and web app."""
    parts = path.split('/')
    if len(parts) < 3:
        await websocket.close()
        return
    action = parts[1]
    camera_id = parts[2]

    if action == 'publish':
        # Lock device is publishing its stream
        if camera_id in publishers:
            # Only one publisher per camera_id allowed
            await websocket.close()
            return
        publishers[camera_id] = websocket
        try:
            async for message in websocket:
                # Relay the frame to all subscribers for this camera_id
                for subscriber in subscribers[camera_id]:
                    await subscriber.send(message)
        except websockets.ConnectionClosed:
            pass
        finally:
            if camera_id in publishers:
                del publishers[camera_id]

    elif action == 'stream':
        # Web app is subscribing to the stream
        subscribers[camera_id].append(websocket)
        try:
            await websocket.wait_closed()
        except websockets.ConnectionClosed:
            pass
        finally:
            if websocket in subscribers[camera_id]:
                subscribers[camera_id].remove(websocket)

async def main():
    """Start the WebSocket server."""
    server = await websockets.serve(handle_connection, "0.0.0.0", 8765)
    print("Server running on ws://0.0.0.0:8765")
    await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())