import { Router } from 'express';
import * as matchController from './match.controller.js';

const router = Router();

// Public Routes
router.get(
    '/:reportId', 
    matchController.findMatches
);


export default router;