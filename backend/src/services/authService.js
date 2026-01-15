const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

// Ethereal Email Setup (Test Account)
// In production, replace with real SMTP credentials
const createTransporter = async () => {
    // For testing, we can use a hardcoded helper or environment variables
    // For now, let's use a console logger if no env vars are set, or try to use Ethereal
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Fallback for demo: Create a test account dynamically or use console
        const testAccount = await nodemailer.createTestAccount();
        console.log('Ethereal Test Account:', testAccount.user, testAccount.pass);
        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }
};

const register = async (data) => {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
        data: {
            ...data,
            password: hashedPassword,
        },
    });

    // Return without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

const login = async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
};

const forgotPassword = async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
        where: { id: user.id },
        data: { otp, otpExpires }
    });

    // Send Email
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
        from: '"InsureOS Security" <security@insureos.com>',
        to: email,
        subject: "Password Reset Request",
        text: `Your password reset code is: ${otp}`,
        html: `<b>Your password reset code is: ${otp}</b><br>It expires in 15 minutes.`
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info)); // Useful for Ethereal

    return { message: 'OTP sent to email' };
};

const resetPassword = async (email, otp, newPassword) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    if (user.otp !== otp) throw new Error('Invalid OTP');
    if (new Date() > user.otpExpires) throw new Error('OTP Expired');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            otp: null,
            otpExpires: null
        }
    });

    return { message: 'Password reset successful' };
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
};
