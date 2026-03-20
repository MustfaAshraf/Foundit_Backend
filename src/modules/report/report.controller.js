import { Report } from '../../DB/models/report.model.js';
import { ApiFeatures } from '../../utils/apiFeatures.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createNotFoundError, createForbiddenError, createBadRequestError } from '../../utils/appError.js';

// Stubbing matchService for now
const matchService = {
    findMatches: async (report) => {
        console.log('Stub: Matching service invoked for report', report._id);
        // Integrate real matching logic when the module is fully ready
    }
};

export const createReport = asyncHandler(async (req, res, next) => {
    const { title, description, type, category, color, brand, tags, dateHappened, locationName, location } = req.body;

    // 1. Process Images (max 5)
    let images = [];
    if (req.files && req.files.length > 0) {
        images = req.files.map(file => file.path); // Saving local paths
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
                return next(createBadRequestError('Invalid location format. Must provide lng and lat.'));
            }
        } catch (error) {
            return next(createBadRequestError('Invalid location JSON format'));
        }
    }

    // 3. Create Report in DB
    const newReport = await Report.create({
        title,
        description,
        type,
        category,
        color,
        brand,
        tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
        dateHappened,
        locationName,
        location: parsedLocation,
        images,
        user: req.user._id
    });

    // 4. Trigger Matching Algorithm Stub
    await matchService.findMatches(newReport);

    // 5. Send Response
    res.status(201).json({
        status: 'success',
        data: { report: newReport }
    });
});

export const getReports = asyncHandler(async (req, res, next) => {
    // 1. Build query using ApiFeatures
    const apiFeatures = new ApiFeatures(Report.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // 2. Execute Query
    const reports = await apiFeatures.mongooseQuery.populate('user', 'name profileImage');

    // 3. Count Total Docs for Pagination info
    const totalQuery = new ApiFeatures(Report.find(), req.query).filter().mongooseQuery;
    const total = await totalQuery.countDocuments();

    // 4. Send Response
    res.status(200).json({
        status: 'success',
        results: reports.length,
        total,
        data: { reports }
    });
});

export const getReportById = asyncHandler(async (req, res, next) => {
    const report = await Report.findById(req.params.id).populate('user', 'name profileImage');

    if (!report) {
        return next(createNotFoundError('Report not found'));
    }

    res.status(200).json({
        status: 'success',
        data: { report }
    });
});

export const deleteReport = asyncHandler(async (req, res, next) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        return next(createNotFoundError('Report not found'));
    }

    // Verify Ownership (User is from `protect` middleware)
    if (report.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(createForbiddenError('You do not have permission to delete this report.'));
    }

    // Delete
    await report.deleteOne();

    res.status(204).json({
        status: 'success',
        data: null
    });
});
