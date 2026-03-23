import Stripe from 'stripe';
import { Transaction } from '../../../DB/models/Transaction.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { User } from '../../../DB/models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

