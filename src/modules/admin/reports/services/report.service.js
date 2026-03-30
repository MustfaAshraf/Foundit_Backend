import { Report } from '../../../../DB/models/report.model.js';
import { sendNotification } from '../../../notification/services/notification.service.js';
import { createBadRequestError, createNotFoundError } from '../../../../utils/appError.js';
import { ApiFeatures } from '../../../../utils/apiFeatures.js';

/**
 * GET ALL REPORTS (ADMIN MODERATION VIEW)
 * Returns ALL reports regardless of status, with pagination, filtering, and search.
 */
export const getAllReportsService = async (query) => {
    // Build base query — no status filter so admins see everything
    const baseFilter = {};

    // Allow explicit status filtering via query string (e.g. ?status=OPEN)
    // but don't enforce one by default
    const apiFeatures = new ApiFeatures(Report.find(baseFilter), query)
        .filter()
        .search()
        .sort()
        .limitFields()
        .paginate();

    const reports = await apiFeatures.mongooseQuery.populate('user', 'name email avatar.url');

    // Total count query (with same filters but no pagination)
    const countFeatures = new ApiFeatures(Report.find(baseFilter), query).filter().search();
    const total = await countFeatures.mongooseQuery.countDocuments();

    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 10;
    const totalPages = Math.ceil(total / limit);

    return { reports, total, totalPages };
};

/**
 * GET ADMIN DASHBOARD STATS
 * Fetches counts for pending, resolved (last 24h), and rejected reports.
 */
export const getAdminStatsService = async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalReports, pendingReview, resolvedToday, resolvedTotal, matchedReports, rejectedCount] = await Promise.all([
        Report.countDocuments(),
        Report.countDocuments({ status: 'OPEN' }),
        Report.countDocuments({
            status: 'RESOLVED',
            updatedAt: { $gte: twentyFourHoursAgo }
        }),
        Report.countDocuments({
            status: 'RESOLVED',
        }),
        Report.countDocuments({
            status: 'MATCHED',
        }),
        Report.countDocuments({
            status: 'MATCHED',
            updatedAt: { $gte: twentyFourHoursAgo }
        }),
        Report.countDocuments({ status: 'REJECTED' })
    ]);

    return {
        totalReports,
        pendingReview,
        resolvedToday,
        resolvedTotal,
        matchedReports,
        rejectedCount
    };
};

/**
 * UPDATE REPORT STATUS (MODERATION)
 * Updates report status and notifies user if rejected.
 */
export const updateReportStatusService = async (reportId, status) => {
    // 1. Validation
    const validStatuses = ['OPEN', 'REJECTED', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
        throw createBadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // 2. Update Report
    const report = await Report.findByIdAndUpdate(
        reportId,
        { status },
        { new: true }
    ).populate('user');

    if (!report) {
        throw createNotFoundError('Report not found');
    }

    // 3. System Notification on Rejection
    if (status === 'REJECTED') {
        try {
            await sendNotification({
                recipientId: report.user._id,
                category: 'REPORT_UPDATE',
                title: 'Report Rejected',
                message: `Your report "${report.title}" has been rejected by the moderation team.`,
                data: { reportId: report._id }
            });
        } catch (error) {
            console.error("Failed to send rejection notification:", error.message);
        }
    }

    return report;
};
