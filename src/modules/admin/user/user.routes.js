import { Router } from "express";

import {
    getAllUsers,
    getUserById,
    createUser,
    updateUserStatus,
    manuallyBanUser,
} from "./user.controller.js";

import { protect, restrictTo } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validation.middleware.js";

import {
    createUserSchema,
    updateStatusSchema,
} from "./validation/user.validation.js";

const router = Router();

router.use(protect, restrictTo("super_admin"));

// ================= ROUTES =================
router.get("/", getAllUsers);
router.get("/:id", getUserById);

router.post("/", validate(createUserSchema), createUser);

router.patch("/:id/status", validate(updateStatusSchema), updateUserStatus);
router.patch("/:id/ban", manuallyBanUser);

export default router;