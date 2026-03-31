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
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const stats = await Transaction.aggregate([
        {
            $facet: {
                currentMonth: [
                    { 
                        $match: { 
                            status: 'SUCCESS',
                            createdAt: { $gte: startOfCurrentMonth }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$amount' },
                            count: { $sum: 1 }
                        }
                    }
                ],
                previousMonth: [
                    { 
                        $match: { 
                            status: 'SUCCESS',
                            createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$amount' }
                        }
                    }
                ],
                allTime: [
                    { $match: { status: 'SUCCESS' } },
                    {
                        $group: {
                            _id: null,
                            totalRevenue: { $sum: '$amount' },
                            totalTransactions: { $sum: 1 }
                        }
                    }
                ]
            }
        }
    ]);

    const currentMonthData = stats[0].currentMonth[0] || { totalRevenue: 0, count: 0 };
    const previousMonthData = stats[0].previousMonth[0] || { totalRevenue: 0 };
    const allTimeData = stats[0].allTime[0] || { totalRevenue: 0, totalTransactions: 0 };

    // Calculate Growth Percentage
    let revenueGrowthPercentage = 0;
    if (previousMonthData.totalRevenue > 0) {
        revenueGrowthPercentage = ((currentMonthData.totalRevenue - previousMonthData.totalRevenue) / previousMonthData.totalRevenue) * 100;
    } else if (currentMonthData.totalRevenue > 0) {
        revenueGrowthPercentage = 100;
    }

    // Daily average based on current month
    const daysInMonth = now.getDate();
    const dailyAverage = (currentMonthData.count / daysInMonth).toFixed(1);

    return {
        totalRevenue: allTimeData.totalRevenue,
        totalRevenueThisMonth: currentMonthData.totalRevenue,
        revenueGrowthPercentage: Math.round(revenueGrowthPercentage),
        successfulTransactionsCount: allTimeData.totalTransactions,
        currentMonthTransactionsCount: currentMonthData.count,
        dailyAverage: Number(dailyAverage)
    };
};