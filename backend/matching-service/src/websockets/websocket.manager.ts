// src/websockets/websocket.manager.ts
import WebSocket from 'ws';
import { logger } from '../utils/logger';

class WebSocketManager {
    // A map to store active WebSocket connections, mapping userId to the WebSocket instance.
    private clients: Map<string, WebSocket> = new Map();

    // Add a new client connection
    addClient(userId: string, ws: WebSocket) {
        this.clients.set(userId, ws);
        logger.info(`WebSocket client connected: ${userId}`);

        // Handle connection closure
        ws.on('close', () => {
            this.clients.delete(userId);
            logger.info(`WebSocket client disconnected: ${userId}`);
        });
    }

    // Send a message to a specific user
    sendMessage(userId: string, message: object) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
            logger.info(`Sent WebSocket message to ${userId}`);
            return true;
        }
        logger.warn(`Attempted to send message to offline or non-existent user: ${userId}`);
        return false;
    }
}

export const webSocketManager = new WebSocketManager();