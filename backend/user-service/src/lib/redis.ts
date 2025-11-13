import Redis from "ioredis";
require("dotenv").config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

export default redisClient;
