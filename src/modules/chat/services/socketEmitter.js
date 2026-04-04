let _io;

export const registerIo = (ioInstance) => {
    _io = ioInstance;
};

// emitToUser logic requires the onlineUsers map to know target socketIds
import { isOnline, getUser } from "./onlineUsers.js";

export const emitToUser = (userId, event, data) => {
    if (!_io || !userId) {
        console.log(`[SocketEmitter] No IO instance or userId provided for ${event}`);
        return;
    }

    const userIdStr = userId.toString();
    console.log(`[SocketEmitter] Attempting to emit ${event} to user ${userIdStr}`);

    if (isOnline(userIdStr)) {
        const socketIds = getUser(userIdStr);
        console.log(`[SocketEmitter] ✅ User ${userIdStr} is online with ${socketIds.length} socket(s), emitting ${event}`);
        socketIds.forEach((socketId) => {
            _io.to(socketId).emit(event, data);
        });
    } else {
        console.log(`[SocketEmitter] ❌ User ${userIdStr} is NOT online, cannot emit ${event}`);
    }
};
