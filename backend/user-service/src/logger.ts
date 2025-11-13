/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. Also refactored some messy parts and added clarifying comments. Suggested tests for edge-cases based on user-specified scenarios.
Author review: I validated correctness against the team's requirements, ran tests, then improved clarity and debugged interactions with other components.
*/
// logger.ts
import { createLogger, format, transports } from "winston";

require("dotenv").config();
const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

export default logger;
