import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccessResponse } from "../../utils/appResponse.js";
import { User } from "../../DB/models/user.model.js";
import { Conversation } from "../../DB/models/conversation.model.js";
import { Message } from "../../DB/models/message.model.js";
import { createNotFoundError } from "../../utils/appError.js";
import { emitToUser } from "../chat/services/socketEmitter.js";

/**
 * Open a new support ticket (Conversation).
 * If a conversation already exists between the user and support that is NOT yet assigned, it reuses it.
 * If it's a new ticket, it's created as "unassigned" (assignedTo: null).
 */
export const openSupportTicket = asyncHandler(async (req, res, next) => {
    const { message: content } = req.body;
    const userId = req.user._id;

    // 1. Check for an existing UNASSIGNED support conversation for this user
    let conversation = await Conversation.findOne({
        participants: userId,
        isSupport: true,
        assignedTo: null
    });

    if (!conversation) {
        // Create new UNASSIGNED support conversation
        // Initially, just the user is a participant. Admins will join when they claim.
        conversation = await Conversation.create({
            participants: [userId],
            isSupport: true,
            assignedTo: null
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
    
    // Find all online admins to notify them of the new unassigned ticket
    const admins = await User.find({ role: { $in: ['super_admin'] } }).select('_id');
    const adminIds = admins.map(a => a._id.toString());
    
    // Notify the User
    emitToUser(userId.toString(), "receiveMessage", populatedMessage);
    
    // Notify all Admins (including those not yet in the conversation)
    adminIds.forEach(adminId => {
        emitToUser(adminId, "receiveMessage", {
            ...populatedMessage.toObject(),
            conversationId: {
                _id: conversation._id,
                isSupport: true,
                assignedTo: null,
                participants: conversation.participants
            }
        });
    });

    // 5. Return the conversation
    const conversationData = await Conversation.findById(conversation._id).populate("participants", "name email profileImage");

    return sendSuccessResponse(res, {
        ...conversationData.toObject(),
        conversationId: conversationData._id
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

    return sendSuccessResponse(res, conversation, 200);
});
