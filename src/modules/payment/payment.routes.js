
import { Router } from 'express';
import express from 'express';
import { createCheckoutSession, webhookHandler } from './payment.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const paymentRouter = Router();

// Endpoint for creating the checkout session
paymentRouter.post('/checkout-session', protect, createCheckoutSession);

// Endpoint for the webhook (public, no auth needed, handled by stripe signature)
paymentRouter.post('/webhook', express.raw({ type: 'application/json' }), webhookHandler);

export default paymentRouter;
