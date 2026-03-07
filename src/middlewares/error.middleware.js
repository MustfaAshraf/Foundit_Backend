import { HTTP_STATUS } from '../config/constants.js';
import { sendErrorResponse, sendFailResponse } from '../utils/appResponse.js';

// Helper: Handle Mongoose CastError (Invalid ID)
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return { message, statusCode: HTTP_STATUS.BAD_REQUEST };
};

// Helper: Handle Mongoose Duplicate Fields (e.g. Email exists)
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return { message, statusCode: HTTP_STATUS.CONFLICT };
};

// Helper: Handle Mongoose Validation Errors
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return { message, statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY };
};

export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        // In Dev: Send stack trace
        sendErrorResponse(res, err.message, err.statusCode, null, {
            error: err,
            stack: err.stack
        });
    } else {
        // In Prod: Send clean errors
        let error = { ...err };
        error.message = err.message;

        // Mongoose Error Traps
        if (err.name === 'CastError') {
            const errorObj = handleCastErrorDB(err);
            return sendErrorResponse(res, errorObj.message, errorObj.statusCode);
        }
        if (err.code === 11000) {
            const errorObj = handleDuplicateFieldsDB(err);
            // Using Fail Response for duplicates is often cleaner
            return sendFailResponse(res, { email: errorObj.message }, errorObj.statusCode);
        }
        if (err.name === 'ValidationError') {
            const errorObj = handleValidationErrorDB(err);
            return sendErrorResponse(res, errorObj.message, errorObj.statusCode);
        }
        if (err.name === 'JsonWebTokenError') {
            return sendErrorResponse(res, 'Invalid token. Please log in again!', HTTP_STATUS.UNAUTHORIZED);
        }
        if (err.name === 'TokenExpiredError') {
            return sendErrorResponse(res, 'Your token has expired! Please log in again.', HTTP_STATUS.UNAUTHORIZED);
        }

        // Generic Error
        if (err.isOperational) {
            return sendErrorResponse(res, err.message, err.statusCode);
        } else {
            // Programming or other unknown error: don't leak details
            console.error('ERROR 💥', err);
            return sendErrorResponse(res, 'Something went very wrong!', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
};