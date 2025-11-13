/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. Also refactored some messy parts and added clarifying comments. Suggested tests for edge-cases.
Author review: I validated correctness against the team's requirements, ran tests, then improved clarity and debugged interactions with other components.
*/
import bodyParser from "body-parser";
import express from "express";
import cors from "cors"; // Add this import
import { defineUserRoutes } from "./modules/user";
import { Server } from "http";

require("dotenv").config(); // Load environment variables from .env file

const app = express();

// Configure CORS properly
// test deployment
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

const port = process.env.USER_SERVICE_PORT || 6001;
let server: Server;

server = app.listen(port, () => {
  console.log(`Backend server is running on port ${port}!`);
});

export { app, server };
