import Joi from "joi";

export const updateMeSchema = Joi.object({
    name: Joi.string().min(3).trim(),
});

export const preferencesSchema = Joi.object({
    darkMode: Joi.boolean(),
    notifications: Joi.boolean(),
    language: Joi.string().valid("en", "ar"),
});
