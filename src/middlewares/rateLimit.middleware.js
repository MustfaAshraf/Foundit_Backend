import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

// Limit repeated requests to public APIs
export const authLimiter = rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: config.RATE_LIMIT.MAX_REQUESTS || 10, // Limit each IP to 10 requests per window
    message: {
        status: 'fail',
        message: 'Too many attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});