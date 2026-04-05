import express from 'express';
import cors from 'cors';
import morgan from 'morgan'; // 1. Add Logger
import { globalErrorHandler } from './middlewares/error.middleware.js'; // 2. Import your custom handler
import cookieParser from 'cookie-parser';
import routerHandler from './utils/routerHandler.js';
import helmet from 'helmet';

export const bootstrap = (app) => {
    // --- Global Middlewares ---
    // 1. CORS MUST BE FIRST! (Let's the browser know it's allowed to talk to us)
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.DASHBOARD_URL,
        process.env.RAILWAY_STATIC_URL, // Railway auto domain (optional),
        "http://localhost:4000",
        "http://localhost:5173"
    ].filter(Boolean); // remove undefined values

    app.use(cors({
        origin: (origin, callback) => {
            // allow requests with no origin (Postman, mobile apps, curl, etc.)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    }));

    // 2. HELMET (Configured to allow your frontend to interact with the API)
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // 3. Parsers
    app.use(express.json({
        verify: (req, res, buf) => {
            if (req.originalUrl.includes('/webhook')) {
                req.rawBody = buf;
            }
        }
    }));
    app.use(cookieParser());

    // 4. Data Sanitization (Prevent NoSQL Injection)
    // app.use(mongoSanitize());

    // Log requests only in development
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    }

    routerHandler(app, express)

    // --- Global Error Handler (Must be last) ---
    // This replaces your inline function with the JSend standard one
    app.use(globalErrorHandler);
}