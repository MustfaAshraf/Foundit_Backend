import { User } from '../DB/models/user.model.js';
import { verifyToken } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createForbiddenError, createUnauthorizedError } from '../utils/appError.js';

export const protect = asyncHandler(async (req, res, next) => {
    // 1. Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(createUnauthorizedError('You are not logged in! Please log in to get access.'));
    }

    // 2. Verify Token
    const decoded = verifyToken(token); // Will throw error if invalid/expired

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(createUnauthorizedError('The user belonging to this token no longer exists.'));
    }

    // 4. Check if user changed password after the token was issued
    if (currentUser.passwordChangedAt) {
        const changedTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);
        if (decoded.iat < changedTimestamp) {
            return next(createUnauthorizedError('User recently changed password! Please log in again.'));
        }
    }

    // 5. Check if user is banned
    if (currentUser.status === 'banned') {
        return next(createForbiddenError('Your account has been banned. Please contact support.'));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
});

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'community_admin']. role = 'user'
        if (!roles.includes(req.user.role)) {
            return next(createForbiddenError('You do not have permission to perform this action'));
        }
        next();
    };
};