import express from 'express';
import * as communityController from './community.controller.js';
import { protect, restrictTo } from '../../auth/middlewares/auth.middleware.js';

const router = express.Router();

// حماية المسار: لازم يكون Super Admin
router.use(protect, restrictTo('super_admin'));

router.get('/', communityController.getAllCommunities);

export default router;