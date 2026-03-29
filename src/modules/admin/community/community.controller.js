import * as communityService from './community.service.js';
import { catchAsyncError } from '../../utils/catchAsyncError.js'; // تأكد من المسار عندك

export const getAllCommunities = catchAsyncError(async (req, res, next) => {
    const communities = await communityService.getAllCommunitiesService();

    res.status(200).json({
        status: 'success',
        results: communities.length,
        data: {
            communities
        }
    });
});


/**
 * @desc    Register a new institutional community
 * @route   POST /api/v1/admin/communities
 * @access  Private (Super Admin)
 */
export const createCommunity = catchAsyncError(async (req, res, next) => {
    const community = await communityService.createCommunityService(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            community
        }
    });
});


/**
 * @desc    Toggle Community Subscription Status
 * @route   PATCH /api/v1/admin/communities/:id/status
 * @access  Private (Super Admin)
 */
export const toggleCommunityStatus = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { subscriptionStatus } = req.body;

    const community = await communityService.toggleCommunityStatusService(id, subscriptionStatus);

    res.status(200).json({
        status: 'success',
        data: {
            community
        }
    });
});