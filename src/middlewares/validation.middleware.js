import { sendFailResponse } from '../utils/appResponse.js'; // Ensure you have this util
import { HTTP_STATUS } from '../config/constants.js';

const dataMethods = ['body', 'params', 'query', 'headers'];

export const validate = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];

        dataMethods.forEach((key) => {
            if (schema[key]) {
                // abortEarly: false shows ALL errors, not just the first one
                const validationResult = schema[key].validate(req[key], { abortEarly: false });
                
                if (validationResult.error) {
                    validationResult.error.details.forEach((detail) => {
                        validationErrors.push({
                            field: detail.context.key,
                            message: detail.message.replace(/"/g, '')
                        });
                    });
                }
            }
        });

        if (validationErrors.length > 0) {
            // Stop the request here if validation fails
            return sendFailResponse(res, validationErrors, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }

        next();
    };
};