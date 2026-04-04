

import { createCheckoutSessionService, handleWebhookService, verifySessionService } from './services/payment.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createBadRequestError } from '../../utils/appError.js';
import { sendSuccessResponse } from '../../utils/appResponse.js';

export const createCheckoutSession = asyncHandler(async (req, res, next) => {
    const { amount, plan, fullName, email } = req.body;

    // Call service to create session
    const session = await createCheckoutSessionService(req.user, amount, plan, fullName, email);

    return sendSuccessResponse(res, {
        url: session.url,
        sessionId: session.id
    }, 200);
});

export const webhookHandler = asyncHandler(async (req, res, next) => {
    const signature = req.headers['stripe-signature'];

    const rawBody = req.rawBody || req.body;

    await handleWebhookService(rawBody, signature);

    // Return 200 OK to Stripe
    res.status(200).json({ received: true });
});

export const confirmPayment = asyncHandler(async (req, res, next) => {
    const { session_id } = req.query;

    if (!session_id) {
        throw createBadRequestError('Missing session_id');
    }

    const data = await verifySessionService(session_id);

    return sendSuccessResponse(res, data, 200);
});
