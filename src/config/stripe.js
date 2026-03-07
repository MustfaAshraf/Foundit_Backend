import Stripe from 'stripe';
import { config } from './env.js';

if (!config.STRIPE.SECRET_KEY) {
    console.error("⚠️ FATAL: STRIPE_SECRET_KEY is missing");
    process.exit(1);
}

export const stripe = new Stripe(config.STRIPE.SECRET_KEY, {
    apiVersion: '2023-10-16', // Pinning version ensures API stability
    typescript: false,
});