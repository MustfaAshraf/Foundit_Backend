import { User } from '../../../DB/models/User.model.js';
import {
    createConflictError,
    createUnauthorizedError,
    createBadRequestError,
    createNotFoundError,
    createForbiddenError
} from '../../../utils/appError.js';
import {
    generateAccessToken,
    generateRefreshToken,
    generateResetToken,
    verifyToken
} from '../../../utils/jwt.js';
import { encrypt } from '../../../utils/encryption.js';
import { hashPassword, comparePassword } from '../../../utils/passHandler.js';
import { sendEmail } from '../../../utils/mailer.js';
import { config } from '../../../config/env.js';

// ==========================
// 1. REGISTER
// ==========================
export const registerService = async (userData) => {
    const { name, email, password } = userData;

    const isEmailExist = await User.findOne({ email });
    if (isEmailExist) {
        throw createConflictError('Email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        isVerified: false
    });

    const message = `<h1>Welcome to FoundIt!</h1><p>Your account has been created successfully.</p>`;

    await sendEmail({
        email,
        subject: 'FoundIt - Registeration Successful',
        html: message
    });

    return {
        _id: newUser._id,
        email: newUser.email,
        message: "Account created successfully."
    };
};

// ==========================
// 2. LOGIN
// ==========================
export const loginService = async ({ email, password }) => {
    // 1. Find User
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw createUnauthorizedError('Invalid email or password');

    // 2. Check Password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw createUnauthorizedError('Invalid email or password');

    // 3. Generate Tokens
    const accessToken = generateAccessToken({ id: user._id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, email: user.email, role: user.role });

    // 4. Save Refresh Token to DB (Support Multi-Device)
    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days
    user.refreshToken.push({ token: refreshToken, expireAt });
    await user.save();

    user.password = undefined;

    return {
        user,
        accessToken,
        refreshToken
    };
};

// ==========================
// 3. REFRESH TOKEN
// ==========================
export const refreshTokenService = async (incomingRefreshToken) => {
    // 1. Verify Token Signature
    const decoded = verifyToken(incomingRefreshToken);
    if (!decoded || !decoded.id) throw createForbiddenError('Invalid Refresh Token');

    // 2. Check if User exists & Token is in DB
    const user = await User.findOne({ _id: decoded.id, 'refreshToken.token': incomingRefreshToken });
    if (!user) throw createForbiddenError('Token used or expired. Please login again.');

    // 3. Generate NEW Access Token
    const newAccessToken = generateAccessToken({ id: user._id, email: user.email, role: user.role });

    return { accessToken: newAccessToken };
};

// ==========================
// 4. LOGOUT
// ==========================
export const logoutService = async (userId, refreshToken) => {
    // Remove the specific token from the array
    const user = await User.findById(userId)
    if (!user) {
        throw createNotFoundError("User not found")
    }
    user.refreshToken = user.refreshToken.filter(tk => tk.token !== refreshToken)
    await user.save()
    return true;
};

// ==========================
// 5. FORGOT PASSWORD
// ==========================
export const forgotPasswordService = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw createNotFoundError('User not found');

    // 1. Generate Reset Token (Using your jwt.js utility)
    const resetToken = generateResetToken({ id: user._id });

    // 2. Save to DB
    user.passwordResetToken = encrypt(resetToken);
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins (Optional if JWT handles expiry)
    await user.save();

    // 3. Send Email
    const resetUrl = `${config.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 10 minutes.</p>
        `;

    await sendEmail({
        email: user.email,
        subject: 'FoundIt - Password Reset',
        html: message
    });

    return { message: 'Reset link sent to your email.' };
};

// ==========================
// 6. RESET PASSWORD
// ==========================
export const resetPasswordService = async (token, newPassword) => {
    // 1. Verify Token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) throw createBadRequestError('Invalid or expired token');

    // 2. Find User & Validate DB Token
    const user = await User.findOne({
        _id: decoded.id,
        passwordResetToken: encrypt(token),
        passwordResetExpires: { $gt: Date.now() } // Double check expiry
    });

    if (!user) throw createBadRequestError('Invalid or expired token');

    // 3. Hash New Password & Save
    user.password = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();

    // Optional: Log them out of all devices?
    user.refreshToken = [];

    await user.save();

    return { message: 'Password reset successfully. Please login.' };
};