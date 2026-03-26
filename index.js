import dotenv from 'dotenv';
import http from 'http';
import express from 'express';
import { initSocket } from './src/modules/chat/services/socket.js';
import { dbConnection } from './src/DB/connection.js';
import { bootstrap } from './src/app.js';
import { config } from './src/config/env.js'; // Use your centralized config!

dotenv.config();

const app = express();

// Use port from your config file logic
const port = config.PORT;

// 1. Connect to DB
dbConnection();

// 2. Bootstrap App (Routes & Middlewares)
bootstrap(app);

// 3. Create Server & Socket
const server = http.createServer(app);
const io = initSocket(server);

// 4. Start Server (⚠️ CHANGED: app.listen -> server.listen)
server.listen(port, () => {
    console.log(`🚀 FoundIt Backend running on port ${port}`);
});