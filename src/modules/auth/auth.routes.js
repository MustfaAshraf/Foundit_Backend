import { Router } from 'express';
import * as authController from './auth.controller.js';
import * as authValidation from './validation/auth.validation.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = Router();

// Public Routes
router.post(
    '/register',
    validate(authValidation.registerSchema),
    authController.register
);

router.post(
    '/login',
    authLimiter,
    validate(authValidation.loginSchema),
    authController.login
);

router.get(
    '/refresh-token',
    // We validate that the cookie exists before calling controller
    validate(authValidation.refreshTokenSchema),
    authController.refreshAccessToken
);

router.post(
    '/forgot-password',
    authLimiter,
    validate(authValidation.forgotPasswordSchema),
    authController.forgotPassword
);

router.patch(
    '/reset-password/:token',
    validate(authValidation.resetPasswordSchema),
    authController.resetPassword
);

// Protected Routes (Require Login)
router.post(
    '/logout',
    protect,
    authController.logout
);

router.post(
    '/google',
    authController.googleLogin
);

export default router;