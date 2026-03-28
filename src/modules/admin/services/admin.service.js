import { Report } from '../../../DB/models/report.model.js';
import { sendNotification } from '../../notification/services/notification.service.js';
import { createBadRequestError, createNotFoundError } from '../../../utils/appError.js';

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
