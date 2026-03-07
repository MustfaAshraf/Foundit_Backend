import { HTTP_STATUS } from '../config/constants.js';

/**
 * 🟢 JSend SUCCESS
 * Used when an API call is successful.
 * @param {Object} res - Express response object
 * @param {Object} data - The data payload (wrapper object recommended)
 * @param {Number} statusCode - HTTP status (default 200)
 */
export const sendSuccessResponse = (res, data = null, statusCode = HTTP_STATUS.OK) => {
    return res.status(statusCode).json({
        status: 'success',
        data: data
    });
};

/**
 * 🟡 JSend FAIL
 * Used when the data is invalid or the call is rejected (Client Error 4xx).
 * The 'data' key should contain the specific validation errors.
 * @param {Object} res - Express response object
 * @param {Object} data - details of why it failed (e.g. { email: "Already exists" })
 * @param {Number} statusCode - HTTP status (default 400)
 */
export const sendFailResponse = (res, data, statusCode = HTTP_STATUS.BAD_REQUEST) => {
    return res.status(statusCode).json({
        status: 'fail',
        data: data
    });
};

/**
 * 🔴 JSend ERROR
 * Used when an exception is thrown or a service fails (Server Error 5xx).
 * @param {Object} res - Express response object
 * @param {String} message - Human readable error message
 * @param {Number} statusCode - HTTP status (default 500)
 * @param {Number|String} code - Optional error code (e.g. 1004)
 * @param {Object} data - Optional data relevant to the error
 */
export const sendErrorResponse = (res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = null, data = null) => {
    const response = {
        status: 'error',
        message: message
    };

    if (code) response.code = code;
    if (data) response.data = data;

    return res.status(statusCode).json(response);
};