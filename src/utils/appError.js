import { HTTP_STATUS } from '../config/constants.js';

export class AppError extends Error {
    constructor(message, statusCode, stack='') {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Distinguishes operational errors (bad input) from bugs
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }

    }
}

/**
 * 400 - Bad Request
 * Used when the server cannot process the request due to client error (malformed syntax, etc.)
 */
export const createBadRequestError = (message = "Bad Request") => {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST);
};

/**
 * 401 - Unauthorized
 * Used when authentication is required and has failed or has not been provided.
 */
export const createUnauthorizedError = (message = "Unauthorized access. Please log in.") => {
    return new AppError(message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * 403 - Forbidden
 * Used when the user is authenticated but does not have permission (Role check).
 */
export const createForbiddenError = (message = "Access forbidden. You do not have permission.") => {
    return new AppError(message, HTTP_STATUS.FORBIDDEN);
};

/**
 * 404 - Not Found
 * Used when the requested resource could not be found.
 */
export const createNotFoundError = (message = "Resource not found.") => {
    return new AppError(message, HTTP_STATUS.NOT_FOUND);
};

/**
 * 409 - Conflict
 * Used when there is a conflict with the current state of the target resource (e.g. Email exists).
 */
export const createConflictError = (message = "Resource already exists.") => {
    return new AppError(message, HTTP_STATUS.CONFLICT);
};

/**
 * 422 - Unprocessable Entity
 * Used when validation fails (e.g. Password too short, invalid email format).
 */
export const createUnprocessableEntityError = (message = "Validation failed. Check your input.") => {
    return new AppError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
};

/**
 * 429 - Too Many Requests
 * Used when the user has sent too many requests in a given amount of time (Rate Limiting).
 */
export const createTooManyRequestsError = (message = "Too many requests. Please try again later.") => {
    return new AppError(message, HTTP_STATUS.TOO_MANY_REQUESTS);
};

/**
 * 500 - Internal Server Error
 * Generic error message when an unexpected condition was encountered.
 */
export const createInternalServerError = (message = "Internal Server Error.") => {
    return new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

/**
 * 503 - Service Unavailable
 * Used when the server is not ready to handle the request (e.g. Maintenance).
 */
export const createServiceUnavailableError = (message = "Service unavailable. Please try again later.") => {
    return new AppError(message, HTTP_STATUS.SERVICE_UNAVAILABLE);
};