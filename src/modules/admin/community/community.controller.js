import * as communityService from "./services/commuity.services.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Community } from "../../../DB/models/community.model.js";

export const getAllCommunities = asyncHandler(async (req, res, next) => {
  const communities = await communityService.getAllCommunitiesService();

  res.status(200).json({
    status: "success",
    results: communities.length,
    data: {
      communities,
    },
  });
});

/**
 * @desc    Register a new institutional community
 * @route   POST /api/v1/admin/communities
 * @access  Private (Super Admin)
 */
export const createCommunity = asyncHandler(async (req, res, next) => {
  const community = await communityService.createCommunityService(req.body);

  res.status(201).json({
    status: "success",
    data: {
      community,
    },
  });
});

/**
 * @desc    Toggle Community Subscription Status
 * @route   PATCH /api/v1/admin/communities/:id/status
 * @access  Private (Super Admin)
 */
export const toggleCommunityStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { subscriptionStatus } = req.body;

  const community = await communityService.toggleCommunityStatusService(
    id,
    subscriptionStatus,
  );

  res.status(200).json({
    status: "success",
    data: {
      community,
    },
  });
});

export const getCommunityStats = asyncHandler(async (req, res, next) => {
  const stats = await Community.aggregate([
    {
      $group: {
        _id: null,
        totalCommunities: { $sum: 1 },
        activeCommunities: {
          $sum: { $cond: [{ $eq: ["$subscriptionStatus", "active"] }, 1, 0] },
        },
        totalRevenue: { $sum: "$subscriptionPrice" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: stats[0] || {
      totalCommunities: 0,
      activeCommunities: 0,
      totalRevenue: 0,
    },
  });
});
