import * as authService from './services/auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/appResponse.js';
import { HTTP_STATUS } from '../../config/constants.js';
import { config } from '../../config/env.js';

// --- Options for Cookies ---
const cookieOptions = {
    httpOnly: true, // Prevent XSS
    secure: config.isProduction, // HTTPS only in prod
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const register = asyncHandler(async (req, res) => {
    const result = await authService.registerService(req.body);
    sendSuccessResponse(res, result, HTTP_STATUS.CREATED);
});

export const login = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.loginService(req.body);

    // Send Refresh Token via Cookie (Best Practice)
    res.cookie('refreshToken', refreshToken, cookieOptions);

    sendSuccessResponse(res, { user, accessToken }, HTTP_STATUS.OK);
});

export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const result = await authService.verifyOTPService(email, otp);
    sendSuccessResponse(res, result, HTTP_STATUS.OK);
});

export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.resendOTPService(email);
    sendSuccessResponse(res, result, HTTP_STATUS.OK);
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    // 1. Extract token from Cookie
    const incomingRefreshToken = req.cookies?.refreshToken;
    // 2. Safety Check (If no cookie, return 401 instead of crashing with 500)
    if (!incomingRefreshToken) {
        return sendErrorResponse(res, 'No refresh token provided. Please log in.', HTTP_STATUS.UNAUTHORIZED);
    }
    // 3. Call Service
    const result = await authService.refreshTokenService(incomingRefreshToken);
    sendSuccessResponse(res, result, HTTP_STATUS.OK);
});

export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken || req.headers.authorization?.split(' ')[1];
    if (refreshToken) {
        await authService.logoutService(req.user._id, refreshToken);
    }

    // Clear Cookie
    res.clearCookie('refreshToken', cookieOptions);
    sendSuccessResponse(res, { message: 'Logged out successfully' }, HTTP_STATUS.OK);
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPasswordService(req.body.email);
    sendSuccessResponse(res, result, HTTP_STATUS.OK);
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    const result = await authService.resetPasswordService(token, newPassword);

    sendSuccessResponse(res, result, HTTP_STATUS.OK);
});

export const googleLogin = asyncHandler(async (req, res) => {
    const { access_token } = req.body;

    const { user, accessToken, refreshToken } = await authService.googleLoginService(access_token);

    // Set Refresh Token in Cookie (Exactly like standard login)
    res.cookie('refreshToken', refreshToken, cookieOptions);

    sendSuccessResponse(res, { user, accessToken }, HTTP_STATUS.OK);
});