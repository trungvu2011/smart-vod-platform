const IORedis = require("ioredis");
require("dotenv").config();

// Standard Redis client for generic usage (Caching, Rate Limiting, etc.)
const redisClient = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on("connect", () => {
  console.log("[REDIS] Cache client connected.");
});

redisClient.on("error", (err) => {
  console.error("[REDIS] Cache client error:", err);
});

module.exports = redisClient;
