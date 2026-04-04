import { createClient } from 'redis';
import { config } from './env.js';

// Connect to local Redis server (Default port: 6379)
// If you use Upstash/Cloud, replace this URL with your cloud URL from .env
export const redisClient = createClient({
    url: config.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('⚡ Redis Connected Successfully'));

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};