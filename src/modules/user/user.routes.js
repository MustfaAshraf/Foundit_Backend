import { Router } from "express";

import { getMe, updateAvatar, updateMe } from "./user.controller.js";
import { validate } from "../../middlewares/validation.middleware.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { uploadSingle } from "../../middlewares/upload.middleware.js";

import {
    updateMeSchema,
    preferencesSchema,
} from "./validation/user.validation.js";

const router = Router();

router.use(protect);

router.get("/me", getMe);

router.patch("/update-me", validate(updateMeSchema), updateMe);

router.patch("/update-avatar", uploadSingle("avatar"), updateAvatar);

export default router;
