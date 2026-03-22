import mongoose from 'mongoose';
import { config } from '../config/env.js'; // Import your new config

export const dbConnection = async () => {
    try {
        // await mongoose.connect(config.DB_MONGO_ATLAS); // Uses the smart selection
        await mongoose.connect(config.MONGODB_URI); // Uses the smart selection
        console.log(`✅ Database Connected`);
    } catch (error) {
        console.error('❌ Database Connection Failed:', error);
        process.exit(1);
    }
};