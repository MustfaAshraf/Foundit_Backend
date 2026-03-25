import joi from 'joi';
import { REGEX } from '../../../config/constants.js';

export const readNotificationSchema = {
    params: joi.object({
        id: joi.string().pattern(REGEX.OBJECT_ID).required().messages({
            'string.pattern.base': 'Invalid Notification ID format'
        })
    }).required()
};