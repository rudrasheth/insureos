const { z } = require('zod');
const authService = require('../services/authService');

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

const resetPasswordSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    newPassword: z.string().min(6),
});

const register = async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);
        const user = await authService.register(data);
        res.status(201).json(user);
    } catch (error) {
        if (error.message === 'Email already registered') {
            return res.status(409).json({ error: 'Conflict', message: error.message });
        }
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ error: 'Unauthorized', message: error.message });
        }
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const result = await authService.forgotPassword(email);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);
        const result = await authService.resetPassword(email, otp, newPassword);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
};
