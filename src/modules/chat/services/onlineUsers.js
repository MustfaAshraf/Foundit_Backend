// In-memory map to track online users: Map <userId, Set<socket.id>>
const onlineUsers = new Map();

export const addUser = (userId, socketId) => {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socketId);
};

export const removeUser = (userId, socketId) => {
    if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socketId);
        if (onlineUsers.get(userId).size === 0) {
            onlineUsers.delete(userId);
        }
    }
};

export const getUser = (userId) => {
    return onlineUsers.get(userId);
};

export const isOnline = (userId) => {
    return onlineUsers.has(userId);
};

export const getOnlineUsers = () => {
    return Array.from(onlineUsers.keys());
};
