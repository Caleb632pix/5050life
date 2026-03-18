/**
 * Redis Connection
 */
const { createClient } = require('redis');
const logger           = require('./logger');

let redisClient;

async function connectRedis() {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    },
    password: process.env.REDIS_PASSWORD || undefined
  });

  redisClient.on('error', err => logger.error('Redis error:', err));
  redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

  await redisClient.connect();
  logger.info('✅ Redis connected');
}

function getRedis() {
  if (!redisClient) throw new Error('Redis not connected');
  return redisClient;
}

// Helpers
async function setCache(key, value, ttlSeconds = 300) {
  await getRedis().setEx(key, ttlSeconds, JSON.stringify(value));
}
async function getCache(key) {
  const data = await getRedis().get(key);
  return data ? JSON.parse(data) : null;
}
async function delCache(key) {
  await getRedis().del(key);
}
async function incrCounter(key) {
  return getRedis().incr(key);
}

module.exports = { connectRedis, getRedis, setCache, getCache, delCache, incrCounter };
