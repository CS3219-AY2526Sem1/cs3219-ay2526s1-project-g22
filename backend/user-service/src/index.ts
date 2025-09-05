import bodyParser from "body-parser";
import express from "express";
import cors from "cors"; // Add this import
import { defineUserRoutes } from "./modules/user";
import { Server } from "http";

require("dotenv").config(); // Load environment variables from .env file

const app = express();

// Configure CORS properly
app.use(
  cors({
    origin: [
      process.env.ALLOWED_ORIGIN_DEVELOPMENT!, // Development origin
      process.env.ALLOWED_ORIGIN_PRODUCTION!,
      process.env.ALLOWED_API_GATEWAY_ORIGIN!, // API Gateway origin
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

defineUserRoutes(app);

const port = process.env.PORT || 8000;
let server: Server;

server = app.listen(port, () => {
  console.log(`Backend server is running on port ${port}!`);
});

export { app, server };
