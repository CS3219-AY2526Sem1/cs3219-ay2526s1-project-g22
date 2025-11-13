/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 01 Oct 2025
Scope: Helped implement several functions to meet the team's requirements and simplified code by refactoring and added clarifying comment.
Author review: I checked correctness, and refined unclear implementations and debugging minor issues.
*/
import express from "express";
import expressWs from "express-ws";
import cors from "cors";
import matchingRouter from "./matching/matching.router";
import config from "./config";
import { logger } from "./utils/logger";
import { webSocketManager } from "./websockets/websocket.manager";

const app = express();
const wsInstance = expressWs(app);

// --- Define the WebSocket route ---
wsInstance.app.ws("/ws/matching/:userId", (ws, req) => {
  const userId = req.params.userId;

  if (!userId) {
    // Close the connection if no user ID is provided
    ws.close(1008, "User ID is required.");
    return;
  }

  // Register the client with our manager
  webSocketManager.addClient(userId, ws);
    // Send a welcome message
    ws.send(JSON.stringify({ type: 'CONNECTION_ESTABLISHED' }));

});

// CORS: allow your frontend origin
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.ALLOWED_API_GATEWAY_ORIGIN!,
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // set to true only if client includes credentials
  })
);

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("Matching service is running!");
});

// Matching service routes
// test deployment
app.use("/", matchingRouter);

const startServer = async () => {
  app.listen(config.port, () => {
    logger.info(`Matching service listening on port ${config.port}`);
    logger.info(
      `Supabase URL: ${config.supabase.url ? "Configured" : "Not configured"}`
    );
    logger.info(`Redis Host: ${config.redis.host}, Port: ${config.redis.port}`);
  });
};

startServer();
