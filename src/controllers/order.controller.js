import { PrismaClient } from '@prisma/client';
import OrderService from '../services/order.service.js';
import EmailService from '../services/email.service.js';
import logger from '../configs/logger.config.js';

const prisma = new PrismaClient()

const orderController = {
    async getAllOrders(req, res) {
        try {
            const orders = await prisma.order.findMany();
            if (!orders || orders.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune commande trouvée'
                });
            };
            return res.status(200).json({
                success: true,
                data: orders,
                message: 'Les commandes ont bien été récupérées'
            });
        }

        catch (error) {
            console.error('Error in getAllOrders :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des commandes'
            });
        }
    },

    async getOrderById(req, res) {
        try {
            const orderId = req.params.id;
            const order = await prisma.order.findUnique({
                where: {
                    id: orderId
                },
                include: {
                    orderItems: {
                        include: {
                            service: true  // Inclure aussi les informations du service
                        }
                    }
                }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune commande trouvée'
                })
            };

            return res.status(200).json({
                success: true,
                data: { order },
                message: 'La commande a bien été récupérée'
            });
        } catch (error) {
            console.error('Error in getOrderById :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de la commande'
            });
        }
    },

    // Dans order.controller.js, ajoutez cette méthode
    async getOrderBySessionId(req, res) {
        try {
            const sessionId = req.params.sessionId;
            const order = await prisma.order.findFirst({
                where: {
                    stripeSessionId: sessionId
                }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune commande trouvée avec ce sessionId'
                });
            }

            return res.status(200).json({
                success: true,
                data: { order },
                message: 'La commande a bien été récupérée'
            });

        } catch (error) {
            console.error('Error in getOrderBySessionId:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de la commande'
            });
        }
    },

    
    async createOrder(req, res) {
        try {
            const createdOrder = await prisma.order.create({
                data: {
                    statusMain: req.body.statusMain,
                    statusPayment: req.body.statusPayment,
                    totalAmount: req.body.totalAmount,
                    depositAmount: req.body.depositAmount,
                    deadlineDate: req.body.deadlineDate,
                    userId: req.body.userId
                }
            });
            return res.status(201).json({
                success: true,
                data: createdOrder,
                message: 'La commande bien été créé'
            });
        } catch (error) {
            console.error('Error in createOrder :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la commande'
            });
        }
    },

    async createCompleteOrder(req, res) {
        try {
            const { orderItems, ...orderData } = req.body;

            // Validation basique
            if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La commande doit contenir au moins un article'
                });
            }

            // Utilise le service pour créer la commande avec ses items
            const result = await OrderService.createOrderWithItems(orderData, orderItems);

            return res.status(201).json({
                success: true,
                data: result,
                message: 'La commande et ses articles ont bien été créés'
            });
        } catch (error) {
            console.error('Error in createCompleteOrder:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la commande complète'
            });
        }
    },

    async updateOrder(req, res) {
        try {
            const orderId = req.params.id;
            const fetchedOrder = await prisma.order.findUnique({
                where: {
                    id: orderId
                }
            });
            if (!fetchedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                })
            }

            const updatedOrder = await prisma.order.update({
                where: {
                    id: orderId
                },
                data: {
                    statusMain: req.body.statusMain,
                    statusPayment: req.body.statusPayment,
                    totalAmount: req.body.totalAmount,
                    depositAmount: req.body.depositAmount,
                    deadlineDate: req.body.deadlineDate,
                    userId: req.body.userId
                }
            });

            return res.status(200).json({
                success: true,
                data: updatedOrder,
                message: 'La commande a bien été mis à jour'
            });
        } catch (error) {
            console.error('Error in updateOrder :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la modification de la commande'
            });
        }
    },
    async deleteOrder(req, res) {
        const orderId = req.params.id
        try {
            const deletedOrder = await prisma.order.delete({
                where: {
                    id: orderId
                }
            });
            if (!deletedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Aucune commande trouvée'
                });
            }
            return res.status(200).json({
                success: true,
                data: deletedOrder,
                message: 'La commande a bien été supprimé'
            })
        } catch (error) {
            console.error('Error in deleteOrder :', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la commande'
            })
        }
    },

    // POST /api/orders/:id/payment-link - Générer lien de paiement
    async generatePaymentLink(req, res) {
        try {
            const { id } = req.params;
            const { paymentType } = req.body; // 'deposit' ou 'final'

            if (!['deposit', 'final'].includes(paymentType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Type de paiement invalide (deposit ou final)',
                });
            }

            const paymentSession = await OrderService.createPaymentSession(id, paymentType);

            return res.status(200).json({
                success: true,
                data: paymentSession,
                message: 'Lien de paiement généré avec succès'
            });
        } catch (error) {
            console.error('Error in generatePaymentLink:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // POST /api/orders/admin/create-manual - Créer commande manuelle (admin)
    async createManualOrder(req, res) {
        try {
            const order = await OrderService.createManualOrder(req.body);

            return res.status(201).json({
                success: true,
                data: order,
                message: 'Commande créée avec succès',
            });
        } catch (error) {
            console.error('Error in createManualOrder:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // PATCH /api/admin/orders/:id/status - Mettre à jour le statut principal (admin)
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Le statut est requis',
                });
            }

            const fetchedOrder = await prisma.order.findUnique({
                where: { id }
            });

            if (!fetchedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                });
            }

            const updatedOrder = await prisma.order.update({
                where: { id },
                data: {
                    statusMain: status,
                    updatedAt: new Date()
                }
            });

            return res.status(200).json({
                success: true,
                data: updatedOrder,
                message: 'Statut de la commande mis à jour'
            });
        } catch (error) {
            console.error('Error in updateOrderStatus:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // POST /api/orders/:id/accept-quote - Accepter un devis
    async acceptQuote(req, res) {
        try {
            const { id } = req.params;
            const order = await OrderService.acceptQuote(id);

            return res.status(200).json({
                success: true,
                data: order,
                message: 'Devis accepté avec succès',
            });
        } catch (error) {
            console.error('Error in acceptQuote:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // POST /api/orders/:id/reject-quote - Refuser un devis
    async rejectQuote(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const order = await OrderService.rejectQuote(id, reason);

            // Envoyer email a l'admin (non bloquant)
            if (order.user) {
                EmailService.sendQuoteRejectedEmailToAdmin(
                    order.user.email,
                    `${order.user.firstName} ${order.user.lastName}`,
                    order.id,
                    reason
                ).catch((emailError) => {
                    console.error('Erreur envoi email admin:', emailError);
                });
            }

            return res.status(200).json({
                success: true,
                data: order,
                message: 'Devis refusé',
            });
        } catch (error) {
            console.error('Error in rejectQuote:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // PATCH /api/orders/admin/:id/quote-url - Mettre a jour l'URL du devis (admin)
    async updateQuoteUrl(req, res) {
        try {
            const { id } = req.params;
            const { quoteUrl } = req.body;

            if (!quoteUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'L\'URL du devis est requise',
                });
            }

            const order = await OrderService.updateQuoteUrl(id, quoteUrl);

            // Envoyer email au client (non bloquant)
            if (order.user) {
                EmailService.sendQuoteReadyEmail(
                    order.user.email,
                    `${order.user.firstName} ${order.user.lastName}`,
                    order.id,
                    order.totalAmount,
                    quoteUrl
                ).catch((emailError) => {
                    console.error('Erreur envoi email client:', emailError);
                });
            }

            return res.status(200).json({
                success: true,
                data: order,
                message: 'Devis mis à jour et email envoyé',
            });
        } catch (error) {
            console.error('Error in updateQuoteUrl:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },

    // PATCH /api/orders/:id/validate-quote - Valider le devis (admin)
    async validateQuote(req, res) {
        try {
            const { id } = req.params;
            const { totalAmount, depositAmount } = req.body;

            if (!totalAmount || !depositAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'totalAmount et depositAmount sont requis'
                });
            }

            const updatedOrder = await OrderService.validateQuote(id, totalAmount, depositAmount);

            // Envoyer un email au client pour l'informer que son devis est prêt
            try {
                await EmailService.sendQuoteValidated(
                    updatedOrder.user.email,
                    updatedOrder.user.firstName,
                    updatedOrder.id,
                    updatedOrder.totalAmount,
                    updatedOrder.depositAmount
                );
            } catch (emailError) {
                logger.warn('Email de validation devis non envoyé', { error: emailError.message });
            }

            return res.status(200).json({
                success: true,
                data: updatedOrder,
                message: 'Devis validé avec succès'
            });
        } catch (error) {
            logger.error('Error in validateQuote:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // GET /api/orders/:id/details - Récupérer une commande avec tous les détails
    async getOrderWithDetails(req, res) {
        try {
            const { id } = req.params;
            const order = await OrderService.findById(id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée',
                });
            }

            return res.status(200).json({
                success: true,
                data: order,
            });
        } catch (error) {
            console.error('Error in getOrderWithDetails:', error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}

export default orderController;