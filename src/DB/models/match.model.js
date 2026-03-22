import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    lostReport: {
        report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
        isAccepted: { type: Boolean, default: false },
        acceptedAt: Date
    },
    foundReport: {
        report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
        isAccepted: { type: Boolean, default: false },
        acceptedAt: Date
    },

    score: {
        type: Number,
        required: true
    }, // e.g., 85 (%)

    status: {
        type: String,
        enum: ['PROPOSED', 'ACCEPTED', 'REJECTED', 'VERIFIED'],
        default: 'PROPOSED'
    }
}, {
    timestamps: true
});

export const Match = mongoose.model('Match', matchSchema);