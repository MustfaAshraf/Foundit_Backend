import { User } from "../../../../DB/models/user.model.js";
import { createNotFoundError, createBadRequestError } from "../../../../utils/appError.js";
import { ApiFeatures } from "../../../../utils/apiFeatures.js";
import bcrypt from "bcrypt";

// ================= GET ALL USERS =================
export const getAllUsersService = async (query) => {
    const mongooseQuery = User.find().populate("community", "name");

    const apiFeatures = new ApiFeatures(mongooseQuery, query)
        .search(["name", "email"])
        .paginate();

    const users = await apiFeatures.mongooseQuery;
    const totalCount = await User.countDocuments();

    return { users, totalCount };
};

// ================= GET SINGLE USER =================
export const getUserByIdService = async (id) => {
    const user = await User.findById(id).populate("community");

    if (!user) {
        throw createNotFoundError("User not found");
    }

    return user;
};

// ================= CREATE USER =================
export const createUserService = async (data) => {
    const { name, email, password, role, community } = data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw createBadRequestError("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        community: community || null,
        isVerified: false,
    });


    return user;
};

// ================= UPDATE STATUS =================
export const updateUserStatusService = async (id, status) => {
    const user = await User.findById(id);

    if (!user) {
        throw createNotFoundError("User not found");
    }

    // Rule: if admin bans user, reduce trustScore by 150 (can go below -150)
    if (status === "banned") {
        user.trustScore = Math.min(user.trustScore - 150, -150);
        user.refreshToken = [];
    }

    // Rule: if admin unbans user, set trustScore back to 0
    if (status === "active" && user.status === "banned") {
        user.trustScore = 0;
    }

    user.status = status;

    await user.save();

    return user;
};