import { Server } from 'socket.io';
import { config } from './env.js';

let io;

/**
 * Initialize Socket.io (Call this in index.js)
 * @param {Object} httpServer - The Node.js HTTP server
 */
export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: config.FRONTEND_URL, // Allow connection from your React App
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 60000, // Close connection if no ping for 60s
    });

    io.on('connection', (socket) => {
        console.log(`🔌 New Client Connected: ${socket.id}`);

        // 1. Join User Room (For private notifications like "Match Found")
        // Frontend emits: socket.emit('setup', userId)
        socket.on('setup', (userData) => {
            socket.join(userData._id);
            socket.emit('connected');
        });

        // 2. Join Chat Room
        socket.on('join_chat', (room) => {
            socket.join(room);
            console.log(`User joined Room: ${room}`);
        });

        // 3. Typing Indicators
        socket.on('typing', (room) => socket.in(room).emit('typing'));
        socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing'));

        socket.on('disconnect', () => {
            console.log("❌ User Disconnected");
        });
    });

    return io;
};

/**
 * Get the IO instance globally (Use this in Controllers/Services)
 */
export const getIO = () => {
    if (!io) {
        throw new Error("❌ Socket.io not initialized!");
    }
    return io;
};