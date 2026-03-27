import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccessResponse } from "../../utils/appResponse.js";
import {
    getMeService,
    updateMeService,
    updateAvatarService,
} from "./services/user.service.js";

export const getMe = asyncHandler(async (req, res) => {
    const user = await getMeService(req.user.id);

    return sendSuccessResponse(res, { user }, 200);
});

export const updateMe = asyncHandler(async (req, res) => {
    const user = await updateMeService(req.user.id, req.body);

    return sendSuccessResponse(res, { user }, 200);
});

export const updateAvatar = asyncHandler(async (req, res) => {
    const user = await updateAvatarService(req.user.id, req.file);

    return sendSuccessResponse(res, { user }, 200);
});
