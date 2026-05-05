import { Hono } from "hono";
import { getRedis } from "../db/redis";

const redisRoute = new Hono().get("/test", async (c) => {
  const redis = await getRedis();

  await redis.set("test:hello", "world", {
    EX: 60,
  });

  const value = await redis.get("test:hello");

  return c.json({
    ok: true,
    value,
  });
});

export default redisRoute;
