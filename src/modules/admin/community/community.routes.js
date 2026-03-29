import express from "express";
import * as communityController from "./community.controller.js";
import { protect, restrictTo } from "../../../middlewares/auth.middleware.js";
import {
  createCommunity,
  getAllCommunities,
  toggleCommunityStatus,
} from "./community.controller.js";

const router = express.Router();

// Super Admin prect
router.use(protect, restrictTo("super_admin"));

router.get("/", communityController.getAllCommunities);

// Route to update status specifically
router.patch("/:id/status", communityController.toggleCommunityStatus);
router.post("/", protect, restrictTo("super_admin"), createCommunity);
router.get("/stats/revenue", communityController.getCommunityStats);
export default router;
