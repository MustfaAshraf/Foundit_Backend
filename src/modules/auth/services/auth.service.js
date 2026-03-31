import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import crypto from 'crypto';
import { User } from '../../../DB/models/user.model.js';
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
import { encrypt, decrypt } from '../../../utils/encryption.js';
import { hashPassword, comparePassword } from '../../../utils/passHandler.js';
import { sendEmail } from '../../../utils/mailer.js';
import { config } from '../../../config/env.js';
import { ReputationService } from '../../user/services/reputation.service.js';

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

    // 1. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Encrypt OTP for DB storage
    const encryptedOtp = encrypt(otpCode);

    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        otp: encryptedOtp,
        otpExpires: Date.now() + 10 * 60 * 1000 // OTP expires in 10 minutes
    });

    // 3. Send OTP Email
    const message = `
        <h2>Welcome to FoundIt!</h2>
        <p>Your verification code is: <strong style="font-size: 24px; color: #1d63ed;">${otpCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
    `;

    await sendEmail({
        email,
        subject: 'FoundIt - Verify Your Account',
        html: message
    });

    return {
        _id: newUser._id,
        email: newUser.email,
        message: "Account created successfully. Please check your email for the OTP."
    };
};

// ==========================
// 2. LOGIN
// ==========================
export const loginService = async ({ email, password }) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw createUnauthorizedError('Invalid email or password');

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw createUnauthorizedError('Invalid email or password');

    // 🛑 BLOCK UNVERIFIED USERS
    if (!user.isVerified) {
        throw createForbiddenError('Please verify your email before logging in. We sent an OTP to your email.');
    }

    // 🛑 BLOCK BANNED USERS
    if (user.status === 'banned') {
        throw createForbiddenError('Your account has been banned. Please contact support.');
    }

    // Update activity score (+1) and handle daily reward logic when user logs in
    let updatedUser = await ReputationService.addActivity(user._id, 1);
    if (!updatedUser) {
        // fallback to daily login handler if addActivity does not return updated user
        await ReputationService.handleDailyLogin(user);
        updatedUser = await User.findById(user._id);
    }

    const accessToken = generateAccessToken({ id: updatedUser._id, email: updatedUser.email, role: updatedUser.role });
    const refreshToken = generateRefreshToken({ id: updatedUser._id, email: updatedUser.email, role: updatedUser.role });

    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    updatedUser.refreshToken.push({ token: refreshToken, expireAt });
    await updatedUser.save();

    user.password = undefined;

    return { user, accessToken, refreshToken };
};

export const verifyOTPService = async (email, otpCode) => {
    // 1. Find user & explicitly select the OTP fields
    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user) throw createNotFoundError('User not found');

    if (user.isVerified) throw createBadRequestError('Account is already verified. Please login.');

    // 2. Check Expiry
    if (!user.otpExpires || user.otpExpires < Date.now()) {
        throw createBadRequestError('OTP has expired. Please request a new one.');
    }

    // 3. Decrypt and compare
    const decryptedOtp = decrypt(user.otp);
    if (decryptedOtp !== otpCode) {
        throw createBadRequestError('Invalid OTP code.');
    }

    // 4. Verification Success -> Update User
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return { message: "Email verified successfully! You can now log in." };
};

