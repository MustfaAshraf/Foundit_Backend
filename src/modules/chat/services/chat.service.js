import { Conversation } from '../../../DB/models/conversation.model.js';
import { Message } from '../../../DB/models/message.model.js';
import { User } from '../../../DB/models/user.model.js';
import { emitToUser } from './socketEmitter.js';
import { sendNotification } from '../../notification/services/notification.service.js';
import { createNotFoundError, createBadRequestError, createForbiddenError } from '../../../utils/appError.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.js';
import { ReputationService } from '../../user/services/reputation.service.js';

export const createConversationService = async (userAId, userBId) => {
    if (!userBId) {
        throw createBadRequestError("You must provide the target user's ID (userB).");
    }

    if (userAId.toString() === userBId.toString()) {
        throw createBadRequestError("You cannot create a conversation with yourself.");
    }

    const targetUserExists = await User.findById(userBId);
    if (!targetUserExists) {
        throw createNotFoundError("Target user not found.");
    }

    // Check if conversation already exists (one-to-one)
    let conversation = await Conversation.findOne({
        participants: { $all: [userAId, userBId], $size: 2 },
    });

    if (conversation) {
        return conversation;
    }

    // Create new conversation
    conversation = await Conversation.create({
        participants: [userAId, userBId],
    });

    return conversation;
};

export const getUserConversationsService = async (userId) => {
    const user = await User.findById(userId);
    const isAdmin = user?.role === 'super_admin';

    const query = { participants: userId };
    
    // If admin, also show all unassigned support tickets
    if (isAdmin) {
        query.$or = [
            { participants: userId },
            { isSupport: true, assignedTo: null }
        ];
        // Remove the top-level participants: userId filter if we are using $or
        delete query.participants;
    }

    const conversations = await Conversation.find(query)
        .populate("participants", "name email profileImage")
        .populate("assignedTo", "name email")
        .sort({ lastMessageAt: -1 })
        .lean();

    // Normalize shape
    return conversations.map((conv) => {
        const otherUser = conv.participants.find(
            (p) => p._id.toString() !== userId.toString()
        );

        return {
            _id: conv._id,
            otherUser: otherUser || (conv.participants.length > 0 ? conv.participants[0] : null),
            lastMessage: conv.lastMessage || "",
            updatedAt: conv.lastMessageAt || conv.createdAt,
            isSupport: conv.isSupport,
            assignedTo: conv.assignedTo,
        };
    });
};

export const sendMessageService = async (senderId, conversationId, content, files = []) => {
    if (!conversationId) {
        throw createBadRequestError("conversationId is required.");
    }
    if (!content && files.length === 0) {
        throw createBadRequestError("Message content or at least one attachment is required.");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw createNotFoundError("Conversation not found.");
    }

    // Ensure sender is a participant
    const isParticipant = conversation.participants.some(
        (p) => p.toString() === senderId.toString()
    );
    if (!isParticipant) {
        throw createForbiddenError("Forbidden.");
    }

    // Handle File Uploads
    const attachments = [];
    if (files && files.length > 0) {
        for (const file of files) {
            const { url } = await uploadToCloudinary(file.buffer, `chat/${conversationId}`);
            attachments.push(url);
        }
    }
    
    const message = await Message.create({
        conversationId: conversationId,
        sender: senderId,
        content: content || "",
        attachments,
        readBy: []
    });

    // Update conversation metadata
    conversation.lastMessage = content || (attachments.length > 0 ? "Sent an image" : "");
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const populatedMessage = await message.populate("sender", "name email profileImage");

    // Socket Emissions
    const receiverIdObj = conversation.participants.find(
        (p) => p.toString() !== senderId.toString()
    );
    const receiverId = receiverIdObj.toString();

    emitToUser(receiverId, "receiveMessage", populatedMessage.toJSON());
    emitToUser(senderId.toString(), "receiveMessage", populatedMessage.toJSON());

    // 🔔 Send Real-time Notification to the receiver
    sendNotification({
        recipientId: receiverId,
        category: 'MESSAGE',
        title: `New Message from ${populatedMessage.sender.name}`,
        message: content,
        data: { conversationId: conversationId.toString() }
    }).catch(err => console.error("Message Notification failed:", err.message));
    
    // 🎁 REPUTATION: Add chat activity point (with daily cap)
    await ReputationService.addChatActivity(senderId).catch(err => 
        console.error("Chat Reputation Error:", err.message)
    );

    return populatedMessage;
};

export const getConversationMessagesService = async (userId, conversationId, query) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw createNotFoundError("Conversation not found.");
    }

    const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) {
        throw createForbiddenError("Forbidden.");
    }

    const limit = parseInt(query.limit) || 10;
    const before = query.before;

    const filter = { conversationId: conversationId };
    if (before && before !== "undefined") {
        filter._id = { $lt: before };
    }

    // Handle Read Receipts
    const messagesToUpdate = await Message.find({
        conversationId: conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
    });

    if (messagesToUpdate.length > 0) {
        await Message.updateMany(
            { _id: { $in: messagesToUpdate.map(m => m._id) } },
            { $addToSet: { readBy: userId } }
        );

        const receiverIdObj = conversation.participants.find(
            (p) => p.toString() !== userId.toString()
        );
        emitToUser(receiverIdObj.toString(), "messagesSeen", { conversationId, seenBy: userId.toString() });
    }

    const messages = await Message.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("sender", "name email profileImage");

    return messages.reverse().map(m => ({
        _id: m._id,
        conversation: m.conversationId,
        content: m.content,
        attachments: m.attachments || [],
        sender: m.sender,
        createdAt: m.createdAt,
        seen: m.readBy && m.readBy.length > 0
    }));
};