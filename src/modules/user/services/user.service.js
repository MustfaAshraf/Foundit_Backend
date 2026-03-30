import { User } from "../../../DB/models/User.model.js";
import { createBadRequestError, createNotFoundError } from "../../../utils/appError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../../utils/cloudinary.js";
import { comparePassword, hashPassword } from "../../../utils/passHandler.js";

export const getMeService = async (userId) => {
    const user = await User.findById(userId).select("-refreshToken");

    if (!user) {
        throw createNotFoundError("User not found");
    }

    return user;
};

export const updateMeService = async (userId, data) => {
    const allowedFields = ["name"];

    const filteredData = {};

    Object.keys(data).forEach((key) => {
        if (allowedFields.includes(key)) {
            filteredData[key] = data[key];
        }
    });

    const user = await User.findByIdAndUpdate(userId, filteredData, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        throw createNotFoundError("User not found");
    }
    user.refreshToken = undefined;
    user.password = undefined;
    return user;
};

export const updateAvatarService = async (userId, file) => {
    const user = await User.findById(userId);

    if (!user) {
        throw createNotFoundError("User not found");
    }

    if (!file) {
        throw createNotFoundError("Avatar image is required");
    }

    // delete old avatar if exists
    if (user.avatar?.publicId) {
        await deleteFromCloudinary(user.avatar.publicId);
    }

    console.log(`Uploading avatar for user ${userId} to Cloudinary...`);
    const uploaded = await uploadToCloudinary(file.buffer, "Users");
    console.log("Cloudinary upload successful:", uploaded);

    user.avatar = {
        url: uploaded.url,
        publicId: uploaded.publicId,
    };

    // Explicitly mark the field as modified for Mongoose
    user.markModified('avatar');
    await user.save();
    console.log("User avatar saved to database.");

    return user;
};

export const changePasswordService = async (userId, currentPassword, newPassword) => {
    // 1. Get the user and explicitly select the password field
    const user = await User.findById(userId).select('+password');
    if (!user) {
        throw createNotFoundError('User not found');
    }

    // 2. Verify the current password is correct
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
        throw createBadRequestError('Incorrect current password.');
    }

    // 3. Prevent changing to the same password
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
        throw createBadRequestError('New password cannot be the same as the current password.');
    }

    // 4. Hash new password & save
    user.password = await hashPassword(newPassword);
    user.passwordChangedAt = Date.now();

    // Security Best Practice: 
    // We could clear the refreshToken array here to force all other devices to log out,
    // but for now we'll just let the current session continue.

    await user.save();

    return { message: 'Password updated successfully!' };
};
