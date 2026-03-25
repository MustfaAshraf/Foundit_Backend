import mongoose from 'mongoose';
import {Report} from '../models/report.model.js';
import reports from './reports.json' with { type: 'json' };
import { config } from '../../config/env.js';
// 1. Load Environment Variables
// We point specifically to the .env file in your src folder

const seed = async () => {
    try {
        // 2. Database Connection
        const uri = config.MONGODB_URI;
        console.log("uri: ",uri);
        
        if (!uri) {
            console.error("❌ MONGODB_URI is undefined. Please check the path in dotenv.config()");
            process.exit(1);
        }

        console.log(`🔗 Connecting to: ${uri}...`);
        await mongoose.connect(uri);
        console.log("✅ Database connection established.");

        // 3. Clean and Seed
        // Since you are using Option A (foundit_test), this is safe!
        console.log("🗑️  Clearing existing test reports...");
        await Report.deleteMany(); 

        console.log(`🚀 Inserting ${reports.length} test reports...`);
        await Report.insertMany(reports,{ validateBeforeSave: false });

        console.log("✨ All reports seeded successfully!");
        
        // 4. Clean Shutdown
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding process failed:");
        console.error(error);
        process.exit(1);
    }
};

// Execute the function
seed();

