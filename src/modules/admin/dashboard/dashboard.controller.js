import { Report } from '../../../DB/models/report.model.js';
import { User } from '../../../DB/models/user.model.js';
import { Transaction } from '../../../DB/models/transaction.model.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (req, res, next) => {
    // 1. Basic Counts
    const [totalUsers, activeReports, resolvedCases, matchedCases, rejectedCases] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        Report.countDocuments({ status: 'OPEN' }),
        Report.countDocuments({ status: 'RESOLVED' }),
        Report.countDocuments({ status: 'MATCHED' }),
        Report.countDocuments({ status: 'REJECTED' })
    ]);

    // 2. Total Revenue (from SUCCESSful transactions)
    const totalRevenueResult = await Transaction.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // 3. Reports By Category (For Charts)
    const getCategoryAgg = (dateMatch) => [
        { $match: dateMatch },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $project: { category: "$_id", count: 1, _id: 0 } },
        { $sort: { count: -1 } } // Sort by count descending
    ];

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [reportsByCategory7D, reportsByCategory30D, reportsByCategoryAll] = await Promise.all([
        Report.aggregate(getCategoryAgg({ createdAt: { $gte: sevenDaysAgo } })),
        Report.aggregate(getCategoryAgg({ createdAt: { $gte: thirtyDaysAgo } })),
        Report.aggregate(getCategoryAgg({}))
    ]);

    res.status(200).json({
        success: true,
        data: {
            summary: {
                totalUsers,
                activeReports,
                resolvedCases,
                totalRevenue,
                matchedCases,
                rejectedCases
            },
            charts: {
                reportsByCategory: {
                    last7Days: reportsByCategory7D,
                    last30Days: reportsByCategory30D,
                    allTime: reportsByCategoryAll
                }
            }
        }
    });
});
