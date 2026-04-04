import { Router } from "express";
import * as transController from "./transactions.controller.js";
import { protect, restrictTo } from "../../../middlewares/auth.middleware.js";

const router = Router();

router.use(protect, restrictTo("super_admin"));

router.get("/", transController.getAllTransactions);
router.get("/stats", transController.getStats);

export default router;
