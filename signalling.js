const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8765 });

const peers = {};

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const { type, cameraId, payload } = data;

        if (type === 'register') {
            peers[cameraId] = ws;
            ws.cameraId = cameraId;
            console.log(`Registered ${cameraId}`);
        } else if (type === 'offer' || type === 'answer' || type === 'candidate') {
            const target = peers[payload.to];
            if (target && target.readyState === WebSocket.OPEN) {
                target.send(JSON.stringify({ type, payload }));
            }
        }
    });

    ws.on('close', () => {
        if (ws.cameraId && peers[ws.cameraId]) {
            delete peers[ws.cameraId];
            console.log(`Disconnected ${ws.cameraId}`);
        }
    });
});

console.log('Signaling server running on ws://0.0.0.0:8765');