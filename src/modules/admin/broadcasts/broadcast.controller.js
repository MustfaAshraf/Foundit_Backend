import * as broadcastService from './broadcast.service.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { sendSuccessResponse } from '../../../utils/appResponse.js';
import { HTTP_STATUS } from '../../../config/constants.js';

// POST /api/v1/admin/broadcasts
export const sendBroadcast = asyncHandler(async (req, res) => {
    const { category, title, message } = req.body;
    const result = await broadcastService.sendBroadcastService({ category, title, message });
    sendSuccessResponse(res, result, HTTP_STATUS.OK);
});

// GET /api/v1/admin/broadcasts
export const getBroadcastHistory = asyncHandler(async (req, res) => {
    const history = await broadcastService.getBroadcastHistoryService(req.query);
    sendSuccessResponse(res, history, HTTP_STATUS.OK);
});
