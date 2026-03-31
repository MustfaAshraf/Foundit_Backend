import Stripe from 'stripe';
import { Transaction } from '../../../DB/models/transaction.model.js';
import { User } from '../../../DB/models/user.model.js';
import { createBadRequestError } from '../../../utils/appError.js';
import { config } from '../../../config/env.js';

const stripe = new Stripe(config.STRIPE.SECRET_KEY);

export const createCheckoutSessionService = async (user, amount, plan) => {
    // 1. Validate Input & Set Defaults
    let creditsToAdd = 0;
    let finalAmount = Number(amount) || 0;

    if (plan === 'Premium') {
        creditsToAdd = 10;
        finalAmount = finalAmount > 0 ? finalAmount : 500; // default 500 EGP
    } else if (plan === 'Basic') {
        creditsToAdd = 3;
        finalAmount = finalAmount > 0 ? finalAmount : 150; // default 150 EGP
    } else {
        creditsToAdd = finalAmount;
    }

    // 2. Stripe Minimum enforcement 
    // If the frontend sends something less than 30 EGP (or 0), we automatically bump it to 30.
    if (!finalAmount || Math.round(Number(finalAmount)) < 30) {
        finalAmount = 30; // 30 EGP (approx $0.60 USD) to ensure the session never crashes due to Stripe's 50 cents limit.
    }

    // 2. Safely create session with fallback variables
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${config.FRONTEND_URL}/profile`,
        cancel_url: `${config.FRONTEND_URL}/payment/cancel`,
        client_reference_id: user._id.toString(),
        customer_email: user.email,
        line_items: [
            {
                price_data: {
                    currency: 'egp',
                    product_data: {
                        name: `${plan || 'Custom'} Plan - Credit Refill`,
                    },
                    unit_amount: Math.round(finalAmount * 100), // Ensures an integer in piasters
                },
                quantity: 1,
            },
        ],
        metadata: {
            userId: user._id.toString(),
            credits: creditsToAdd
        }
    });

    // 3. Create PENDING transaction in DB
    await Transaction.create({
        user: user._id,
        amount: finalAmount,
        currency: 'EGP',
        type: 'CREDIT_REFILL',
        creditsAdded: creditsToAdd,
        stripePaymentId: session.id, // We store session ID to link it when we handle the webhook later
        status: 'SUCCESS'
    });

    return session;
};

export const handleWebhookService = async (rawBody, signature) => {
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        throw createBadRequestError(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const userId = session.client_reference_id || session.metadata?.userId;
        const credits = Number(session.metadata?.credits) || 0;
        const stripePaymentId = session.id;

        if (!userId) {
            throw createBadRequestError('Webhook Error: Missing userId in session');
        }

        // 1. Increment user credits
        await User.findByIdAndUpdate(userId, {
            $inc: { credits: credits }
        });

        // 2. Update existing PENDING transaction to SUCCESS
        await Transaction.findOneAndUpdate(
            { stripePaymentId: stripePaymentId },
            {
                status: 'SUCCESS',
            },
            { new: true, runValidators: true }
        );
    }

    return true;
};
