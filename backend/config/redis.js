const logger = require('./logger');

let redisClient = null;

async function connectRedis() {
  if (process.env.SKIP_REDIS === 'true') {
    logger.info('Redis skipped — running without cache');
    return;
  }
  try {
    const { createClient } = require('redis');
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      },
      password: process.env.REDIS_PASSWORD || undefined
    });
    redisClient.on('error', err => logger.warn('Redis error:', err.message));
    await redisClient.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis not available — running without cache');
    redisClient = null;
  }
}

function getRedis() { return redisClient; }

async function setCache(key, value, ttl) {
  try {
    if (redisClient) await redisClient.setEx(key, ttl || 300, JSON.stringify(value));
  } catch (e) {}
}

async function getCache(key) {
  try {
    if (!redisClient) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
}

async function delCache(key) {
  try {
    if (redisClient) await redisClient.del(key);
  } catch (e) {}
}

async function incrCounter(key) {
  try {
    if (redisClient) return await redisClient.incr(key);
    return 0;
  } catch (e) { return 0; }
}

module.exports = { connectRedis, getRedis, setCache, getCache, delCache, incrCounter };
