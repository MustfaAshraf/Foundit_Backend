import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }, // "NTI Smart Village"
    domain: {
        type: String,
        unique: true
    }, // "@nti.sci.eg"
    type: {
        type: String,
        enum: ['University', 'Compound', 'Company'],
        required: true
    },
    logo: String,

    // --- Geo-Fencing ---
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [Number] // [Long, Lat]
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
}, { timestamps: true });

export const Community = mongoose.model('Community', communitySchema);