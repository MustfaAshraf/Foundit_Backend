import joi from 'joi';
import { REGEX } from '../../../config/constants.js';

export const registerSchema = {
    body: joi.object({
        name: joi.string().trim().min(3).max(50).required(),
        email: joi.string().pattern(REGEX.EMAIL).required(),
        password: joi.string().pattern(REGEX.PASSWORD).required().messages({
            'string.pattern.base': 'Password must be at least 8 characters long and contain at least one letter and one number.',
        }),
        confirmPassword: joi.valid(joi.ref('password')).required().messages({
            'any.only': 'Passwords do not match',
        }),
    }).required(),
};

export const loginSchema = {
    body: joi.object({
        email: joi.string().email().required(),
        password: joi.string().required(),
    }).required(),
};

export const verifyOtpSchema = {
    body: joi.object({
        email: joi.string().email().required(),
        otp: joi.string().length(6).pattern(/^[0-9]+$/).required()
    }).required()
};

export const resendOtpSchema = {
    body: joi.object({
        email: joi.string().email().required()
    }).required()
};

export const forgotPasswordSchema = {
    body: joi.object({
        email: joi.string().email().required(),
    }).required(),
};

export const resetPasswordSchema = {
    params: joi.object({
        token: joi.string().required(),
    }).required(),
    body: joi.object({
        newPassword: joi.string().pattern(REGEX.PASSWORD).required(),
        confirmNewPassword: joi.valid(joi.ref('newPassword')).required(),
    }).required(),
};

export const refreshTokenSchema = {
    cookies: joi.object({
        refreshToken: joi.string().required(),
    }).unknown(true), // Allow other cookies
};