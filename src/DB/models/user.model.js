import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // --- Identity ---
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        select: false
    }, // Hashed
    avatar: {
        url: String,
        publicId: String,
    },
    role: {
        type: String,
        enum: ['user', 'community_admin', 'super_admin'],
        default: 'user'
    },

    // --- SaaS & Access ---
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: null
    },
    plan: {
        type: String,
        enum: ['Free', 'Premium'],
        default: 'Free'
    },
    credits: {
        type: Number,
        default: 3
    }, // Monthly quota

    // --- Gamification (Trust System) ---
    trustScore: {
        type: Number,
        default: 100
    },
    activityScore: {
        type: Number,
        default: 0
    },
    badges: [{ type: String }], // e.g. ["Trusted Finder"]

    // --- Auth & Security ---
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String, // We will store it encrypted/hashed
        select: false
    },
    otpExpires: {
        type: Date,
        select: false
    },
    status: {
        type: String,
        enum: ["active", "banned"],
        default: "active"
    },
    socialProvider: {
        type: String,
        enum: ['google', 'facebook', 'email'],
        default: 'email'
    },
    refreshToken: [
        {
            token: String,
            expireAt: Date
        },
    ],
    socialId: String,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLoginAt: Date
}, {
    timestamps: true
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);