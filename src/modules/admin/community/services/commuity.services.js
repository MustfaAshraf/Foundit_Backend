import { Community } from "../../../../DB/models/community.model.js";
import { User } from "../../../../DB/models/user.model.js";

export const getAllCommunitiesService = async () => {
  const communities = await Community.find().lean();
  const communitiesWithCount = await Promise.all(
    communities.map(async (community) => {
      const memberCount = await User.countDocuments({
        community: community._id,
      });
      return {
        ...community,
        activeMembers: memberCount,
      };
    }),
  );
  return communitiesWithCount;
};

export const createCommunityService = async (body) => {
  const { location, ...restOfBody } = body;
  // Format coordinates to GeoJSON standard [longitude, latitude]
  const formattedLocation = {
    type: "Point",
    coordinates: [location.lng, location.lat], //    [lng, lat]
  };
  //create community in DB
  const newCommunity = await Community.create({
    ...restOfBody,
    location: formattedLocation,
  });

  return newCommunity;
};

/**
 * Toggle community subscription status (active/inactive)
 * @param {string} id - Community ID
 * @param {string} status - New status from request body
 */
export const toggleCommunityStatusService = async (id, status) => {
  // Find community by ID and update only the status field
  const updatedCommunity = await Community.findByIdAndUpdate(
    id,
    { subscriptionStatus: status },
    { new: true, runValidators: true },
  );

  if (!updatedCommunity) {
    throw new Error("No community found with this ID");
  }

  return updatedCommunity;
};
