import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import questionRoutes from "./modules/question/entry-point/api/routes";
import { Server } from "http";
import { connectToMongo } from "./lib/mongodb-client";
require("dotenv").config(); // Load environment variables from .env file

const app = express();

// Configure CORS (customize origins as needed)
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

app.use("/questions", questionRoutes);

// Wrap startup in async function
// test deployment
async function startServer() {
  try {
    await connectToMongo();
    console.log("[Server] MongoDB connected successfully.");

    const port = process.env.QUESTION_SERVICE_PORT || 6002;
    const server: Server = app.listen(port, () => {
      console.log(`Question service is running on port ${port}!`);
    });

    return server;
  } catch (err) {
    console.error("[Server] Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

// Start server
startServer();

export { app };
