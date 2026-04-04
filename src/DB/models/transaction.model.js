import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'EGP'
    },

    type: {
        type: String,
        enum: ['CREDIT_REFILL', 'SUBSCRIPTION'],
        required: true
    },
    creditsAdded: {
        type: Number,
        default: 0
    },

    stripePaymentId: String,
    billingName: String,
    billingEmail: String,
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    }
}, {
    timestamps: true
});

export const Transaction = mongoose.model('Transaction', transactionSchema);