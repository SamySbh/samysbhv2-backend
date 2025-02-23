import { PrismaClient } from '@prisma/client';
import StripeService from '../services/stripe.service.js';

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
                    currency: 'EUR',
                    product_data: {
                        name: orderItem.service.name,
                        description: orderItem.service.description,
                    },
                    unit_amount: orderItem.unitAmount * 100, // Conversion en centimes
                },
                quantity: orderItem.quantity,
            }));

            // 5. Création de la session de paiement
            const session = await StripeService.createCheckoutSession({
                customerId: fetchedUser.stripeCustomerId,
                lineItems : orderItems,
                orderId: fetchedOrder.id,
                mode: 'payment',
                successUrl: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
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
    }
};

export default paymentController;