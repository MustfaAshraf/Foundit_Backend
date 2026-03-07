// =========================================================
// 🌐 SYSTEM & HTTP CONSTANTS
// =========================================================

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

// =========================================================
// 👤 USER & AUTH CONSTANTS
// =========================================================

export const USER_ROLES = {
    USER: 'user',
    COMMUNITY_ADMIN: 'community_admin',
    SUPER_ADMIN: 'super_admin'
};

export const SOCIAL_PROVIDERS = {
    GOOGLE: 'google',
    FACEBOOK: 'facebook',
    EMAIL: 'email'
};

export const TOKEN_TYPES = {
    ACCESS: 'access',
    REFRESH: 'refresh',
    RESET_PASSWORD: 'reset_password',
    EMAIL_VERIFICATION: 'email_verification'
};

// =========================================================
// 📦 REPORT & ITEM CONSTANTS
// =========================================================

export const REPORT_TYPE = {
    LOST: 'LOST',
    FOUND: 'FOUND'
};

export const REPORT_STATUS = {
    OPEN: 'OPEN',           // Visible to everyone
    PENDING_MATCH: 'PENDING', // Potential match found, waiting for user action
    MATCHED: 'MATCHED',     // Users are talking
    RESOLVED: 'RESOLVED',   // Item returned
    EXPIRED: 'EXPIRED',     // Old report
    CLOSED: 'CLOSED'        // Deleted/Hidden by user
};

export const ITEM_CATEGORIES = {
    ELECTRONICS: 'Electronics',
    WALLETS: 'Wallets',
    PETS: 'Pets',
    DOCUMENTS: 'Documents',
    KEYS: 'Keys',
    BAGS: 'Bags',
    CLOTHING: 'Clothing',
    OTHER: 'Other'
};

// =========================================================
// 🧩 MATCHING & GAMIFICATION
// =========================================================

export const MATCH_STATUS = {
    PROPOSED: 'PROPOSED',   // Algorithm found a match, users notified
    ACCEPTED: 'ACCEPTED',   // Users agreed to chat
    REJECTED: 'REJECTED',   // "This isn't my item"
    VERIFIED: 'VERIFIED'    // Item handover confirmed
};

export const GAMIFICATION = {
    STARTING_CREDITS: 3,
    POINTS_PER_RESOLVE: 50,
    POINTS_PER_VERIFIED_MATCH: 100
};

// =========================================================
// 🏢 SAAS & COMMUNITY
// =========================================================

export const COMMUNITY_TYPE = {
    UNIVERSITY: 'University',
    COMPOUND: 'Compound',
    COMPANY: 'Company',
    ORGANIZATION: 'Organization'
};

export const SUBSCRIPTION_PLANS = {
    FREE: 'Free',
    PREMIUM: 'Premium',
    ENTERPRISE: 'Enterprise'
};

export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PAST_DUE: 'past_due',
    CANCELLED: 'cancelled'
};

// =========================================================
// 🔔 NOTIFICATIONS & CHAT
// =========================================================

export const NOTIFICATION_CATEGORIES = {
    MATCH: 'MATCH',       // "New Match Found!"
    MESSAGE: 'MESSAGE',   // "New Message from Alex"
    ALERT: 'ALERT',       // "Security Alert in your area"
    SYSTEM: 'SYSTEM',     // "Credits refilled"
    REWARD: 'REWARD'      // "You earned a badge!"
};

export const CHAT_STATUS = {
    ACTIVE: true,
    ARCHIVED: false
};

// =========================================================
// 💳 PAYMENTS (STRIPE)
// =========================================================

export const TRANSACTION_STATUS = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED'
};

export const TRANSACTION_TYPE = {
    CREDIT_REFILL: 'CREDIT_REFILL',
    SUBSCRIPTION: 'SUBSCRIPTION'
};

// =========================================================
// 🔢 VALIDATION REGEX PATTERNS
// =========================================================

export const REGEX = {
    // Basic email regex
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // Min 8 chars, at least 1 letter and 1 number
    PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
    
    // Valid MongoDB ObjectId
    OBJECT_ID: /^[0-9a-fA-F]{24}$/,
    
    // Phone number (Basic international)
    PHONE: /^\+?[1-9]\d{1,14}$/
};