import express from 'express';
import orderItemController from '../controllers/order-item.controller.js';
import { orderItemCreationValidator, orderItemModificationValidator, orderItemIdValidator } from '../schemas/orderItem.schema.js';
import { zodValidator } from '../middlewares/zod.middleware.js';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const orderItemRouter = express.Router();

// Middleware pour vérifier si l'utilisateur peut accéder à un item de commande
const canAccessOrderItem = async (req, res, next) => {
    try {
        const orderItemId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Les administrateurs peuvent accéder à tous les items
        if (userRole === 'ADMIN') {
            return next();
        }

        // Récupérer l'item de commande et sa commande associée
        const orderItem = await prisma.orderItem.findUnique({
            where: { id: orderItemId },
            include: { order: true }
        });

        if (!orderItem) {
            return res.status(404).json({
                success: false,
                message: 'Item de commande non trouvé'
            });
        }

        // Vérifier si la commande associée appartient à l'utilisateur
        if (orderItem.order.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas autorisé à accéder à cet item de commande'
            });
        }

        // Stocker l'orderItem pour éviter de le récupérer à nouveau dans le contrôleur
        req.orderItem = orderItem;
        next();
    } catch (error) {
        console.error('Error in canAccessOrderItem middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification des autorisations'
        });
    }
};

// Middleware pour vérifier si l'utilisateur peut créer/modifier un item pour une commande
const canManageOrderItem = async (req, res, next) => {
    try {
        const orderId = req.body.orderId;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Les administrateurs peuvent gérer tous les items
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
                message: 'Vous n\'êtes pas autorisé à gérer les items de cette commande'
            });
        }

        // Stocker l'order pour éviter de le récupérer à nouveau dans le contrôleur
        req.order = order;
        next();
    } catch (error) {
        console.error('Error in canManageOrderItem middleware:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification des autorisations'
        });
    }
};

// Route pour récupérer tous les items (réservée aux administrateurs)
orderItemRouter.get('/',
    protect,
    requireAdmin,
    orderItemController.getAllOrderItems
);

// Route pour récupérer les items d'une commande spécifique
// Cette route n'était pas dans votre fichier d'origine, mais c'est une bonne pratique
orderItemRouter.get('/by-order/:orderId',
    protect,
    async (req, res, next) => {
        try {
            const orderId = req.params.orderId;
            const userId = req.user.id;
            const userRole = req.user.role;

            // Les administrateurs peuvent voir tous les items
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
                    message: 'Vous n\'êtes pas autorisé à accéder aux items de cette commande'
                });
            }

            // Stocker l'order pour éviter de le récupérer à nouveau dans le contrôleur
            req.order = order;
            next();
        } catch (error) {
            console.error('Error in by-order middleware:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification des autorisations'
            });
        }
    },
    async (req, res) => {
        try {
            const orderId = req.params.orderId;

            const orderItems = await prisma.orderItem.findMany({
                where: { orderId },
                include: { service: true }
            });

            return res.status(200).json({
                success: true,
                data: orderItems,
                message: 'Items de commande récupérés avec succès'
            });
        } catch (error) {
            console.error('Error in getOrderItemsByOrderId:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des items de commande'
            });
        }
    }
);

// Route pour récupérer un item spécifique
orderItemRouter.get('/:id',
    protect,
    canAccessOrderItem,
    zodValidator(orderItemIdValidator),
    orderItemController.getOrderItemById
);

// Route pour créer un item
orderItemRouter.post('/',
    protect,
    canManageOrderItem,
    zodValidator(orderItemCreationValidator),
    orderItemController.createOrderItem
);

// Route pour modifier un item
orderItemRouter.put('/:id',
    protect,
    canAccessOrderItem,
    zodValidator(orderItemModificationValidator),
    orderItemController.updateOrderItem
);

// Route pour supprimer un item
orderItemRouter.delete('/:id',
    protect,
    canAccessOrderItem,
    zodValidator(orderItemIdValidator),
    orderItemController.deleteOrderItem
);

export default orderItemRouter;