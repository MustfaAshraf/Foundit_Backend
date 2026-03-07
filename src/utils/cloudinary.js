import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';
import { createInternalServerError } from './appError.js';

cloudinary.config({
    cloud_name: config.CLOUDINARY.CLOUD_NAME,
    api_key: config.CLOUDINARY.API_KEY,
    api_secret: config.CLOUDINARY.API_SECRET
});

export const uploadToCloudinary = async (filePath, folderName) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: `${config.APP_NAME}/${folderName}`,
            resource_type: "auto"
        });
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        throw createInternalServerError('Image upload failed');}
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw createInternalServerError('Image deletion failed');
    }
};