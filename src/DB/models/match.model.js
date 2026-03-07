import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
    lostReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: true
    },
    foundReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: true
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