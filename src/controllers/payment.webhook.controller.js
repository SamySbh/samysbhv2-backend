import { PrismaClient } from '@prisma/client';
import stripe from '../configs/stripe.config.js';

const prisma = new PrismaClient();

const webhookController = {
    async handleWebhook(req, res) {
        try {
            const sig = req.headers['stripe-signature'];

            if (!sig) {
                return res.status(400).json({
                    success: false,
                    message: 'Signature Stripe manquante'
                });
            }

            const event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            let result;
            switch (event.type) {
                case 'checkout.session.completed':
                    result = await webhookController.handleCheckoutSessionCompleted(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    result = await webhookController.handlePaymentFailed(event.data.object);
                    break;

                case 'charge.succeeded':
                    result = await webhookController.handleChargeSucceeded(event.data.object);
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: `Type d'événement non géré: ${event.type}`
                    });
            }

            return res.status(200).json(result);

        } catch (error) {
            console.error('Erreur dans handleWebhook:', error);

            if (error.type === 'StripeSignatureVerificationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Signature invalide'
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Erreur lors du traitement du webhook'
            });
        }
    },

    async handleCheckoutSessionCompleted(session) {
        try {
            const orderId = session.metadata.orderId;
            const fetchedOrder = await prisma.order.findUnique({
                where: { id: orderId }
            });

            if (!fetchedOrder) {
                return {
                    success: false,
                    message: 'Commande non trouvée'
                };
            }

            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    statusPayment: 'DEPOSIT_PAID',
                    stripePaymentIntentId: session.payment_intent,
                    updatedAt: new Date()
                }
            });

            // Envoie du mail de confirmation
            await EmailService.sendPaymentConfirmationEmail(
                fetchedOrder.user.email,
                updatedOrder
            );

            return {
                success: true,
                data: updatedOrder,
                message: 'Paiement validé avec succès'
            };

        } catch (error) {
            console.error('Erreur dans handleCheckoutSessionCompleted:', error);
            throw error;
        }
    },

    async handlePaymentFailed(paymentIntent) {
        try {
            const fetchedOrder = await prisma.order.findFirst({
                where: { stripePaymentIntentId: paymentIntent.id }
            });

            if (!fetchedOrder) {
                return {
                    success: false,
                    message: 'Commande non trouvée'
                };
            }

            const updatedOrder = await prisma.order.update({
                where: { id: fetchedOrder.id },
                data: {
                    statusPayment: 'PENDING_DEPOSIT',
                    paymentError: paymentIntent.last_payment_error?.message || 'Erreur de paiement',
                    updatedAt: new Date()
                }
            });

            return {
                success: true,
                data: updatedOrder,
                message: 'Échec du paiement enregistré'
            };

        } catch (error) {
            console.error('Erreur dans handlePaymentFailed:', error);
            throw error;
        }
    },

    async handleChargeSucceeded(charge) {
        try {
            // On peut ajouter ici la logique spécifique pour les charges réussies si nécessaire
            return {
                success: true,
                data: charge,
                message: 'Charge traitée avec succès'
            };
        } catch (error) {
            console.error('Erreur dans handleChargeSucceeded:', error);
            throw error;
        }
    }
};

export default webhookController;