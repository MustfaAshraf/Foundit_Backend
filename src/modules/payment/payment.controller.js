import { createCheckoutSessionService, handleWebhookService } from './services/payment.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccessResponse } from '../../utils/appResponse.js';

export const createCheckoutSession = asyncHandler(async (req, res, next) => {
    const { amount, plan } = req.body;

    // Call service to create session
    const session = await createCheckoutSessionService(req.user, amount, plan);

    return sendSuccessResponse(res, {
        url: session.url,
        sessionId: session.id
    }, 200);

});

export const webhookHandler = asyncHandler(async (req, res, next) => {

});
