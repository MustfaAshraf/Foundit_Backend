import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Application
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT) || 3000,
    API_PREFIX: process.env.API_PREFIX || '/api/v1',
    APP_NAME: process.env.APP_NAME || 'FoundIt Platform',

    // Database
    MONGODB_URI: process.env.MONGODB_URI,
    DB_MONGO_ATLAS: process.env.DB_MONGO_ATLAS,

    // JWT
    JWT: {
        SECRET: process.env.JWT_SECRET,
        ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE || '15m',
        REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
        RESET_PASSWORD_EXPIRE: process.env.JWT_RESET_PASSWORD_EXPIRE || '10m',
    },

    // Cookies
    COOKIE: {
        SECRET: process.env.COOKIE_SECRET || 'fallback_secret',
        EXPIRE: parseInt(process.env.COOKIE_EXPIRE) || 7,
        HTTP_ONLY: process.env.COOKIE_HTTP_ONLY === 'true',
        SECURE: process.env.COOKIE_SECURE === 'true', // Should be true in Production
        SAME_SITE: process.env.COOKIE_SAME_SITE || 'lax',
    },

    // Email
    EMAIL: {
        HOST: process.env.EMAIL_HOST,
        PORT: parseInt(process.env.EMAIL_PORT) || 587,
        SECURE: process.env.EMAIL_SECURE === 'true',
        USER: process.env.EMAIL_USER,
        PASSWORD: process.env.EMAIL_PASSWORD,
        FROM: process.env.EMAIL_FROM,
    },

    // Cloudinary
    CLOUDINARY: {
        CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        API_KEY: process.env.CLOUDINARY_API_KEY,
        API_SECRET: process.env.CLOUDINARY_API_SECRET,
    },

    // Stripe (SaaS)
    STRIPE: {
        SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    },

    GOOGLE: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        REDIRECT_URL: process.env.GOOGLE_REDIRECT_URL,
    },

    // File Upload
    UPLOAD: {
        MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
        MAX_VIDEO_SIZE: parseInt(process.env.MAX_VIDEO_SIZE) || 104857600,
        ALLOWED_IMAGE_TYPES: process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'webp'],
        ALLOWED_VIDEO_TYPES: process.env.ALLOWED_VIDEO_TYPES?.split(',') || ['mp4', 'webm'],
        ALLOWED_DOCUMENT_TYPES: process.env.ALLOWED_DOCUMENT_TYPES?.split(',') || ['pdf'],
    },

    // Rate Limiting
    RATE_LIMIT: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },

    // Frontend
    FRONTEND_URL: 'http://localhost:5173',
    DASHBOARD_URL: 'http://localhost:4000',

    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

    // Pagination
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        MAX_PAGE_SIZE: 100,
    },

    // Development flags
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
};