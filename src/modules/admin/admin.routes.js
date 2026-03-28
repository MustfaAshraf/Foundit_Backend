import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { protect, restrictTo } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * ADMIN & MODERATOR PROTECTION
 * All routes in this file require authentication and specific admin roles.
 */
router.use(protect, restrictTo('super_admin', 'community_admin'));

// --- Moderation Endpoints ---

// @desc    Get dashboard metrics (counts)
router.get('/stats', adminController.getAdminStats);

export default router;
