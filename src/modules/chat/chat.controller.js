import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccessResponse } from "../../utils/appResponse.js";
import * as chatService from "./services/chat.service.js";

// @route   POST /api/v1/chat/conversations
export const createConversation = asyncHandler(async (req, res, next) => {
  const conversation = await chatService.createConversationService(req.user._id, req.body.userB);
  
  return sendSuccessResponse(res, conversation, 201);
});

// @route   GET /api/v1/chat/conversations
export const getUserConversations = asyncHandler(async (req, res, next) => {
  const conversations = await chatService.getUserConversationsService(req.user._id);

  return sendSuccessResponse(res, conversations, 200);
});

// @route   POST /api/v1/chat/messages
export const sendMessage = asyncHandler(async (req, res, next) => {
  const { conversationId, content } = req.body;
  const files = req.files || [];
  const message = await chatService.sendMessageService(req.user._id, conversationId, content, files);

  return sendSuccessResponse(res, message, 201);
});

// @route   GET /api/v1/chat/messages/:id (id = conversationId)
export const getConversationMessages = asyncHandler(async (req, res, next) => {
  const messages = await chatService.getConversationMessagesService(req.user._id, req.params.id, req.query);

  return sendSuccessResponse(res, messages, 200);
});
