import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { openSupportTicket, claimTicket } from "./support.controller.js";

const supportRouter = Router();

// Protect all support routes
supportRouter.use(protect);

// POST /api/v1/support/ticket
supportRouter.post("/ticket", openSupportTicket);

// POST /api/v1/support/:conversationId/claim
supportRouter.post("/:conversationId/claim", claimTicket);

export default supportRouter;
