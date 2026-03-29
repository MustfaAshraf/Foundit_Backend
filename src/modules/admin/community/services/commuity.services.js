import { Community } from '../models/community.model.js';
import { User } from '../models/user.model.js';


export const getAllCommunitiesService = async () => {
    const communities = await Community.find().lean();
    const communitiesWithCount = await Promise.all(
        communities.map(async (Community) => {
            const memberCount = await User.countDocuments({ community: community._id });
            return {
                ...community,
                activeMembers: memberCount
            }
        })
    )
    return communitiesWithCount;
}



export const createCommunityService = async (body) => {
    const { location, ...restOfBody } = body;
    // Format coordinates to GeoJSON standard [longitude, latitude]
    const formattedLocation = {
        type: 'Point',
        coordinates: [location.lng, location.lat] // الترتيب ده مقدس [lng, lat]
    };
    //create community in DB
    const newCommunity = await Community.create({
        ...restOfBody,
        location: formattedLocation
    });

    return newCommunity;
};