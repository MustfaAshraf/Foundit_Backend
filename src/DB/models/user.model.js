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
        default: 0
    },
    activityScore: {
        type: Number,
        default: 0
    },
    lastActivityRewardThreshold: {
        type: Number,
        default: 0
    },
    lastDailyLogin: {
        type: Date
    },
    badges: [{ type: String }], // e.g. ["Trusted Finder", "Verified Identity"]
    
    // --- Chat Activity Caps ---
    lastChatDate: { type: Date },
    dailyChatPoints: { type: Number, default: 0 },

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
        enum: ['google', 'email'],
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

// --- REPUTATION MIDDLEWARE ---
userSchema.pre('save', async function () {
    // Only handle critical, low-level state transitions here. 
    // Business rewards (credits) are moved to ReputationService.

    // 1. Badge Assignments (Fallback/Safety)
    if (this.trustScore >= 200 && !this.badges.includes("Trusted Finder")) {
        this.badges.push("Trusted Finder");
    }
    if (this.trustScore >= 500 && !this.badges.includes("Elite Guardian")) {
        this.badges.push("Elite Guardian");
    }

    // 2. Penalty Logic: Banning
    if (this.trustScore < -150 && this.status !== 'banned') {
        this.status = 'banned';
    }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);