export const resendOTPService = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw createNotFoundError('User not found');
    if (user.isVerified) throw createBadRequestError('Account is already verified.');

    // 1. Generate New OTP
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. Update DB
    user.otp = encrypt(newOtpCode);
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // 3. Send Email
    const message = `
        <h2>FoundIt - New Verification Code</h2>
        <p>Your new verification code is: <strong style="font-size: 24px; color: #1d63ed;">${newOtpCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
    `;

    await sendEmail({
        email,
        subject: 'FoundIt - New OTP Code',
        html: message
    });

    return { message: "A new OTP has been sent to your email." };
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

    // 3. Send Email (Smart Redirect)
    // If user is an admin, send to Dashboard, otherwise send to standard React App
    const baseUrl = (user.role === 'super_admin' || user.role === 'community_admin') 
        ? config.DASHBOARD_URL 
        : config.FRONTEND_URL;

    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
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
    // 1. Verify Token Signature
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) throw createBadRequestError('Invalid or expired token');

    // 2. Find User by ID and verify the expiry time hasn't passed
    const user = await User.findOne({
        _id: decoded.id,
        passwordResetExpires: { $gt: Date.now() } // Double check expiry
    });

    if (!user || !user.passwordResetToken) {
        throw createBadRequestError('Invalid or expired token');
    }

    // 3. DECRYPT the DB token and compare it to the incoming token
    const decryptedDbToken = decrypt(user.passwordResetToken);

    if (decryptedDbToken !== token) {
        throw createBadRequestError('Token mismatch. Invalid request.');
    }

    // 4. Hash New Password & Save
    user.password = await hashPassword(newPassword);

    // Clean up DB fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();

    // Log them out of all devices (Force re-login with new password)
    user.refreshToken = [];

    await user.save();

    return { message: 'Password reset successfully. Please login.' };
};


// Initialize the Google Client with your ENV variable
const googleClient = new OAuth2Client(config.GOOGLE.CLIENT_ID);

// ==========================
// 7. GOOGLE LOGIN/REGISTER
// ==========================
export const googleLoginService = async (googleAccessToken) => {
    let googleUser;

    try {
        // 1. Fetch user profile from Google using the access_token
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${googleAccessToken}` }
        });
        googleUser = response.data;
    } catch (error) {
        console.error("Google API Error:", error.response?.data || error.message);
        throw createUnauthorizedError('Invalid Google Access Token');
    }

    // Extract data from Google's response (Google also sends 'email_verified' boolean!)
    const { email, name, sub: googleId, picture, email_verified } = googleUser;

    // Security Check: Ensure Google actually verified this email
    if (!email_verified) {
        throw createUnauthorizedError('Your Google account email is not verified by Google.');
    }

    // 2. Check if user already exists
    let user = await User.findOne({ email }).select('+password');
    let isNewUser = false;

    // 3. Auto-Register if they don't exist
    if (!user) {
        const randomPasswordRaw = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await hashPassword(randomPasswordRaw);

        user = await User.create({
            name,
            email,
            password: hashedPassword,
            isVerified: true, // 👈 THE FIX: Set to true automatically!
            socialProvider: 'google',
            socialId: googleId,
            avatar: { url: picture, publicId: null } 
        });

        isNewUser = true;

        // 🎁 REPUTATION: Google Registry Trust Bonus (+20)
        await ReputationService.addTrust(user._id, 40);
    } 
    // 4. EDGE CASE FIX: If they existed but were NOT verified, Google just verified them!
    else if (!user.isVerified) {
        user.isVerified = true; // 👈 Retroactively verify them
        user.socialProvider = 'google'; // Upgrade their account to a Google account
        user.socialId = googleId;
        
        // If they didn't have an avatar, give them the Google one
        if (!user.avatar?.url) {
            user.avatar = { url: picture, publicId: null };
        }
        await user.save();
    }

    // 🛑 BLOCK BANNED USERS
    if (user.status === 'banned') {
        throw createForbiddenError('Your account has been banned. Please contact support.');
    }

    // 5. Update activity score (+1) and handle daily reward logic when user logs in
    let updatedUser = await ReputationService.addActivity(user._id, 1);
    if (!updatedUser) {
        await ReputationService.handleDailyLogin(user);
        updatedUser = await User.findById(user._id);
    }

    // 6. Generate App Tokens
    const accessToken = generateAccessToken({ id: updatedUser._id, role: updatedUser.role });
    const refreshToken = generateRefreshToken({ id: updatedUser._id, role: updatedUser.role });

    // 7. Save Refresh Token to DB
    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days
    updatedUser.refreshToken.push({ token: refreshToken, expireAt });
    updatedUser.lastLoginAt = new Date();
    await updatedUser.save();


    const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser.toObject();
    userObj.isNewUser = isNewUser;

    return {
        user: userObj,
        accessToken,
        refreshToken
    };
};