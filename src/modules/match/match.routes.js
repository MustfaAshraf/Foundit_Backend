import { Router } from 'express';
import * as matchController from './match.controller.js';
import { protect, restrictTo } from './../../middlewares/auth.middleware.js';

const router = Router();
// 1. Apply Authentication to ALL match routes
router.use(protect);
// Public Routes
router.post(
    '/:reportId', 
    matchController.findMatches
);

router.patch(
    '/accept/:matchId', restrictTo('user'),
    matchController.acceptMatch
);

router.patch(
    '/reject/:matchId', restrictTo('user'),
    matchController.rejectMatch
);

router.get('/my-matches',restrictTo('user'), matchController.getUserMatches);

router.get(
    '/admin/all', 
   restrictTo('super_admin', 'community-admin'), 
    matchController.getAllMatches
);
export default router;