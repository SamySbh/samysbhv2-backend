import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import webhookController from '../controllers/payment.webhook.controller.js';
import stripeWebhookMiddleware from '../middlewares/stripe.middleware.js';
import protect from '../middlewares/auth.middleware.js';

const paymentRouter = express.Router();
const webhookRouter = express.Router();

//Création  d'une session de paiement
paymentRouter.post('/create-checkout-session', protect, paymentController.createCheckoutSession);

//Webhook appelé par Stripe
webhookRouter.post('/webhook', stripeWebhookMiddleware, webhookController.handleWebhook);


export { paymentRouter, webhookRouter };