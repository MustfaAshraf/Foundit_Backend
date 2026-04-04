import { Notification } from '../../../DB/models/notification.model.js';
import { createNotFoundError } from '../../../utils/appError.js';
import { ApiFeatures } from '../../../utils/apiFeatures.js';
import { emitToUser } from '../../chat/services/socketEmitter.js';

// ==========================
// 1. GET ALL NOTIFICATIONS
// ==========================
export const getMyNotificationsService = async (userId, query) => {
    
    // 2. Use ApiFeatures to handle everything automatically!
    const features = new ApiFeatures(Notification.find({ recipient: userId }), query)
        .filter()
        .sort()          // Defaults to -createdAt (Newest first)
        .limitFields()
        .paginate();     // Automatically handles ?page=1&limit=10

    // Execute the built query
    const notifications = await features.mongooseQuery;

    // 3. Get total count for pagination logic
    const totalNotifications = await Notification.countDocuments({ recipient: userId });
    
    // Get unread count for the Bell Icon
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

    // 4. Calculate 'hasMore' dynamically
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const hasMore = totalNotifications > (page * limit);

    return { 
        notifications, 
        unreadCount, 
        hasMore, 
        currentPage: page 
    };
};

// ==========================
// 2. MARK ONE AS READ
// ==========================
export const markAsReadService = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId }, // Ensure user owns it
        { isRead: true },
        { new: true } // Return updated document
    );

    if (!notification) {
        throw createNotFoundError('Notification not found or unauthorized');
    }

    return notification;
};

// ==========================
// 3. MARK ALL AS READ
// ==========================
export const markAllAsReadService = async (userId) => {
    await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
    );

    return { message: 'All notifications marked as read' };
};

// ==========================
// 5. GET UNREAD COUNT
// ==========================
export const getUnreadCountService = async (userId) => {
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });
    return { unreadCount };
};

// ==========================
// 6. THE INTERNAL HELPER (For other modules to use)
// ==========================
export const sendNotification = async ({ recipientId, category, title, message, data }) => {
    try {
        console.log(`[Notification] Creating notification for user ${recipientId}: ${title}`);

        // A. Save to MongoDB
        const newNotification = await Notification.create({
            recipient: recipientId,
            category,
            title,
            message,
            data
        });

        console.log(`[Notification] ✅ Saved to DB with ID: ${newNotification._id} for user ${recipientId}`);

        // B. Emit via Socket.io using the new Chat Infrastructure!
        emitToUser(recipientId.toString(), 'new_notification', newNotification);
        console.log(`[Notification] 📡 Emitted socket event to user ${recipientId}`);

        return newNotification;
    } catch (error) {
        console.error(`[Notification] ❌ Failed to send notification to user ${recipientId}:`, error.message);
        throw error; // Re-throw so Promise.allSettled catches it
    }
};