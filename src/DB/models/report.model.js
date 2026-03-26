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
    subCategory: {
        type: String
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
    locationName: {
        type: String,
        required: true,
        trim: true,
        match: [
            /^[\w\u0600-\u06FF\s]+,\s*[\w\u0600-\u06FF\s]+(,\s*[\w\u0600-\u06FF\s]+)*$/,
            'Location must follow a standard format separated by commas (e.g., "City, District" or "City, District, Street")'
        ]
    },
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
        enum: ['OPEN', 'REJECTED', 'MATCHED', 'RESOLVED'],
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

// Location Format Sanitization BEFORE Regex Validation
reportSchema.pre('validate', function () {
    try {
        if (this.isModified('locationName') && this.locationName) {
            this.locationName = this.locationName.replace(/،/g, ',');
        }
    } catch (err) {
        // Soft fail on formatter
    }
  
});

// Indexes for Algorithm Performance
reportSchema.index({ location: '2dsphere' }); // Geo-search
reportSchema.index({ tags: 'text', description: 'text' }); // Text search

// Keyword Auto-Extraction Middleware
reportSchema.pre('save', function () {
    try {
        if (this.isModified('title') || this.isModified('description') || this.isModified('brand') || this.isModified('color')) {
            // Source Expansion & Normalization
            let textToProcess = `${this.title} ${this.description || ''} ${this.brand || ''} ${this.color || ''}`.toLowerCase();
            
            // Sanitization: Replace dashes, commas, and extra spaces with a single space
            textToProcess = textToProcess.replace(/[-،,]/g, ' ').replace(/\s+/g, ' ');

            const stopWords = ['the', 'and', 'with', 'from', 'that', 'this', 'for', 'are', 'was', 'were', 'found', 'lost', 'near', 'have', 'has', 'had', 'been', 'some', 'any', 'all', 'there', 'their', 'which', 'what', 'when', 'where', 'who', 'how', 'why', 'very', 'just'];
            
            // Extraction: Match English AND Arabic words >= 3 characters
            const words = textToProcess.match(/[a-zA-Z\u0600-\u06FF]{3,}/g) || [];
            
            const uniqueKeywords = [...new Set(words)]
                .filter(word => !stopWords.includes(word));
                
            // Silent Storage
            this.tags = [...new Set([...(this.tags || []), ...uniqueKeywords])];
        }
    } catch (error) {
        throw error;
    }
});

export const Report = mongoose.model('Report', reportSchema);