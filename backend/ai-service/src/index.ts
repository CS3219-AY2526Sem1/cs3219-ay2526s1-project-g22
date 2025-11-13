/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash, date: 10 Oct 2025
Scope: Helped implement several functions to meet the team's requirements and provided focused cleanups and clarifying comments.
Author review: I validated behavior by running tests where applicable, simplified unclear code, and fixed small implementation issues.
*/
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import aiServiceRouter from "./ai/ai.router";
dotenv.config();

const app = express();
const port = process.env.AI_SERVICE_PORT || 6020;

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN_DEVELOPMENT,
  process.env.ALLOWED_ORIGIN_PRODUCTION,
  process.env.ALLOWED_API_GATEWAY_ORIGIN,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ai-service is runnning" });
});

app.use(aiServiceRouter);

app.listen(port, () => {
  console.log(`ai-service is runnning`);
});
