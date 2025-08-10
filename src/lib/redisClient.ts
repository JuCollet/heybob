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

export async function addUserMessage(phone: string, message: string) {
  const key = `user:${phone}:history`;
  await redisClient.rPush(key, message);
  await redisClient.expire(key, 3600);
}

export async function getUserHistory(phone: string): Promise<string[]> {
  const key = `user:${phone}:history`;
  return (await redisClient.lRange(key, 0, -1)) || [];
}

export async function clearUserHistory(phone: string) {
  const key = `user:${phone}:history`;
  await redisClient.del(key);
}

export async function addBotMessage(phone: string, message: string) {
  const key = `bot:${phone}:history`;
  await redisClient.rPush(key, message);
  await redisClient.expire(key, 3600);
}

export async function getBotHistory(phone: string): Promise<string[]> {
  const key = `bot:${phone}:history`;
  return (await redisClient.lRange(key, 0, -1)) || [];
}

export async function clearBotHistory(phone: string) {
  const key = `bot:${phone}:history`;
  await redisClient.del(key);
}

export default redisClient;
