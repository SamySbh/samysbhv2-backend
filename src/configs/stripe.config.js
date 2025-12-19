import Stripe from 'stripe';

const stripeSDK = new Stripe(process.env.STRIPE_SECRET_KEY);

export default stripeSDK;