import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatsRouter from "./routes/chats.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// mount chats router under /sessions so routes are /sessions/:sessionId/chats
app.use("/sessions", chatsRouter);

const port = process.env.CHAT_SERVICE_PORT || 6010;

// Start server only when this file is run directly (prevents tests from leaving the server running)
if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Chat Service running on port ${port}`);
  });

  // Graceful shutdown on SIGINT/SIGTERM
  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

export default app;
