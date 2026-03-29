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

// @desc    Update report status (Approve/Reject/Resolve)
// @route   PATCH /api/v1/admin/report/:id/status
// @access  Private/Admin
export const updateReportStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const report = await adminService.updateReportStatusService(id, status);
    
    return sendSuccessResponse(res, report);
});
