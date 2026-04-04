import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccessResponse } from "../../../utils/appResponse.js";

import {
    getAllUsersService,
    getUserByIdService,
    createUserService,
    updateUserStatusService,
} from "./services/user.service.js";

// ================= ADMIN BAN =================
export const manuallyBanUser = asyncHandler(async (req, res) => {
    const user = await getUserByIdService(req.params.id);

    if (!user) {
        return sendSuccessResponse(res, { message: "User not found" }, 404);
    }

    if (user.trustScore < -10 && req.query.confirm !== "true") {
        return sendSuccessResponse(res, {
            user: { id: user._id, trustScore: user.trustScore, status: user.status },
            warning: "User trustScore is below -10. Please confirm ban with ?confirm=true before proceeding.",
        }, 200);
    }

    const bannedUser = await updateUserStatusService(req.params.id, "banned");
    return sendSuccessResponse(res, { user: bannedUser, message: "User has been manually banned." }, 200);
});

// ================= GET ALL =================
export const getAllUsers = asyncHandler(async (req, res) => {
    const data = await getAllUsersService(req.query);
    return sendSuccessResponse(res, data, 200);
});

// ================= GET ONE =================
export const getUserById = asyncHandler(async (req, res) => {
    const user = await getUserByIdService(req.params.id);
    return sendSuccessResponse(res, { user }, 200);
});

// ================= CREATE =================
export const createUser = asyncHandler(async (req, res) => {
    const user = await createUserService(req.body);
    return sendSuccessResponse(res, { user }, 201);
});

// ================= STATUS =================
export const updateUserStatus = asyncHandler(async (req, res) => {
    const user = await updateUserStatusService(
        req.params.id,
        req.body.status
    );
    return sendSuccessResponse(res, { user }, 200);
});

