import { Report } from '../../../DB/models/report.model.js';
import { ApiFeatures } from '../../../utils/apiFeatures.js';
import { createNotFoundError, createForbiddenError, createBadRequestError } from '../../../utils/appError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../utils/cloudinary.js'; 
import * as matchService from "../../match/services/match.service.js"; 

export const createReportService = async (bodyData, files, userId) => {
    const { title, description, type, category, color, brand, tags, dateHappened, locationName, location } = bodyData;

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
            if (locObj.coordinates && Array.isArray(locObj.coordinates)) {
                parsedLocation = { type: 'Point', coordinates: locObj.coordinates };
            } else if (locObj.lng && locObj.lat) {
                parsedLocation = { type: 'Point', coordinates: [locObj.lng, locObj.lat] };
            } else if (Array.isArray(locObj)) {
                parsedLocation = { type: 'Point', coordinates: locObj }; 
            } else {
                throw createBadRequestError('Invalid location format. Must provide lng and lat.');
            }
        } catch (error) {
            if (error.statusCode) throw error; 
            throw createBadRequestError('Invalid location JSON format');
        }
    }

    // 3. Create Report in DB
    const newReport = await Report.create({
        title, description, type, category, color, brand,
        tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) :[],
        dateHappened, locationName, location: parsedLocation,
        images, user: userId
    });

    // Run match in background
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
    const apiFeatures = new ApiFeatures(Report.find(), query)
        .filter()
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
    // 👇 FIX: Changed 'profileImage' to 'avatar.url'
    const report = await Report.findById(reportId).populate('user', 'name avatar.url');

    if (!report) throw createNotFoundError('Report not found');

    return report;
};

export const deleteReportService = async (reportId, user) => {
    const report = await Report.findById(reportId);

    if (!report) throw createNotFoundError('Report not found');

    // 👇 FIX: Updated Admin Role Check to match your Enums
    if (report.user.toString() !== user._id.toString() && !['super_admin', 'community_admin'].includes(user.role)) {
        throw createForbiddenError('You do not have permission to delete this report.');
    }

    // 👇 3. DELETE IMAGES FROM CLOUDINARY
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
    return true;
};

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