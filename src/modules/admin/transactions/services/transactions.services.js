import { Transaction } from '../../../../DB/models/transaction.model.js';

export const fetchAllTransactions = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const transactions = await Transaction.find()
        .populate('user', 'name email avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

    const totalCount = await Transaction.countDocuments();
    return { transactions, totalCount };
};

export const fetchTransactionStats = async () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentDayOfMonth = now.getDate();

    const stats = await Transaction.aggregate([
        {
            $facet: {
                currentMonth: [
                    {
                        $match: {
                            status: 'SUCCESS',
                            createdAt: { $gte: currentMonthStart }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            revenue: { $sum: '$amount' },
                            count: { $sum: 1 }
                        }
                    }
                ],
                lastMonth: [
                    {
                        $match: {
                            status: 'SUCCESS',
                            createdAt: { $gte: lastMonthStart, $lt: currentMonthStart }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            revenue: { $sum: '$amount' }
                        }
                    }
                ],
                allTime: [
                    { $match: { status: 'SUCCESS' } },
                    {
                        $group: {
                            _id: null,
                            totalTransactions: { $sum: 1 }
                        }
                    }
                ]
            }
        }
    ]);

    const currentMonth = stats[0].currentMonth[0] || { revenue: 0, count: 0 };
    const lastMonth = stats[0].lastMonth[0] || { revenue: 0 };
    const allTime = stats[0].allTime[0] || { totalTransactions: 0 };

    const revenueGrowthPercentage = lastMonth.revenue > 0 
        ? Math.round(((currentMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100)
        : currentMonth.revenue > 0 ? 100 : 0;

    const dailyAverage = currentDayOfMonth > 0 
        ? (currentMonth.count / currentDayOfMonth).toFixed(1)
        : 0;

    return {
        totalRevenueThisMonth: currentMonth.revenue,
        revenueGrowthPercentage,
        successfulTransactionsCount: allTime.totalTransactions,
        currentMonthTransactionsCount: currentMonth.count,
        dailyAverage: parseFloat(dailyAverage)
    };
};