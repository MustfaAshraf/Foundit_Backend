import { Router } from 'express';
import * as dashboardController from './dashboard.controller.js';
import { protect, restrictTo } from '../../../middlewares/auth.middleware.js';

const router = Router();

// Endpoint for Dashboard Statistics
// We are securing it to make sure only 'admin' or 'superAdmin' can access it
router.get(
    '/stats',
    protect,
    restrictTo('super_admin', 'community_admin'), 
    dashboardController.getDashboardStats
);

export default router;
