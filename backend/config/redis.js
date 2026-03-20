var logger = require('./logger');

var redisClient = null;

async function connectRedis() {
  if (process.env.SKIP_REDIS === 'true') {
    logger.info('Redis skipped');
    return;
  }
  try {
    var redis = require('redis');
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });
    redisClient.on('error', function(err) {
      logger.warn('Redis error: ' + err.message);
    });
    await redisClient.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis not available — running without cache');
    redisClient = null;
  }
}

function getRedis() {
  return redisClient;
}

async function setCache(key, value, ttl) {
  try {
    if (redisClient) {
      await redisClient.setEx(key, ttl || 300, JSON.stringify(value));
    }
  } catch (e) {
    // ignore
  }
}

async function getCache(key) {
  try {
    if (!redisClient) return null;
    var data = await redisClient.get(key);
    if (data) return JSON.parse(data);
    return null;
  } catch (e) {
    return null;
  }
}

async function delCache(key) {
  try {
    if (redisClient) {
      await redisClient.del(key);
    }
  } catch (e) {
    // ignore
  }
}

async function incrCounter(key) {
  try {
    if (redisClient) {
      return await redisClient.incr(key);
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

module.exports = {
  connectRedis: connectRedis,
  getRedis: getRedis,
  setCache: setCache,
  getCache: getCache,
  delCache: delCache,
  incrCounter: incrCounter
};
