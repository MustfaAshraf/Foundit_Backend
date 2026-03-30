import { Report } from '../../../DB/models/report.model.js';
import { User } from '../../../DB/models/user.model.js';
import { ApiFeatures } from '../../../utils/apiFeatures.js';
import { createNotFoundError, createForbiddenError, createBadRequestError } from '../../../utils/appError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../utils/cloudinary.js';
import * as matchController from "../../match/match.controller.js" 
import * as matchService from "../../match/services/match.service.js" 


// Stubbing matchService for now
const userService = {
    refill: () => {
        throw createBadRequestError('Insufficient credits. Please refill your quota.');
    }
};


export const createReportService = async (bodyData, files, userId) => {
    const { title, description, type, category, subCategory, color, brand, tags, dateHappened, locationName, location } = bodyData;

    // 0. Enforce Active Credit Quotas Dynamically Before Spending Backend Cloudinary Compute
    const user = await User.findById(userId);
    if (!user) throw createNotFoundError('User not found');

    // Admin Exemption: Admins and community admins do not consume credits
    const isAdmin = user.role === 'super_admin' || user.role === 'community_admin' || user.role === 'admin';
    
    // Robust Credit Check: Default to 3 for legacy/missing accounts, except admins
    const currentCredits = (user.credits !== undefined && user.credits !== null) ? user.credits : 3;

    if (!isAdmin && currentCredits <= 0) {
        userService.refill();            
    }

    // 1. Process Images to Cloudinary (max 5)
    let images =[];
    if (files && files.length > 0) {
        // Upload all files to Cloudinary in parallel
        const uploadPromises = files.map(file => uploadToCloudinary(file.buffer, 'FoundIt/Reports'));
        const uploadResults = await Promise.all(uploadPromises);
        
        // 👇 2. FIX: Save BOTH url and publicId so we can delete them later
        images = uploadResults.map(result => ({
            url: result.url,
            publicId: result.publicId
        }));
    }

    // 2. Parse GeoJSON Location
    let parsedLocation;
    if (location) {
        try {
            const locObj = typeof location === 'string' ? JSON.parse(location) : location;
            if (locObj.type === "Point" && Array.isArray(locObj.coordinates)) {
                // GeoJSON format
                parsedLocation = locObj;
            } else if (locObj.coordinates && Array.isArray(locObj.coordinates)) {
                // Format: { coordinates: [lng, lat] }
                parsedLocation = { type: 'Point', coordinates: locObj.coordinates };
            } else if (locObj.lng !== undefined && locObj.lat !== undefined) {
                // Format: { lng: X, lat: Y }
                parsedLocation = { type: 'Point', coordinates: [Number(locObj.lng), Number(locObj.lat)] };
            } else if (locObj.lon !== undefined && locObj.lat !== undefined) {
                // Format: { lon: X, lat: Y }
                parsedLocation = { type: 'Point', coordinates: [Number(locObj.lon), Number(locObj.lat)] };
            } else if (Array.isArray(locObj) && locObj.length === 2) {
                // Format: [lng, lat]
                parsedLocation = { type: 'Point', coordinates: [Number(locObj[0]), Number(locObj[1])] }; 
            } else {
                throw createBadRequestError('Invalid location format. Expecting [lng, lat], {lng, lat}, or GeoJSON object.');
            }
        } catch (error) {
            if (error.statusCode) throw error; // Re-throw generic mapping errors
            throw createBadRequestError('Invalid location JSON structure. Parsing failed.');
        }
    }

    // 3. Create Report in DB
    let newReport;
    try {
        newReport = await Report.create({
            title,
            description,
            type,
            category,
            subCategory,
            color,
            brand,
            tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
            dateHappened,
            locationName,
            location: parsedLocation,
            images,
            user: userId
        });
    } catch (dbError) {
        throw createBadRequestError("DB Error: " + (dbError.message || 'Unknown Validation Error'));
    }

    // 4. Actively Deduct Metric Quota Globally (Only for regular users)
    if (!isAdmin) {
        user.credits = currentCredits - 1;
    
        await user.save();
    }

    // used to run match in background
    setImmediate(async () => {
        try {
            await matchService.findMatches(newReport._id);
        } catch (err) {
            console.error("Matching Error:", err.message);
        }
    });

    return newReport;
};

export const getReportsService = async (query) => {
    // 1. Build query using ApiFeatures
    const apiFeatures = new ApiFeatures(Report.find({ status: 'OPEN' }), query)
        .filter()
        .search()
        .sort()
        .limitFields()
        .paginate();

    // 👇 FIX: Changed 'profileImage' to 'avatar.url' to match your User Model!
    const reports = await apiFeatures.mongooseQuery.populate('user', 'name avatar.url');

    const totalQuery = new ApiFeatures(Report.find(), query).filter().mongooseQuery;
    const total = await totalQuery.countDocuments();

    return { reports, total };
};

export const getReportByIdService = async (reportId) => {
    // FIX: Changed 'profileImage' to 'avatar.url'
    const report = await Report.findById(reportId).populate('user', 'name avatar.url email');

    if (!report) throw createNotFoundError('Report not found');

    return report;
};

export const deleteReportService = async (reportId, user) => {
    const report = await Report.findById(reportId);

    if (!report) throw createNotFoundError('Report not found');

    // Verify Ownership (User is from `protect` middleware)
    const isAdmin = ['super_admin', 'community_admin'].includes(user.role);
    const isOwner = report.user.toString() === user._id.toString();

    if (!isOwner && !isAdmin) {
        throw createForbiddenError('You do not have permission to delete this report.');
    }

    // 👆 3. DELETE IMAGES FROM CLOUDINARY
    if (report.images && report.images.length > 0) {
        // Run all deletion requests to Cloudinary in parallel to save time
        const deletePromises = report.images.map(image => {
            if (image.publicId) {
                return deleteFromCloudinary(image.publicId);
            }
            return Promise.resolve(); // Ignore if no publicId exists
        });
        
        await Promise.all(deletePromises).catch(err => {
            console.error("Failed to delete some images from Cloudinary:", err);
            // We log the error but do not throw, so the report still gets deleted from DB
        });
    }

    // 4. Delete the document from MongoDB
    await report.deleteOne();

    // 5. Fetch and return the updated reports for the user (to refresh the frontend automatically)
    const updatedData = await getUserReportsService(user._id, {});
    return updatedData;
};

export const getUserReportsService = async (userId, query) => {
    const filter = { user: userId };
    
    const apiFeatures = new ApiFeatures(Report.find(filter), query)
        .filter()
        .search()
        .sort()
        .paginate();

    const reports = await apiFeatures.mongooseQuery;
    const total = await Report.countDocuments(filter);

    return { reports, total };
};

export const getStatsService = async () => {
    const [totalReports, resolvedReports, activeReports] = await Promise.all([
        Report.countDocuments(),
        Report.countDocuments({ status: 'RESOLVED' }),
        Report.countDocuments({ status: 'OPEN' }),
    ]);

    const uniqueUsers = await User.countDocuments();

    return {
        totalReports,
        resolvedReports,
        activeReports,
        totalMembers: uniqueUsers,
    };
};

