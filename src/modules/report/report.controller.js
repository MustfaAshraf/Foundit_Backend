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
