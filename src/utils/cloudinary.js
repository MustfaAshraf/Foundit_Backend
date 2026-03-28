import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';
import { createInternalServerError } from './appError.js';

cloudinary.config({
    cloud_name: config.CLOUDINARY.CLOUD_NAME,
    api_key: config.CLOUDINARY.API_KEY,
    api_secret: config.CLOUDINARY.API_SECRET
});

// Changed parameter from filePath to fileBuffer
export const uploadToCloudinary = (fileBuffer, folderName) => {
    return new Promise((resolve, reject) => {
        // We use upload_stream to read the Buffer directly from RAM
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `${config.APP_NAME}/${folderName}`,
                resource_type: "auto"
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Error:", error);
                    reject(createInternalServerError('Image upload failed'));
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id
                    });
                }
            }
        );

        // Pipe the buffer to Cloudinary
        uploadStream.end(fileBuffer);
    });
};

export const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw createInternalServerError('Image deletion failed');
    }
};