// src/gateway.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const port = process.env.API_GATEWAY_PORT || 8000;

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN_DEVELOPMENT,
  process.env.ALLOWED_ORIGIN_PRODUCTION,
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
app.use(
  "/api/:service",
  createProxyMiddleware({
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
  })
);

// Fallback for unknown routes
app.use((_req, res) => {
  res.status(404).send("API Gateway: Route not found");
});

app.listen(port, () => {
  console.log(`API Gateway running on http://localhost:${port}`);
});
