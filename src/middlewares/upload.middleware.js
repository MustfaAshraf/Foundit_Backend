import multer from "multer";
import path from "path";
import { config } from "../config/env.js";
import { createBadRequestError } from "../utils/appError.js";


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36)
            .substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).substring(1)
        .toLowerCase();

    if (file.fieldname === 'profileImage' || file.fieldname === 'courseImage') {
        if (!config.UPLOAD.ALLOWED_IMAGE_TYPES.includes(fileExtension)) {
            cb(createBadRequestError('Invalid image type'));
        } else {
            cb(null, true);
        }
    } else if (file.fieldname === 'courseVideo' || file.fieldname === 'lessonVideo') {
        if (!config.UPLOAD.ALLOWED_VIDEO_TYPES.includes(fileExtension)) {
            cb(createBadRequestError('Invalid video type'));
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
        fileSize: config.UPLOAD.MAX_FILE_SIZE,
    },
});


export const uploadSingle = (fileName) => upload.single(fileName)

export const uploadMultiple = (fileName, maxCount) => upload.array(fileName, maxCount)

export const uploadMixed = (fileName) => upload.fields(fileName)