import { asyncHandler } from "../../../utils/asyncHandler.js";
import { sendSuccessResponse } from "../../../utils/appResponse.js";

import {
    getAllUsersService,
    getUserByIdService,
    createUserService,
    updateUserStatusService,
} from "./services/user.service.js";

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

