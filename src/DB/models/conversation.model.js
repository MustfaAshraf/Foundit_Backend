import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    participants: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    
    // Linked to the specific item being discussed
    relatedReport: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Report' 
    },
    
    lastMessage: String,
    lastMessageAt: { 
        type: Date, 
        default: Date.now()
    },
    isSupport: { 
        type: Boolean, 
        default: false 
    },
    assignedTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);