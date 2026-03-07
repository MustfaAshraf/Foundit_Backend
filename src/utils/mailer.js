import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

export const sendEmail = async (options) => {
    // 1. Create Transporter
    const transporter = nodemailer.createTransport({
        host: config.EMAIL.HOST,
        port: config.EMAIL.PORT,
        secure: config.EMAIL.SECURE, // true for 465, false for other ports
        auth: {
            user: config.EMAIL.USER,
            pass: config.EMAIL.PASSWORD,
        },
    });

    // 2. Define Email Options
    const mailOptions = {
        from: config.EMAIL.FROM,
        to: options.email,
        subject: options.subject,
        html: options.html, // We send HTML emails
    };

    // 3. Send
    await transporter.sendMail(mailOptions);
};