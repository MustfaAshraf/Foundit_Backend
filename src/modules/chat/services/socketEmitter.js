let _io;

export const registerIo = (ioInstance) => {
    _io = ioInstance;
};

// emitToUser logic requires the onlineUsers map to know target socketIds
import { isOnline, getUser } from "./onlineUsers.js";

export const emitToUser = (userId, event, data) => {
    if (!_io || !userId) return;

    const userIdStr = userId.toString();

    if (isOnline(userIdStr)) {
        getUser(userIdStr).forEach((socketId) => {
            _io.to(socketId).emit(event, data);
        });
    }
};
