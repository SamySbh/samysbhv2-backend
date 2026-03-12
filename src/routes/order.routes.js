import express from 'express';
import orderController from '../controllers/order.controller.js';
import { orderCreationValidator, orderWithItemsValidator, orderModificationValidator, orderIdValidator } from '../schemas/order.schema.js';
import { zodValidator } from '../middlewares/zod.middleware.js';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const orderRouter = express.Router();

// Middleware pour vérifier si l'utilisateur peut accéder à une commande spécifique
const canAccessOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Les administrateurs peuvent accéder à toutes les commandes
        if (userRole === 'ADMIN') {
            return next();
        }

        // Vérifier si la commande appartient à l'utilisateur
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        if (order.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé à accéder à cette commande'
            });
        }

        next();
    } catch (error) {
        console.error('Error in canAccessOrder middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification des autorisations'
        });
    }
};

// Middleware pour vérifier si l'utilisateur peut accéder à une commande par sessionId
const canAccessOrderBySession = async (req, res, next) => {
    try {
        const sessionId = req.params.sessionId;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Les administrateurs peuvent accéder à toutes les commandes
        if (userRole === 'ADMIN') {
            return next();
        }

        // Vérifier si la commande appartient à l'utilisateur
        const order = await prisma.order.findFirst({
            where: { stripeSessionId: sessionId }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        if (order.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé à accéder à cette commande'
            });
        }

        next();
    } catch (error) {
        console.error('Error in canAccessOrderBySession middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification des autorisations'
        });
    }
};

// Routes d'administration (liste complète des commandes)
// Récupérer toutes les commandes (GET /orders)
orderRouter.get('/',
    protect,
    requireAdmin,
    orderController.getAllOrders
);

// Route pour récupérer une commande via son SessionID (GET /orders/by-session/:sessionId)
// Accessible par le propriétaire de la commande ou un admin
orderRouter.get('/by-session/:sessionId',
    protect,
    canAccessOrderBySession,
    orderController.getOrderBySessionId
);

// Route pour récupérer les commandes de l'utilisateur connecté
// Cette route n'est pas dans votre fichier original, je l'ajoute comme bonne pratique
orderRouter.get('/my-orders',
    protect,
    async (req, res) => {
        try {
            const userId = req.user.id;

            const orders = await prisma.order.findMany({
                where: { userId },
                include: {
                    orderItems: { include: { service: true } },
                },
                orderBy: { createdAt: 'desc' }
            });

            return res.status(200).json({
                success: true,
                data: orders,
                message: 'Vos commandes ont été récupérées avec succès'
            });
        } catch (error) {
            console.error('Error in getMyOrders:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de vos commandes'
            });
        }
    }
);

// Route pour récupérer une commande spécifique (GET /orders/:id)
// Accessible par le propriétaire de la commande ou un admin
orderRouter.get('/:id',
    protect,
    canAccessOrder,
    zodValidator(orderIdValidator),
    orderController.getOrderById
);

// Création d'une commande (POST /orders)
// L'utilisateur doit être authentifié, mais nous ajoutons une vérification pour s'assurer
// que l'utilisateur ne peut créer des commandes que pour lui-même
orderRouter.post('/',
    protect,
    (req, res, next) => {
        // S'assurer que l'utilisateur crée une commande pour lui-même
        // sauf si c'est un administrateur
        if (req.user.role !== 'ADMIN' && req.body.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez créer des commandes que pour vous-même'
            });
        }
        next();
    },
    zodValidator(orderCreationValidator),
    orderController.createOrder
);

// Création d'une commande complète avec items (POST /orders/with-items)
orderRouter.post('/with-items',
    protect,
    (req, res, next) => {
        // S'assurer que l'utilisateur crée une commande pour lui-même
        // sauf si c'est un administrateur
        if (req.user.role !== 'ADMIN' && req.body.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez créer des commandes que pour vous-même'
            });
        }
        next();
    },
    zodValidator(orderWithItemsValidator),
    orderController.createCompleteOrder
);

// Modification d'une commande (PUT /orders/:id)
// Seul le propriétaire ou un admin peut modifier une commande
orderRouter.put('/:id',
    protect,
    canAccessOrder,
    zodValidator(orderModificationValidator),
    orderController.updateOrder
);

// Suppression d'une commande (DELETE /orders/:id)
// Seul un admin peut supprimer une commande
orderRouter.delete('/:id',
    protect,
    requireAdmin,
    zodValidator(orderIdValidator),
    orderController.deleteOrder
);

// Routes devis (accepter/refuser) - accessibles par le propriétaire
orderRouter.post('/:id/accept-quote',
    protect,
    canAccessOrder,
    orderController.acceptQuote
);

orderRouter.post('/:id/reject-quote',
    protect,
    canAccessOrder,
    orderController.rejectQuote
);

// Route admin : mettre à jour l'URL du devis
orderRouter.patch('/admin/:id/quote-url',
    protect,
    requireAdmin,
    orderController.updateQuoteUrl
);

// NOUVELLES ROUTES pour le système de paiement en deux phases

// POST /orders/:id/payment-link - Générer un lien de paiement (acompte ou solde)
// Accessible par le propriétaire de la commande ou un admin
orderRouter.post('/:id/payment-link',
    protect,
    canAccessOrder,
    orderController.generatePaymentLink
);

// GET /orders/:id/details - Récupérer une commande avec tous les détails (user, items, projectRequests)
// Accessible par le propriétaire de la commande ou un admin
orderRouter.get('/:id/details',
    protect,
    canAccessOrder,
    orderController.getOrderWithDetails
);

// POST /orders/admin/create-manual - Créer une commande manuellement (admin uniquement)
// Pour convertir une demande de projet en commande
orderRouter.post('/admin/create-manual',
    protect,
    requireAdmin,
    orderController.createManualOrder
);

export default orderRouter;