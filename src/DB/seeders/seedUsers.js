import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import users from './users.json' with { type: 'json' };
import { config } from '../../config/env.js';

const seedUsers = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);

    await User.deleteMany();
    await User.insertMany(users);

    console.log("✅ Users seeded");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedUsers();