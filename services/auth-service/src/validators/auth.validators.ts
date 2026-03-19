import Joi from "joi";

export const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().required(),
    password: Joi.string().trim().required(),
});

export const userRegisterSchema = Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().trim().min(8).max(128).required(),
});

export const verifyOtpSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    otp: Joi.string().pattern(/^\d{6}$/).required(),
});

export const resendOtpSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
});
