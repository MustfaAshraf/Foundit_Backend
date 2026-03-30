import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { uploadMultiple } from "../../middlewares/upload.middleware.js";
import {
  createConversation,
  getUserConversations,
  sendMessage,
  getConversationMessages
} from "./chat.controller.js";

const chatRouter = Router();

// All chat routes require authentication
chatRouter.use(protect);

// --- Conversations ---
chatRouter.post("/conversations", createConversation);
chatRouter.get("/conversations", getUserConversations);

// --- Messages ---
chatRouter.post("/messages", uploadMultiple("attachments", 5), sendMessage);
chatRouter.get("/messages/:id", getConversationMessages);

export default chatRouter;
