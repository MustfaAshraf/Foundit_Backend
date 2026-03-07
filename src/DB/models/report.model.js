import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    // --- Basic Info ---
    title: {
        type: String,
        required: true,
        index: 'text'
    },
    description: { type: String },
    type: {
        type: String,
        enum: ['LOST', 'FOUND'],
        required: true
    },

    // --- Structured Data (For Matching Algorithm) ---
    category: {
        type: String,
        required: true,
        enum: ['Electronics', 'Wallets', 'Pets', 'Documents', 'Keys', 'Other']
    },
    color: {
        type: String,
        lowercase: true
    },
    brand: {
        type: String,
        lowercase: true
    },
    tags: [{ type: String }], // ["iphone", "black", "pro"]

    // --- Location (GeoJSON) ---
    locationName: String,
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [Number] // [Long, Lat]
    },

    // --- Status & Media ---
    images: [{ type: String }],
    dateHappened: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'PENDING', 'MATCHED', 'RESOLVED'],
        default: 'OPEN'
    },
    completionPercent: {
        type: Number,
        default: 100
    },

    // --- Relationships ---
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    }
}, {
    timestamps: true
});

// Indexes for Algorithm Performance
reportSchema.index({ location: '2dsphere' }); // Geo-search
reportSchema.index({ tags: 'text', description: 'text' }); // Text search

export const Report = mongoose.model('Report', reportSchema);