import mongoose from "mongoose";
import { config } from "../config/env.js"; // Import your new config
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
 
export const dbConnection = async () => {
    try {
        await mongoose.connect(config.MONGODB_URI); // Uses the smart selection
        console.log(`✅ Database Connected`);
    } catch (error) {
        console.error('❌ Database Connection Failed:', error);
        process.exit(1); 
    }
};  