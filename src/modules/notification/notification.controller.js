import * as notificationService from './services/notification.service.js'
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccessResponse } from '../../utils/appResponse.js';
import { HTTP_STATUS } from '../../config/constants.js';

export const getNotifications = asyncHandler(async (req, res) => {
    const result = await notificationService.getMyNotificationsService(req.user._id, req.query);
    sendSuccessResponse(res, result, HTTP_STATUS.OK);
});

export const readNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await notificationService.markAsReadService(id, req.user._id);
    sendSuccessResponse(res, result, HTTP_STATUS.OK);
});

export const readAllNotifications = asyncHandler(async (req, res) => {
    const result = await notificationService.markAllAsReadService(req.user._id);
    sendSuccessResponse(res, result, HTTP_STATUS.OK);
});

// --- SIMULATION ENDPOINT ---
export const simulateNotification = asyncHandler(async (req, res) => {
    // Call the helper without the invalid matchId string
    const newNotif = await notificationService.sendNotification({
        recipientId: req.user._id,
        category: 'MATCH',
        title: 'Alert: Perfect Match! 🎉',
        message: 'We found an item that looks exactly like what you lost.'
    });

    sendSuccessResponse(res, newNotif, HTTP_STATUS.OK);
});