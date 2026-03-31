import Stripe from 'stripe';
import { Transaction } from '../../../DB/models/transaction.model.js';
import { User } from '../../../DB/models/user.model.js';
import { createBadRequestError } from '../../../utils/appError.js';
import { config } from '../../../config/env.js';

const stripe = new Stripe(config.STRIPE.SECRET_KEY);

export const createCheckoutSessionService = async (user, amount, plan, fullName, email) => {
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
        success_url: `${config.FRONTEND_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
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
            credits: creditsToAdd,
            billingName: fullName || user.name,
            billingEmail: email || user.email
        }
    });

    // 3. Record PENDING transaction in DB
    try {
        await Transaction.create({
            user: user._id,
            amount: finalAmount,
            currency: 'EGP',
            type: 'CREDIT_REFILL',
            creditsAdded: creditsToAdd,
            stripePaymentId: session.id,
            billingName: fullName || user.name,
            billingEmail: email || user.email,
            status: 'PENDING'
        });
        console.log(`[Stripe] Pending transaction recorded for user ${user._id}`);
    } catch (dbError) {
        // We don't want to crash the whole process if DB record fails, but we should log it
        console.error(`[Stripe] Failed to record pending transaction: ${dbError.message}`);
    }

    return session;
};

export const handleWebhookService = async (rawBody, signature) => {
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            config.STRIPE.WEBHOOK_SECRET
        );
        console.log(`[Stripe Webhook] Event received: ${event.type} [ID: ${event.id}]`);
    } catch (err) {
        console.error(`[Stripe Webhook] Signature verification failed or error: ${err.message}`);
        console.error(`[Stripe Webhook] RawBody length: ${rawBody ? rawBody.length : 0}`);
        throw createBadRequestError(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log(`[Stripe Webhook] Handling checkout.session.completed for session: ${session.id}`);

        const userId = session.client_reference_id || session.metadata?.userId;
        const credits = Number(session.metadata?.credits) || 0;
        const amount = session.amount_total / 100;
        const currency = session.currency;
        const stripePaymentId = session.id;
        const billingName = session.metadata?.billingName;
        const billingEmail = session.metadata?.billingEmail;

        if (!userId) {
            console.error('[Stripe Webhook] Error: Missing userId in session metadata/reference');
            throw createBadRequestError('Webhook Error: Missing userId in session');
        }

        // 1. Increment user credits
        await User.findByIdAndUpdate(userId, {
            $inc: { credits: credits }
        });
        console.log(`[Stripe Webhook] Credits (${credits}) added to user: ${userId}`);

        // 2. Update or Create transaction history
        const existingTx = await Transaction.findOne({ stripePaymentId });

        if (existingTx) {
            existingTx.status = 'SUCCESS';
            existingTx.amount = amount; // update if it changed
            existingTx.currency = currency.toUpperCase();
            existingTx.billingName = billingName;
            existingTx.billingEmail = billingEmail;
            await existingTx.save();
            console.log(`[Stripe Webhook] Updated existing transaction ${existingTx._id} to SUCCESS`);
        } else {
            await Transaction.create({
                user: userId,
                amount: amount,
                currency: currency.toUpperCase(),
                type: 'CREDIT_REFILL',
                creditsAdded: credits,
                stripePaymentId: stripePaymentId,
                billingName: billingName,
                billingEmail: billingEmail,
                status: 'SUCCESS'
            });
            console.log(`[Stripe Webhook] Created new transaction record for ${stripePaymentId} (PENDING record was missing)`);
        }
    } else {
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return true;
};

export const verifySessionService = async (sessionId) => {
    // 1. Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
        console.log(`[Stripe Verify] Session ${sessionId} status is ${session.payment_status}, not paid.`);
        throw createBadRequestError(`Payment status is ${session.payment_status}. Please complete the payment.`);
    }

    console.log(`[Stripe Verify] Session ${sessionId} confirmed as PAID by Stripe API.`);

    const userId = session.client_reference_id || session.metadata?.userId;
    const credits = Number(session.metadata?.credits) || 0;
    const amount = session.amount_total / 100;
    const currency = session.currency;
    const billingName = session.metadata?.billingName;
    const billingEmail = session.metadata?.billingEmail;

    // 2. Check if already processed (find by stripePaymentId and status SUCCESS)
    const existingTx = await Transaction.findOne({
        stripePaymentId: sessionId,
        status: 'SUCCESS'
    });

    if (existingTx) {
        console.log(`[Stripe Verify] Session ${sessionId} already processed as SUCCESS.`);
        return { message: 'Payment already updated', transaction: existingTx };
    }

    // 3. Update User Credits
    await User.findByIdAndUpdate(userId, {
        $inc: { credits: credits }
    });

    // 4. Update or Create Transaction
    const tx = await Transaction.findOneAndUpdate(
        { stripePaymentId: sessionId },
        {
            user: userId,
            amount: amount,
            currency: currency.toUpperCase(),
            type: 'CREDIT_REFILL',
            creditsAdded: credits,
            stripePaymentId: sessionId,
            billingName,
            billingEmail,
            status: 'SUCCESS'
        },
        { upsert: true, new: true }
    );

    console.log(`[Stripe Verify] Session ${sessionId} manually verified and updated to SUCCESS.`);
    return { message: 'Payment verified successfully', transaction: tx };
};
