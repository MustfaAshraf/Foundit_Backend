import { redisClient } from '../config/redis.js';
import { sendSuccessResponse } from '../utils/appResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

export const cacheReports = async (req, res, next) => {
    // 1. If Redis is down, just skip caching and go to MongoDB (Safety fallback)
    if (!redisClient.isOpen) return next();

    // 2. Create a unique cache key based on the URL query  
    // Example: "reports:{"page":"1","limit":"10","category":"Pets"}"
    const cacheKey = `reports:${JSON.stringify(req.query)}`;

    try {
        // 3. Check Redis
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log('🚀 [REDIS] Fetched Home Feed from Cache!');
            // Instantly return the cached data to the user!
            return sendSuccessResponse(res, JSON.parse(cachedData), HTTP_STATUS.OK);
        }

        // 4. If not found, attach the key to req so the controller can save it later
        req.redisCacheKey = cacheKey;
        next();
        
    } catch (err) {
        console.error('Redis Cache Error:', err);
        next(); // If Redis fails, let MongoDB handle it
    }
};