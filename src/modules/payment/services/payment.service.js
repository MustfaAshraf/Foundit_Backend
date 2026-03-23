import Stripe from 'stripe';
import { Transaction } from '../../../DB/models/transaction.model.js';
import { createBadRequestError } from '../../utils/appError.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSessionService = async (user, amount, plan) => {
    // Determine credits to add based on plan or amount
    let creditsToAdd = 0;
    if (plan === 'Premium') creditsToAdd = 10;
    else if (plan === 'Basic') creditsToAdd = 5;
    else creditsToAdd = amount;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        client_reference_id: user._id.toString(),
        customer_email: user.email,
        line_items: [
            {
                price_data: {
                    currency: 'egp',
                    product_data: {
                        name: `${plan || 'Custom'} Plan - Credit Refill`,
                    },
                    unit_amount: amount * 100, // Amount in piasters
                },
                quantity: 1,
            },
        ],
        metadata: {
            userId: user._id.toString(),
            credits: creditsToAdd
        }
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
        const amount = session.amount_total / 100;
        const currency = session.currency;
        const stripePaymentId = session.id;

        if (!userId) {
            throw createBadRequestError('Webhook Error: Missing userId in session');
        }

        // Increment user credits
        await User.findByIdAndUpdate(userId, {
            $inc: { credits: credits }
        });

        // Create transaction history
        await Transaction.create({
            user: userId,
            amount: amount,
            currency: currency.toUpperCase(),
            type: 'CREDIT_REFILL',
            creditsAdded: credits,
            stripePaymentId: stripePaymentId,
            status: 'SUCCESS'
        });
    }

    return true;
};
