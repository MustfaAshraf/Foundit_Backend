import { User } from "../../../DB/models/User.model.js";
import { createNotFoundError } from "../../../utils/appError.js";
import cloudinary from "../../../config/cloudinary.js";

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
        await cloudinary.uploader.destroy(user.avatar.publicId);
    }

    const uploaded = await cloudinary.uploader.upload(file.path, {
        folder: "FoundIt/Users",
    });

    user.avatar = {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
    };

    await user.save();

    return user;
};
