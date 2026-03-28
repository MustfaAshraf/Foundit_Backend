import multer from "multer";
import path from "path";
import { config } from "../config/env.js";
import { createBadRequestError } from "../utils/appError.js";

// 1. USE MEMORY STORAGE (Files stay in RAM as a Buffer, no local files saved!)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).substring(1).toLowerCase();

    // 2. Updated for FoundIt Fields (avatar for users, images for reports)
    if (file.fieldname === 'avatar' || file.fieldname === 'images') {
        if (!config.UPLOAD.ALLOWED_IMAGE_TYPES.includes(fileExtension)) {
            cb(createBadRequestError('Invalid image type. Allowed: jpg, jpeg, png, webp'));
        } else {
            cb(null, true);
        }
    } else if (file.fieldname === 'document') {
        if (!config.UPLOAD.ALLOWED_DOCUMENT_TYPES.includes(fileExtension)) {
            cb(createBadRequestError('Invalid document type'));
        } else {
            cb(null, true);
        }
    } else {
        cb(null, true);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.UPLOAD.MAX_FILE_SIZE, // 5MB limit from your env
    },
});

export const uploadSingle = (fileName) => upload.single(fileName);
export const uploadMultiple = (fileName, maxCount) => upload.array(fileName, maxCount);
export const uploadMixed = (fileName) => upload.fields(fileName);