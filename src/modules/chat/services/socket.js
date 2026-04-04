import { Server } from "socket.io";
import { verifyToken } from "../../../utils/jwt.js";
import { addUser, removeUser, getOnlineUsers } from "./onlineUsers.js";
import { registerIo, emitToUser } from "./socketEmitter.js";
import { User } from "../../../DB/models/user.model.js";
import { Message } from "../../../DB/models/message.model.js";
import { Conversation } from "../../../DB/models/conversation.model.js";

export const initSocket = (server) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",
    process.env.ADMIN_URL || "http://localhost:4000",
    "http://localhost:5174"
  ]; 

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
  });

  registerIo(io);

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized: no token"));

    try {
      // Uses Foundit_Backend's verifyToken from utils/jwt.js
      const decoded = verifyToken(token);
      
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next(new Error("User no longer exists"));
      
      socket.userId = decoded.id; // standard string ID
      next();
    } catch {
      next(new Error("Unauthorized: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected — userId: ${socket.userId} | socketId: ${socket.id}`);

    addUser(socket.userId, socket.id);
    io.emit("onlineUsers", getOnlineUsers());

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected — userId: ${socket.userId} | socketId: ${socket.id}`);
      removeUser(socket.userId, socket.id);
      io.emit("onlineUsers", getOnlineUsers());
    });

    socket.on("typing", ({ conversationId, receiverId }) => {
      emitToUser(receiverId, "typing", { conversationId, fromUserId: socket.userId });
    });

    socket.on("stopTyping", ({ conversationId, receiverId }) => {
      emitToUser(receiverId, "stopTyping", { conversationId, fromUserId: socket.userId });
    });

    socket.on("markAsSeen", async ({ conversationId }) => {
      try {
        const userId = socket.userId;
        
        // 1. Find conversation to get the other participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // 2. Update all messages not sent by 'me' and not yet read by 'me'
        await Message.updateMany(
          { conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );

        // 3. Notify the other participant that their messages were seen
        const otherParticipant = conversation.participants.find(p => p.toString() !== userId.toString());
        if (otherParticipant) {
          emitToUser(otherParticipant.toString(), "messagesSeen", { conversationId, seenBy: userId });
        }
      } catch (error) {
        console.error("[Socket] markAsSeen error:", error);
      }
    });
  });
};
