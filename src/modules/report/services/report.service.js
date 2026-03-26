import { Report } from '../../../DB/models/report.model.js';
import { User } from '../../../DB/models/user.model.js';
import { ApiFeatures } from '../../../utils/apiFeatures.js';
import { createNotFoundError, createForbiddenError, createBadRequestError } from '../../../utils/appError.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.js';
import * as matchController from "../../match/match.controller.js" 
import * as matchService from "../../match/services/match.service.js" 


// Stubbing matchService for now
const userService = {
    refill: async () => {
        console.log("Insufficient credits to create a report. Your monthly quota (3) has been reached. Please wait for a refresh or contact support.");
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
    let images = [];
    if (files && files.length > 0) {
        // Upload all files to Cloudinary in parallel
        const uploadPromises = files.map(file => uploadToCloudinary(file.path, 'reports'));
        const uploadResults = await Promise.all(uploadPromises);
        // Save the resulting secure URLs
        images = uploadResults.map(result => result.url);
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
        .sort()
        .limitFields()
        .paginate();

    // 2. Execute Query
    const reports = await apiFeatures.mongooseQuery.populate('user', 'name profileImage');

    // 3. Count Total Docs for Pagination info
    const totalQuery = new ApiFeatures(Report.find(), query).filter().mongooseQuery;
    const total = await totalQuery.countDocuments();

    return { reports, total };
};

export const getReportByIdService = async (reportId) => {
    const report = await Report.findById(reportId).populate('user', 'name profileImage');

    if (!report) {
        throw createNotFoundError('Report not found');
    }

    return report;
};

export const deleteReportService = async (reportId, user) => {
    const report = await Report.findById(reportId);

    if (!report) {
        throw createNotFoundError('Report not found');
    }

    // Verify Ownership (User is from `protect` middleware)
    if (report.user.toString() !== user._id.toString() && user.role !== 'admin') {
        throw createForbiddenError('You do not have permission to delete this report.');
    }

    // Delete
    await report.deleteOne();
    return true;
};




// getUserReportsService
export const getUserReportsService = async (userId, query) => {
    const filter = { user: userId };
    
    const apiFeatures = new ApiFeatures(Report.find(filter), query)
        .filter()
        .sort()
        .paginate();

    const reports = await apiFeatures.mongooseQuery;
    const total = await Report.countDocuments(filter);

    return { reports, total };
};