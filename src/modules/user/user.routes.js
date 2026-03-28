import { Router } from "express";

import { changePassword, getMe, updateAvatar, updateMe } from "./user.controller.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { uploadSingle } from "../../middlewares/upload.middleware.js";

import {
    updateMeSchema,
    preferencesSchema,
    changePasswordSchema,
} from "./validation/user.validation.js";

const router = Router();

router.use(protect);

router.get("/me", getMe);

router.patch("/update-me", validate(updateMeSchema), updateMe);

router.patch("/update-avatar", uploadSingle("avatar"), updateAvatar);

router.patch(
    '/change-password', 
    validate(changePasswordSchema), 
    changePassword
);

export default router;
