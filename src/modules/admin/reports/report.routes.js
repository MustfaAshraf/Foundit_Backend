import { Router } from 'express';
import * as adminController from './report.controller.js';
import { protect, restrictTo } from '../../../middlewares/auth.middleware.js';

const router = Router();

/**
 * ADMIN & MODERATOR PROTECTION
 * All routes in this file require authentication and specific admin roles.
 */
router.use(protect, restrictTo('super_admin', 'community_admin'));

// --- Moderation Endpoints ---

// @desc    Get all reports (with pagination/filtering)
router.get('/', adminController.getAllReports);

// @desc    Get dashboard metrics (counts)
router.get('/stats', adminController.getAdminStats);

// @desc    Moderate a report (Update status & notify)
router.patch('/report/:id/status', adminController.updateReportStatus);

export default router;
