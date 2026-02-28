import { PrismaClient } from '@prisma/client';
import StripeService from '../services/stripe.service.js';
import stripe from '../configs/stripe.config.js';

const prisma = new PrismaClient();

const paymentController = {
    async createCheckoutSession(req, res) {
        try {
            // 1. Récupération des données du corps de la requête
            const { orderId } = req.body;
            const userId = req.user.id; // On récupère l'ID de l'utilisateur depuis le middleware d'authentification

            // 2. Récupération de l'utilisateur pour avoir son stripeCustomerId
            const fetchedUser = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!fetchedUser?.stripeCustomerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Utilisateur non configuré pour le paiement'
                });
            }

            // 3. Récupération de l'order pour vérifier le montant
            const fetchedOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    orderItems: {
                        include: {
                            service: true
                        }
                    }
                }
            });

            if (!fetchedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                });
            }

            // 4. Création des line_items pour Stripe
            const orderItems = fetchedOrder.orderItems.map(orderItem => ({
                price_data: {
                    currency: process.env.STRIPE_DEFAULT_CURRENCY || 'EUR',
                    product_data: {
                        name: orderItem.service.name,
                        description: orderItem.service.description,
                    },
                    unit_amount: orderItem.unitAmount * 100, // Conversion en centimes
                },
                quantity: orderItem.quantity,
            }));

            if (!orderItems || orderItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La commande ne contient aucun article'
                });
            }
            // 5. Création de la session de paiement
            const session = await StripeService.createCheckoutSession({
                customerId: fetchedUser.stripeCustomerId,
                line_items: orderItems,
                orderId: fetchedOrder.id,
                mode: 'payment',
                successUrl: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${process.env.CLIENT_URL}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
            });

            // 6. Mise à jour de l'order avec l'ID de la session
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    stripeSessionId: session.id,
                    statusPayment: 'PENDING_DEPOSIT'
                }
            });

            // 7. Renvoi de l'URL de la session au client
            return res.status(200).json({
                success: true,
                data: { sessionUrl: session.url },
                message: 'Session de paiement créée avec succès'
            });

        } catch (error) {
            console.error('Error in createCheckoutSession:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la session de paiement'
            });
        }
    },

    // Créer une session de paiement pour l'acompte (30%)
    async createDepositSession(req, res) {
        try {
            const { id: orderId } = req.params;

            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    user: true,
                    orderItems: { include: { service: true } }
                }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                });
            }

            // Vérifier que l'acompte n'a pas déjà été payé
            if (order.depositPaidAt) {
                return res.status(400).json({
                    success: false,
                    message: 'L\'acompte a déjà été payé'
                });
            }

            // Créer la session Stripe pour l'acompte (30%)
            const session = await stripe.checkout.sessions.create({
                customer_email: order.user.email,
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Acompte (30%) - Commande #${order.id.slice(-6)}`,
                            description: `Paiement de l'acompte pour votre commande`
                        },
                        unit_amount: Math.round(order.depositAmount * 100)
                    },
                    quantity: 1
                }],
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL}/commande/${orderId}/paiement-confirme?session_id={CHECKOUT_SESSION_ID}&type=deposit`,
                cancel_url: `${process.env.CLIENT_URL}/commande/${orderId}/paiement-annule`,
                metadata: {
                    orderId: orderId,
                    paymentType: 'deposit',
                    userId: order.userId
                }
            });

            // Sauvegarder le sessionId dans la commande
            await prisma.order.update({
                where: { id: orderId },
                data: { depositStripeSessionId: session.id }
            });

            return res.status(200).json({
                success: true,
                data: {
                    sessionId: session.id,
                    url: session.url
                }
            });
        } catch (error) {
            console.error('Erreur création session acompte:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Créer une session de paiement pour le solde (70%)
    async createFinalSession(req, res) {
        try {
            const { id: orderId } = req.params;

            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    user: true,
                    orderItems: { include: { service: true } }
                }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                });
            }

            // Vérifier que l'acompte a été payé
            if (!order.depositPaidAt) {
                return res.status(400).json({
                    success: false,
                    message: 'L\'acompte n\'a pas encore été payé'
                });
            }

            // Vérifier que le solde n'a pas déjà été payé
            if (order.finalPaidAt) {
                return res.status(400).json({
                    success: false,
                    message: 'Le solde a déjà été payé'
                });
            }

            // Calculer le montant du solde (70%)
            const finalAmount = order.totalAmount - order.depositAmount;

            // Créer la session Stripe pour le solde
            const session = await stripe.checkout.sessions.create({
                customer_email: order.user.email,
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Solde (70%) - Commande #${order.id.slice(-6)}`,
                            description: `Paiement final pour votre commande`
                        },
                        unit_amount: Math.round(finalAmount * 100)
                    },
                    quantity: 1
                }],
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL}/commande/${orderId}/paiement-confirme?session_id={CHECKOUT_SESSION_ID}&type=final`,
                cancel_url: `${process.env.CLIENT_URL}/commande/${orderId}/paiement-annule`,
                metadata: {
                    orderId: orderId,
                    paymentType: 'final',
                    userId: order.userId
                }
            });

            // Sauvegarder le sessionId dans la commande
            await prisma.order.update({
                where: { id: orderId },
                data: { finalStripeSessionId: session.id }
            });

            return res.status(200).json({
                success: true,
                data: {
                    sessionId: session.id,
                    url: session.url
                }
            });
        } catch (error) {
            console.error('Erreur création session solde:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

export default paymentController;