const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

// Ethereal Email Setup (Test Account)
const createTransporter = async () => {
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
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
    const existing = await User.findOne({ email: data.email });
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
        ...data,
        password: hashedPassword,
    });

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
};

const login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });

    const userObj = user.toObject();
    delete userObj.password;
    return { user: userObj, token };
};

const forgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const transporter = await createTransporter();
    const info = await transporter.sendMail({
        from: '"InsureOS Security" <security@insureos.com>',
        to: email,
        subject: "Password Reset Request",
        text: `Your password reset code is: ${otp}`,
        html: `<b>Your password reset code is: ${otp}</b><br>It expires in 15 minutes.`
    });

    console.log("Message sent: %s", info.messageId);
    if (!process.env.SMTP_HOST) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return { message: 'OTP sent to email' };
};

const resetPassword = async (email, otp, newPassword) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    if (user.otp !== otp) throw new Error('Invalid OTP');
    if (user.otpExpires && new Date() > user.otpExpires) throw new Error('OTP Expired');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return { message: 'Password reset successful' };
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
};
