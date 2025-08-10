import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

export async function addUserMessage(id: string, message: string) {
  const key = `user:${id}:history`;
  await redisClient.rPush(key, message);
  await redisClient.expire(key, 3600);
}

export async function getUserHistory(id: string): Promise<string[]> {
  const key = `user:${id}:history`;
  return (await redisClient.lRange(key, 0, -1)) || [];
}

export async function clearUserHistory(id: string) {
  const key = `user:${id}:history`;
  await redisClient.del(key);
}

export async function addBotMessage(id: string, message: string) {
  const key = `bot:${id}:history`;
  await redisClient.rPush(key, message);
  await redisClient.expire(key, 3600);
}

export async function getBotHistory(id: string): Promise<string[]> {
  const key = `bot:${id}:history`;
  return (await redisClient.lRange(key, 0, -1)) || [];
}

export async function clearBotHistory(id: string) {
  const key = `bot:${id}:history`;
  await redisClient.del(key);
}

export default redisClient;
