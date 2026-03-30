import Joi from "joi";
import { REGEX } from "../../../config/constants.js";

export const updateMeSchema = {
    body: Joi.object({
        name: Joi.string().min(3).trim(),
    }).required()
};

export const preferencesSchema = Joi.object({
    darkMode: Joi.boolean(),
    notifications: Joi.boolean(),
    language: Joi.string().valid("en", "ar"),
});

export const changePasswordSchema = {
    body: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/).required().messages({
            'string.pattern.base': 'Password must be at least 8 characters long and contain at least one letter and one number.',
        }),
        confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).messages({
            'any.only': 'New passwords do not match',
        }),
    }).required().unknown(true)
};