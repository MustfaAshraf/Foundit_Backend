import { Router } from 'express';
import { sendBroadcast, getBroadcastHistory } from './broadcast.controller.js';
import { protect, restrictTo } from '../../../middlewares/auth.middleware.js';

const router = Router();

// All broadcast routes are admin-only
router.use(protect, restrictTo('super_admin'));

// GET  /api/v1/admin/broadcasts  — broadcast history
router.get('/', getBroadcastHistory);

// POST /api/v1/admin/broadcasts  — send a new broadcast
router.post('/', sendBroadcast);

export default router;
