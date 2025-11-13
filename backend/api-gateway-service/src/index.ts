/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 18 Sep 2025
Scope: Refactored small sections for clarity and added inline comments to simplify maintenance and readability.
Author review: I checked correctness, tested and clarified intent in code comments.
*/
// src/gateway.ts
import express from "express";
import * as http from "http";
import dotenv from "dotenv";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const port = process.env.API_GATEWAY_PORT || 8000;

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN_DEVELOPMENT,
  process.env.ALLOWED_ORIGIN_PRODUCTION,
  process.env.ALLOWED_API_GATEWAY_ORIGIN,
  process.env.API_DOCS,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true, // allow all in dev if none set
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Known microservices
const services: Record<string, string> = {
  "user-service": process.env.USER_SERVICE_URL || "http://localhost:6001",
  "collaboration-service":
    process.env.COLLAB_SERVICE_URL || "http://localhost:6004",
  // add more here, e.g. "order-service": process.env.ORDER_SERVICE_URL
  "question-service":
    process.env.QUESTION_SERVICE_URL || "http://localhost:6002",
  "matching-service":
    process.env.MATCHING_SERVICE_URL || "http://localhost:6006",
  "chat-service": process.env.CHAT_SERVICE_URL || "http://localhost:6010",
  "ai-service": process.env.AI_SERVICE_URL || "http://localhost:6020",
};

// Simple request log
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Validate service exists before proxying
app.use("/api/:service", (req, res, next) => {
  const { service } = req.params;
  const target = services[service];
  if (!target) {
    return res.status(404).json({ error: `Service '${service}' not found` });
  }
  // stow it for the proxy middleware
  (req as any)._target = target;
  next();
});

// Proxy all routes under /api/:service/* to the mapped target
const apiProxy = createProxyMiddleware({
  router: (req) => (req as any)._target, // dynamic target per request
  changeOrigin: true,
  ws: true, // WebSocket support
  proxyTimeout: 30_000,
  timeout: 30_000,
  pathRewrite: (path, req) => {
    // Remove the /api/:service prefix so the downstream sees the correct route.
    // e.g. /api/user-service/auth/login -> /auth/login
    const service = (req as any).params?.service;
    return path.replace(new RegExp(`^/api/${service}`), "") || "/";
  },
});

app.use("/api/:service", apiProxy);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
// Fallback for unknown routes, test deployment
app.use((_req, res) => {
  res.status(404).send("API Gateway: Route not found");
});

const server = http.createServer(app);

// Handle WebSocket upgrade requests
server.on("upgrade", (req, socket, head) => {
  const urlParts = req.url?.split("/");
  if (!urlParts || urlParts.length < 3 || urlParts[1] !== "api") {
    socket.destroy();
    return;
  }
  const serviceName = urlParts[2];
  const target = services[serviceName];

  if (target) {
    // Manually set properties for the proxy's router and pathRewrite
    (req as any)._target = target;
    (req as any).params = { service: serviceName };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    apiProxy.upgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(port, () => {
  console.log(`API Gateway running on http://localhost:${port}`);
});
