import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import * as notificationValidation from './validation/notification.validation.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// Apply auth middleware to ALL routes in this file
router.use(protect);

// GET /api/v1/notifications
router.get(
    '/', 
    notificationController.getNotifications
);

// PATCH /api/v1/notifications/mark-all
// ⚠️ IMPORTANT: Put this BEFORE the /:id route so Express doesn't think "mark-all" is an ID!
router.patch(
    '/mark-all', 
    notificationController.readAllNotifications
);

// PATCH /api/v1/notifications/:id/read
router.patch(
    '/:id/read', 
    validate(notificationValidation.readNotificationSchema),
    notificationController.readNotification
);

router.post('/simulate', notificationController.simulateNotification);

export default router;