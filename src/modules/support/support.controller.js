import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccessResponse } from "../../utils/appResponse.js";
import { User } from "../../DB/models/user.model.js";
import { Conversation } from "../../DB/models/conversation.model.js";
import { Message } from "../../DB/models/message.model.js";
import { createNotFoundError } from "../../utils/appError.js";
import { emitToUser } from "../chat/services/socketEmitter.js";
import { sendNotification } from "../notification/services/notification.service.js";

/**
 * Open a new support ticket (Conversation).
 * If a conversation already exists between the user and support that is NOT yet assigned, it reuses it.
 * If it's a new ticket, it's created as "unassigned" (assignedTo: null).
 */
export const openSupportTicket = asyncHandler(async (req, res, next) => {
    const { message: content } = req.body;
    const userId = req.user._id;

    // 1. Check for an existing ACTIVE support conversation for this user
    let conversation = await Conversation.findOne({
        participants: userId,
        isSupport: true,
        isActive: true
    }).populate("assignedTo", "name email");

    if (!conversation) {
        // Create new UNASSIGNED support conversation
        conversation = await Conversation.create({
            participants: [userId],
            isSupport: true,
            assignedTo: null,
            isActive: true
        });
    }

    // 2. Create initial Message
    const newMessage = await Message.create({
        conversationId: conversation._id,
        sender: userId,
        content: content,
        readBy: [userId]
    });

    // 3. Update Conversation metadata
    conversation.lastMessage = content;
    conversation.lastMessageAt = newMessage.createdAt;
    await conversation.save();

    // 4. Emit Real-time notifications
    const populatedMessage = await newMessage.populate("sender", "name email profileImage");
    const isAssigned = !!conversation.assignedTo;
    
    // Notification Metadata helper
    const getConvMetadata = () => ({
        _id: conversation._id,
        isSupport: true,
        assignedTo: conversation.assignedTo,
        participants: conversation.participants
    });

    // Notify the User via Socket
    emitToUser(userId.toString(), "receiveMessage", {
        ...populatedMessage.toObject(),
        conversationId: getConvMetadata()
    });

    if (isAssigned) {
        // CASE A: Reusing an already assigned ticket -> ONLY notify the assigned Admin
        const adminId = conversation.assignedTo._id.toString();
        
        emitToUser(adminId, "receiveMessage", {
            ...populatedMessage.toObject(),
            conversationId: getConvMetadata()
        });

        sendNotification({
            recipientId: adminId,
            category: 'SUPPORT',
            title: 'Support Ticket Update',
            message: `${req.user.name} sent a new message in their support ticket.`,
            data: { conversationId: conversation._id.toString() }
        }).catch(err => console.error(`Failed to notify assigned admin ${adminId}:`, err.message));

    } else {
        // CASE B: Unassigned ticket -> Notify ALL Admins
        const admins = await User.find({ role: { $in: ['super_admin'] } }).select('_id');
        const adminIds = admins.map(a => a._id.toString());

        adminIds.forEach(adminId => {
            emitToUser(adminId, "receiveMessage", {
                ...populatedMessage.toObject(),
                conversationId: getConvMetadata()
            });

            sendNotification({
                recipientId: adminId,
                category: 'SUPPORT',
                title: 'New Support Ticket',
                message: `${req.user.name} sent a new support request: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                data: { conversationId: conversation._id.toString() }
            }).catch(err => console.error(`Failed to notify admin ${adminId}:`, err.message));
        });
    }

    // 5. Return the conversation
    const conversationData = await Conversation.findById(conversation._id).populate("participants", "name email profileImage");

    return sendSuccessResponse(res, {
        ...conversationData.toObject(),
        otherUser: conversation.assignedTo || null,
        isSupport: true
    }, 201);


});

/**
 * Claim an unassigned support ticket.
 * Only accessible by admins.
 */
export const claimTicket = asyncHandler(async (req, res, next) => {
    const { conversationId } = req.params;
    const adminId = req.user._id;

    // 1. Atomic update: only claim if assignedTo is still null
    const conversation = await Conversation.findOneAndUpdate(
        { 
            _id: conversationId, 
            isSupport: true, 
            assignedTo: null 
        },
        { 
            $set: { assignedTo: adminId },
            $addToSet: { participants: adminId } 
        },
        { new: true }
    ).populate("participants", "name email profileImage");

    if (!conversation) {
        return next(createNotFoundError("Ticket already claimed or not found."));
    }

    // 2. Emit socket event so other admins see it's claimed
    const admins = await User.find({ role: 'super_admin' }).select('_id');
    const adminIds = admins.map(a => a._id.toString());
    
    adminIds.forEach(id => {
        emitToUser(id, "ticketClaimed", {
            conversationId: conversation._id,
            assignedTo: {
                _id: adminId,
                name: req.user.name,
                email: req.user.email
            }
        });
    });

    // 3. Notify the user that their ticket was claimed
    // The user should be one of the participants who is NOT an admin or not this admin
    // In our design, participants[0] is usually the user who opened the ticket
    const userToNotify = conversation.participants.find(p => p._id.toString() !== adminId.toString());
    if (userToNotify) {
        sendNotification({
            recipientId: userToNotify._id,
            category: 'SUPPORT',
            title: 'Support Ticket Claimed',
            message: `Admin ${req.user.name} has joined your support request and will help you shortly.`,
            data: { conversationId: conversation._id.toString() }
        }).catch(err => console.error(`Failed to notify user ${userToNotify._id}:`, err.message));
    }

    return sendSuccessResponse(res, conversation, 200);
});

