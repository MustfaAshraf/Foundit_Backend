import * as adminService from './services/admin.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccessResponse } from '../../utils/appResponse.js';

// @desc    Get moderation statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
export const getAdminStats = asyncHandler(async (req, res) => {
    const stats = await adminService.getAdminStatsService();
    return sendSuccessResponse(res, stats);
});
