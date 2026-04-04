import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccessResponse } from "../../utils/appResponse.js";
import {
    getMeService,
    updateMeService,
    updateAvatarService,
    changePasswordService,
} from "./services/user.service.js";
import { HTTP_STATUS } from "../../config/constants.js";

export const getMe = asyncHandler(async (req, res) => {
    const user = await getMeService(req.user.id);

    return sendSuccessResponse(res, { user }, HTTP_STATUS.OK);
});

export const updateMe = asyncHandler(async (req, res) => {
    const user = await updateMeService(req.user.id, req.body);

    return sendSuccessResponse(res, { user }, HTTP_STATUS.OK);
});

export const updateAvatar = asyncHandler(async (req, res) => {
    const user = await updateAvatarService(req.user.id, req.file);

    return sendSuccessResponse(res, { user }, HTTP_STATUS.OK);
});

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    // req.user._id comes from our `protect` middleware!
    const result = await changePasswordService(req.user._id, currentPassword, newPassword);
    
    sendSuccessResponse(res, result, HTTP_STATUS.OK);
});
