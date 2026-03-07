import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    category: {
        type: String,
        enum: ['MATCH', 'MESSAGE', 'ALERT', 'SYSTEM'],
        required: true
    },

    title: String,
    message: String,

    // Navigation Payload
    data: {
        reportId: mongoose.Schema.Types.ObjectId,
        conversationId: mongoose.Schema.Types.ObjectId
    },

    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Notification = mongoose.model('Notification', notificationSchema);