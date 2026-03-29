import { User } from "../../../../DB/models/User.model.js";
import { createNotFoundError, createBadRequestError } from "../../../../utils/appError.js";
import { ApiFeatures } from "../../../../utils/apiFeatures.js";
import bcrypt from "bcryptjs";

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

    user.status = status;

    // 🚨 FORCE LOGOUT
    if (status === "banned") {
        user.refreshToken = [];
    }

    await user.save();

    return user;
};