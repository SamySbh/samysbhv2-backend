import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { zodValidator } from '../middlewares/zod.middleware.js';
import { checkoutSessionValidator } from '../schemas/payment.schema.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-checkout-session', protect, zodValidator(checkoutSessionValidator), paymentController.createCheckoutSession);

export default paymentRouter;