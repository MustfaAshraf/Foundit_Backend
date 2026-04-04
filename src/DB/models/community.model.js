import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Community name is required'],
        trim: true,
    },
    domain: {
        type: String,
        required: [true, 'Email domain is required'],
        unique: true,
        lowercase: true,
        trim: true
    }, //  @cu.edu.eg
    type: {
        type: String,
        enum: ['University', 'Compound', 'Company', 'Others'],
        required: true,
        default: 'Others'
    },
    plan: {
        type: String,
        enum: ['PRO', 'ENTERPRISE'],
        default: 'PRO'
    },
    logo: String,

    // --- Geo-Fencing (Structured for MongoDB GeoSpatial Queries) ---
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    radius: {
        type: Number,
        default: 1000
    }, // Safe zone range in meters

    subscriptionStatus: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

communitySchema.index({ location: '2dsphere' });

export const Community = mongoose.models.Community || mongoose.model('Community', communitySchema);