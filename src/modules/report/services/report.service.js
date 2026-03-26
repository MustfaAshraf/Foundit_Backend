import { Report } from '../../../DB/models/report.model.js';
import { ApiFeatures } from '../../../utils/apiFeatures.js';
import { createNotFoundError, createForbiddenError, createBadRequestError } from '../../../utils/appError.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.js';
import * as matchController from "../../match/match.controller.js" 
import * as matchService from "../../match/services/match.service.js" 


// Stubbing matchService for now
// const matchService = {
//     findMatches: async (report) => {
//         console.log('Stub: Matching service invoked for report', report._id);
//         // Integrate real matching logic when the module is fully ready
//     }
// };

export const createReportService = async (bodyData, files, userId) => {
    const { title, description, type, category, subCategory, color, brand, tags, dateHappened, locationName, location } = bodyData;

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
            if (locObj.coordinates && Array.isArray(locObj.coordinates)) {
                // If the user sends { coordinates: [lng, lat] }
                parsedLocation = { type: 'Point', coordinates: locObj.coordinates };
            } else if (locObj.lng && locObj.lat) {
                // If the user sends { lng: X, lat: Y }
                parsedLocation = { type: 'Point', coordinates: [locObj.lng, locObj.lat] };
            } else if (Array.isArray(locObj)) {
                // If the user sends [lng, lat] directly
                parsedLocation = { type: 'Point', coordinates: locObj }; 
            } else {
                throw createBadRequestError('Invalid location format. Must provide lng and lat.');
            }
        } catch (error) {
            if (error.statusCode) throw error; // Re-throw handled app errors
            throw createBadRequestError('Invalid location JSON format');
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
    const apiFeatures = new ApiFeatures(Report.find(), query)
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