import express from 'express';
import cors from 'cors';
import morgan from 'morgan'; // 1. Add Logger
import { globalErrorHandler } from './middlewares/error.middleware.js'; // 2. Import your custom handler
import cookieParser from 'cookie-parser';
import routerHandler from './utils/routerHandler.js';

export const bootstrap = (app) => {
    // --- Global Middlewares ---
    app.use(express.json());
    app.use(cookieParser());
    app.use(cors({
        origin: process.env.FRONTEND_URL,
        credentials: true
    }));

    // Log requests only in development
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    }

    routerHandler(app, express)

    // --- Global Error Handler (Must be last) ---
    // This replaces your inline function with the JSend standard one
    app.use(globalErrorHandler);
}