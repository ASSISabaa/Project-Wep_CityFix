const redis = require('redis');

let redisClient = null;

const initializeRedis = async () => {
    try {
        if (process.env.REDIS_ENABLED === 'true') {
            redisClient = redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 3) return false;
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            redisClient.on('error', (err) => {
                console.log('Redis error (running without cache)');
            });

            redisClient.on('connect', () => {
                console.log('Redis Connected');
            });

            await redisClient.connect();
        } else {
            console.log('Redis disabled - running without cache');
        }
    } catch (error) {
        console.log('Redis connection failed - continuing without cache');
        redisClient = null;
    }
};

const getRedisClient = () => redisClient;

module.exports = {
    initializeRedis,
    getRedisClient
};