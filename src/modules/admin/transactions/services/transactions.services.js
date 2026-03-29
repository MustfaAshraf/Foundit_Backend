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
    const stats = await Transaction.aggregate([
        { $match: { status: 'SUCCESS' } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                totalTransactions: { $sum: 1 }
            }
        }
    ]);
    return stats[0] || { totalRevenue: 0, totalTransactions: 0 };
};