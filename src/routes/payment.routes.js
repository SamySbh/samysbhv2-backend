import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import webhookController from '../controllers/payment.webhook.controller.js';
import stripeWebhookMiddleware from '../middlewares/stripe.middleware.js';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';

// Routeur pour les paiements (authentification requise)
const paymentRouter = express.Router();

// Routeur pour les webhooks (aucune authentification - sécurisé par signature Stripe)
const webhookRouter = express.Router();

// Route pour créer une session de paiement - Accessible aux utilisateurs authentifiés
// L'utilisateur ne peut créer une session que pour ses propres commandes
paymentRouter.post('/create-checkout-session',
    protect,
    async (req, res, next) => {
        try {
            // Vérifier si la commande appartient bien à l'utilisateur connecté
            // Note: Cette vérification suppose que vous avez accès à l'orderId dans req.body
            if (!req.body || !req.body.orderId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de commande manquant'
                });
            }

            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();

            const order = await prisma.order.findUnique({
                where: { id: req.body.orderId }
            });

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Commande non trouvée'
                });
            }

            // Vérifier si l'utilisateur est propriétaire de la commande ou admin
            if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Vous n\'êtes pas autorisé à effectuer cette action'
                });
            }

            // Si tout est OK, passer au contrôleur
            next();
        } catch (error) {
            console.error('Erreur de vérification de paiement:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification de la commande'
            });
        }
    },
    paymentController.createCheckoutSession
);

// Route administrative pour consulter les sessions de paiement
paymentRouter.get('/sessions',
    protect,
    requireAdmin,
    paymentController.getAllPaymentSessions || ((req, res) => {
        // Implémentation temporaire si la méthode n'existe pas encore
        res.status(501).json({
            success: false,
            message: 'Fonctionnalité non implémentée'
        });
    })
);

// Webhook appelé par Stripe - Aucune authentification JWT
// La sécurité est assurée par la vérification de la signature Stripe
webhookRouter.post('/webhook',
    stripeWebhookMiddleware,
    webhookController.handleWebhook
);

export { paymentRouter, webhookRouter };