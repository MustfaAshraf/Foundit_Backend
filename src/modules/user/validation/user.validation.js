import Joi from "joi";
import { REGEX } from "../../../config/constants.js";

export const updateMeSchema = Joi.object({
    name: Joi.string().min(3).trim(),
});

export const preferencesSchema = Joi.object({
    darkMode: Joi.boolean(),
    notifications: Joi.boolean(),
    language: Joi.string().valid("en", "ar"),
});

export const changePasswordSchema = {
    body: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().pattern(REGEX.PASSWORD).required().messages({
            'string.pattern.base': 'Password must be at least 8 characters long and contain at least one letter and one number.',
        }),
        confirmNewPassword: Joi.valid(Joi.ref('newPassword')).required().messages({
            'any.only': 'New passwords do not match',
        }),
    }).required()
};