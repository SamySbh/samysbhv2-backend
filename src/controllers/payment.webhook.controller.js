import { PrismaClient } from '@prisma/client';
import stripe from '../configs/stripe.js';
import EmailService from '../services/email.service.js';
import logger from '../configs/logger.config.js';

const prisma = new PrismaClient();

const webhookController = {
    async handleWebhook(req, res) {
        try {
            const sig = req.headers['stripe-signature'];

            if (!sig) {
                logger.warn('🔒 Webhook Stripe reçu sans signature', { 
                    ip: req.ip,
                    headers: req.headers 
                });
                return res.status(400).json({
                    success: false,
                    message: 'Signature Stripe manquante'
                });
            }

            let event;
            try {
                event = stripe.webhooks.constructEvent(
                    req.body,
                    sig,
                    process.env.STRIPE_WEBHOOK_SECRET
                );
                
                logger.info('✅ Webhook Stripe - Signature vérifiée', { 
                    eventType: event.type,
                    eventId: event.id,
                    ip: req.ip 
                });
            } catch (err) {
                logger.error('❌ Webhook Stripe - Signature invalide', { 
                    error: err.message,
                    ip: req.ip,
                    signatureProvided: sig ? 'oui' : 'non'
                });
                
                return res.status(400).json({
                    success: false,
                    message: 'Signature invalide'
                });
            }

            let result;
            switch (event.type) {
                case 'checkout.session.completed':
                    logger.info('💳 Traitement événement: checkout.session.completed', { 
                        sessionId: event.data.object.id,
                        orderId: event.data.object.metadata?.orderId 
                    });
                    result = await webhookController.handleCheckoutSessionCompleted(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    logger.warn('⚠️ Traitement événement: payment_intent.payment_failed', { 
                        paymentIntentId: event.data.object.id 
                    });
                    result = await webhookController.handlePaymentFailed(event.data.object);
                    break;

                case 'charge.succeeded':
                    logger.info('💰 Traitement événement: charge.succeeded', { 
                        chargeId: event.data.object.id 
                    });
                    result = await webhookController.handleChargeSucceeded(event.data.object);
                    break;

                default:
                    logger.warn('⚠️ Type d\'événement webhook non géré', { 
                        eventType: event.type,
                        eventId: event.id 
                    });
                    return res.status(400).json({
                        success: false,
                        message: `Type d'événement non géré: ${event.type}`
                    });
            }

            logger.info('✅ Webhook traité avec succès', { 
                eventType: event.type,
                eventId: event.id 
            });

            return res.status(200).json(result);

        } catch (error) {
            logger.error('❌ Erreur critique dans le traitement du webhook', { 
                error: error.message,
                stack: error.stack,
                ip: req.ip 
            });

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
            
            logger.info('🔄 Début traitement paiement réussi', { 
                orderId,
                sessionId: session.id 
            });
            
            const fetchedOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: { user: true }
            });

            if (!fetchedOrder) {
                logger.error('❌ Commande introuvable pour le paiement', { 
                    orderId,
                    sessionId: session.id 
                });
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
            
            logger.info('✅ Paiement validé et email envoyé', { 
                orderId,
                userId: fetchedOrder.userId,
                userEmail: fetchedOrder.user.email,
                amount: session.amount_total / 100,
                paymentIntentId: session.payment_intent 
            });

            return {
                success: true,
                data: updatedOrder,
                message: 'Paiement validé avec succès'
            };

        } catch (error) {
            logger.error('❌ Erreur lors du traitement du paiement réussi', { 
                error: error.message,
                stack: error.stack,
                orderId: session.metadata?.orderId,
                sessionId: session.id 
            });
            throw error;
        }
    },

    async handlePaymentFailed(paymentIntent) {
        try {
            logger.warn('⚠️ Début traitement échec paiement', { 
                paymentIntentId: paymentIntent.id 
            });
            
            const fetchedOrder = await prisma.order.findFirst({
                where: { stripePaymentIntentId: paymentIntent.id }
            });

            if (!fetchedOrder) {
                logger.error('❌ Commande introuvable pour l\'échec de paiement', { 
                    paymentIntentId: paymentIntent.id 
                });
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
            
            logger.warn('⚠️ Échec paiement enregistré', { 
                orderId: fetchedOrder.id,
                userId: fetchedOrder.userId,
                errorMessage: paymentIntent.last_payment_error?.message,
                paymentIntentId: paymentIntent.id 
            });

            return {
                success: true,
                data: updatedOrder,
                message: 'Échec du paiement enregistré'
            };

        } catch (error) {
            logger.error('❌ Erreur lors du traitement de l\'échec de paiement', { 
                error: error.message,
                stack: error.stack,
                paymentIntentId: paymentIntent.id 
            });
            throw error;
        }
    },

    async handleChargeSucceeded(charge) {
        try {
            logger.info('💰 Charge réussie', { 
                chargeId: charge.id,
                amount: charge.amount / 100,
                currency: charge.currency 
            });
            
            return {
                success: true,
                data: charge,
                message: 'Charge traitée avec succès'
            };
        } catch (error) {
            logger.error('❌ Erreur lors du traitement de la charge', { 
                error: error.message,
                chargeId: charge.id 
            });
            throw error;
        }
    }
};

export default webhookController;