import Joi from "joi";

// CREATE USER
export const createUserSchema = {
    body: Joi.object({
        name: Joi.string().min(3).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string()
            .valid("user", "community_admin", "super_admin")
            .required(),
        community: Joi.string().optional(),
    }),
};

// STATUS
export const updateStatusSchema = {
    body: Joi.object({
        status: Joi.string().valid("active", "banned").required(),
    }),
};