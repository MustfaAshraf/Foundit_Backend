import { User } from '../../../DB/models/user.model.js';
import { sendNotification } from '../../notification/services/notification.service.js';
import { emitToUser } from '../../chat/services/socketEmitter.js';
import { Notification } from '../../../DB/models/notification.model.js';

// ======================================
// SEND BROADCAST TO ALL USERS (EXCEPT ADMINS)
// ======================================
export const sendBroadcastService = async ({ category, title, message }) => {
    // 1. Get all active (non-banned) regular users only (exclude admins)
    const users = await User.find({ 
        status: { $ne: 'banned' },
        role: 'user'  // Only send to regular users, not admins
    }).select('_id role email');

    console.log(`[Broadcast] Found ${users.length} eligible users to notify:`);
    users.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
    });

    if (!users.length) {
        return { sent: 0, message: 'No active users to notify.', failed: 0, total: 0 };
    }

    // 2. Fire notifications in parallel using the existing sendNotification helper
    //    (which persists to DB + emits via socket if the user is online)
    console.log(`[Broadcast] Starting to send notifications to ${users.length} users...`);
    
    const results = await Promise.allSettled(
        users.map((user) => {
            console.log(`[Broadcast] Processing user: ${user.email} (${user.role}) - ID: ${user._id}`);
            return sendNotification({
                recipientId: user._id,
                category,   // 'ALERT' | 'SYSTEM' | 'MATCH' | 'MESSAGE'
                title,
                message,
            });
        })
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed    = results.filter((r) => r.status === 'rejected').length;

    console.log(`[Broadcast] Results: ${succeeded} succeeded, ${failed} failed`);

    // Log any failures
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`[Broadcast] Failed to send to user ${users[index].email}:`, result.reason);
        } else {
            console.log(`[Broadcast] ✅ Successfully sent to user ${users[index].email}`);
        }
    });

    // 3. Also emit a specific 'broadcast' event to all connected users
    //    This is for real-time UI updates in the admin dashboard
    for (const user of users) {
        try {
            emitToUser(user._id.toString(), 'broadcast', {
                category,
                title,
                message,
                sentAt: new Date(),
            });
        } catch (error) {
            console.error(`[Broadcast] Failed to emit to user ${user._id}:`, error.message);
        }
    }

    return {
        sent: succeeded,
        failed,
        total: users.length,
        message: `Broadcast delivered to ${succeeded} / ${users.length} users.`,
    };
};

// ======================================
// GET BROADCAST HISTORY
// ======================================
// We simulate "broadcast history" by fetching SYSTEM / ALERT notifications
// that share the same title + message (sent as bulk).
// A real-world app would have a Broadcast model; here we return recent distinct
// broadcasts stored in the Notification collection.
export const getBroadcastHistoryService = async (query = {}) => {
    const limit = parseInt(query.limit) || 100; // Default to 100, configurable via query
    
    // Aggregate to find unique (title, message, category) combos,
    // keeping the latest createdAt and the count of recipients.
    const history = await Notification.aggregate([
        {
            $match: {
                category: { $in: ['ALERT', 'SYSTEM', 'MESSAGE', 'MATCH'] },
            },
        },
        {
            $group: {
                _id: { title: '$title', message: '$message', category: '$category' },
                sentAt: { $max: '$createdAt' },
                recipientCount: { $sum: 1 },
            },
        },
        { $sort: { sentAt: -1 } },
        { $limit: limit }, // Now configurable instead of fixed at 50
        {
            $project: {
                _id: 0,
                title: '$_id.title',
                message: '$_id.message',
                category: '$_id.category',
                sentAt: 1,
                recipientCount: 1,
            },
        },
    ]);

    return history;
};
