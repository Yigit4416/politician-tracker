import { createClient } from "redis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing");
}

export const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

let isConnected = false;

export async function getRedis() {
  if (!isConnected) {
    await redis.connect();
    isConnected = true;
  }

  return redis;
}
