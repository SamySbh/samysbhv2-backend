import { PrismaClient } from '@prisma/client';
import stripeSDK from '../configs/stripe.config.js';

const prisma = new PrismaClient();

const OrderService = {
    async createOrderWithItems(orderData, orderItems) {
        return prisma.$transaction(async (tx) => {
            // Créer la commande
            const order = await tx.order.create({
                data: orderData
            });

            // Créer les items de commande
            const items = await Promise.all(
                orderItems.map(item => tx.orderItem.create({
                    data: {
                        ...item,
                        orderId: order.id
                    }
                }))
            );

            return {
                order,
                items
            };
        });
    },

    // Créer une session de paiement (acompte ou solde)
    async createPaymentSession(orderId, paymentType) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { user: true, orderItems: { include: { service: true } } },
            });

            if (!order) {
                throw new Error('Commande non trouvée');
            }

            // Calculer le montant selon le type de paiement
            const amount = paymentType === 'deposit'
                ? order.depositAmount
                : (order.totalAmount - order.depositAmount);

            // Créer la session Stripe
            const session = await stripeSDK.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: process.env.STRIPE_DEFAULT_CURRENCY || 'eur',
                        product_data: {
                            name: paymentType === 'deposit'
                                ? `Acompte 30% - Commande #${order.id.slice(-6)}`
                                : `Solde 70% - Commande #${order.id.slice(-6)}`,
                            description: order.orderItems.map(item =>
                                `${item.quantity}x ${item.service.name}`
                            ).join(', '),
                        },
                        unit_amount: Math.round(Number(amount) * 100), // En centimes
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL}/commande/${orderId}/paiement-confirme?type=${paymentType}`,
                cancel_url: `${process.env.CLIENT_URL}/commande/${orderId}`,
                customer_email: order.user.email,
                metadata: {
                    orderId,
                    paymentType,
                },
                payment_intent_data: {
                    metadata: {
                        orderId,
                        paymentType,
                    },
                },
            });

            // Sauvegarder le sessionId dans la commande
            if (paymentType === 'deposit') {
                await prisma.order.update({
                    where: { id: orderId },
                    data: { depositStripeSessionId: session.id },
                });
            } else {
                await prisma.order.update({
                    where: { id: orderId },
                    data: { finalStripeSessionId: session.id },
                });
            }

            return {
                sessionId: session.id,
                paymentUrl: session.url,
                amount: amount,
            };
        } catch (error) {
            throw new Error(`Erreur création session paiement: ${error.message}`);
        }
    },

    // Créer une commande manuellement (admin)
    async createManualOrder(data) {
        try {
            const depositAmount = data.totalAmount * 0.3; // 30%

            const order = await prisma.order.create({
                data: {
                    userId: data.userId,
                    totalAmount: data.totalAmount,
                    depositAmount: depositAmount,
                    deadlineDate: data.dueDate ? new Date(data.dueDate) : null,
                    statusMain: 'NEW',
                    statusPayment: 'PENDING_DEPOSIT',
                },
            });

            // Lier la demande de projet à la commande si fournie
            if (data.projectRequestId) {
                await prisma.projectRequest.update({
                    where: { id: data.projectRequestId },
                    data: {
                        orderId: order.id,
                        status: 'ACCEPTED',
                    },
                });
            }

            return order;
        } catch (error) {
            throw new Error(`Erreur création commande manuelle: ${error.message}`);
        }
    },

    // Accepter un devis
    async acceptQuote(orderId) {
        try {
            return await prisma.order.update({
                where: { id: orderId },
                data: { statusMain: 'VALIDATED' },
                include: { user: true, projectRequests: true },
            });
        } catch (error) {
            throw new Error(`Erreur acceptation devis: ${error.message}`);
        }
    },

    // Refuser un devis
    async rejectQuote(orderId, reason) {
        try {
            return await prisma.order.update({
                where: { id: orderId },
                data: {
                    statusMain: 'ARCHIVED',
                    quoteRejectedReason: reason || null,
                },
                include: { user: true, projectRequests: true },
            });
        } catch (error) {
            throw new Error(`Erreur refus devis: ${error.message}`);
        }
    },

    // Mettre a jour l'URL du devis (admin)
    async updateQuoteUrl(orderId, quoteUrl) {
        try {
            return await prisma.order.update({
                where: { id: orderId },
                data: {
                    quoteUrl,
                    statusMain: 'VALIDATED',
                },
                include: { user: true, projectRequests: true },
            });
        } catch (error) {
            throw new Error(`Erreur mise a jour URL devis: ${error.message}`);
        }
    },

    // Récupérer une commande par ID
    async findById(id) {
        try {
            return await prisma.order.findUnique({
                where: { id },
                include: {
                    user: true,
                    orderItems: { include: { service: true } },
                    projectRequests: true,
                },
            });
        } catch (error) {
            throw new Error(`Erreur récupération commande: ${error.message}`);
        }
    },
};

export default OrderService;