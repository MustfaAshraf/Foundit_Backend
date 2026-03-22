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


export default router;