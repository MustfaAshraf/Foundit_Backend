import mongoose from 'mongoose';
import { Community } from '../models/community.model.js';
import communities from './communities.json' with { type: 'json' };
import { config } from '../../config/env.js';

const seedCommunities = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);

    await Community.deleteMany();
    await Community.insertMany(communities);

    console.log("✅ Communities seeded");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedCommunities();