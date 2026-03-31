import { User } from '../../../DB/models/user.model.js';
import { createNotFoundError } from '../../../utils/appError.js';

/**
 * ReputationService handles all business logic related to 
 * User Trust Scores, Activity Scores, and Gamification.
 */
export class ReputationService {
    /**
     * Increment Activity Score (+ engagement)
     */
    static async addActivity(userId, amount) {
        const user = await User.findById(userId);
        if (!user) return;
        
        user.activityScore += amount;
        await this.handleRewards(user);
        return await user.save();
    }

    /**
     * Increment Chat Activity Score (+ engagement) with daily cap
     */
    static async addChatActivity(userId) {
        const user = await User.findById(userId);
        if (!user) return;

        const now = new Date();
        const lastChat = user.lastChatDate;
        const isSameDay = lastChat && now.toDateString() === lastChat.toDateString();

        if (!isSameDay) {
            user.dailyChatPoints = 0;
            user.lastChatDate = now;
        }

        const CHAT_POINT_CAP = 10;
        if (user.dailyChatPoints < CHAT_POINT_CAP) {
            user.dailyChatPoints += 1;
            user.activityScore += 1;
            await this.handleRewards(user);
            return await user.save();
        }
        return user;
    }

    /**
     * Increment Trust Score (+ reputation) and optionally add a badge
     */
    static async addTrust(userId, amount, badgeToAdd = null) {
        const user = await User.findById(userId);
        if (!user) return;
        
        user.trustScore += amount;
        if (badgeToAdd && !user.badges.includes(badgeToAdd)) {
            user.badges.push(badgeToAdd);
        }

        await this.handleRewards(user);
        return await user.save();
    }

    /**
     * Apply a Penalty (- reputation)
     */
    static async applyPenalty(userId, amount) {
        const user = await User.findById(userId);
        if (!user) return;
        
        user.trustScore += amount; // Expect negative number
        await this.handleRewards(user);
        return await user.save();
    }

    /**
     * Post Limits helper (no DB writes) based on trust score tier.
     */
    static getPostLimit(trustScore) {
        if (trustScore >= 500) return 500; // Legacy High
        if (trustScore >= 300) return 40;
        if (trustScore >= 150) return 30;
        if (trustScore >= 0) return 20;
        if (trustScore >= -100) return 10;
        return 5;
    }

    /**
     * REWARD LISTENER: Checks for badges and credit rewards.
     */
    static async handleRewards(user) {
        // 1. Badge Triggers (Trust Based)
        if (user.trustScore >= 200 && !user.badges.includes("Trusted Finder")) {
            user.badges.push("Trusted Finder");
        }
        if (user.trustScore >= 500 && !user.badges.includes("Elite Guardian")) {
            user.badges.push("Elite Guardian");
        }

        // 2. Continuous Business Reward Logic: Credits for every 100 activity points
        const milestoneSize = 100;
        const currentActivity = user.activityScore;
        const lastThreshold = user.lastActivityRewardThreshold || 0;

        const currentMilestones = Math.floor(currentActivity / milestoneSize);
        const lastMilestones = Math.floor(lastThreshold / milestoneSize);

        if (currentMilestones > lastMilestones) {
            const creditsToAward = currentMilestones - lastMilestones;
            user.credits += creditsToAward;
            
            // Track rewarded threshold
            user.lastActivityRewardThreshold = currentMilestones * milestoneSize;
        }
    }

    /**
     * Daily Login Bonus logic
     */
    static async handleDailyLogin(user) {
        const now = new Date();
        const lastLogin = user.lastDailyLogin;

        // Reset if null or if more than 24 hours have passed
        const isNewDay = !lastLogin || (now.getTime() - lastLogin.getTime() > 24 * 60 * 60 * 1000);

        if (isNewDay) {
            user.lastDailyLogin = now;
            user.activityScore += 5; // Reward 5 pts daily
            await this.handleRewards(user);
            await user.save();
        }
    }
}
