import { Router } from 'express';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';
import projectRequestController from '../controllers/project-request.controller.js';
import orderController from '../controllers/order.controller.js';

const router = Router();

// Toutes les routes admin sont protégées
router.use(protect, requireAdmin);

// === Demandes de projet ===
// GET /admin/project-requests - Lister toutes les demandes
router.get('/project-requests', projectRequestController.findAll.bind(projectRequestController));

// PATCH /admin/project-requests/:id - Mettre à jour le statut
router.patch('/project-requests/:id', projectRequestController.updateStatus.bind(projectRequestController));

// === Commandes ===
// GET /admin/orders - Lister toutes les commandes
router.get('/orders', orderController.getAllOrders);

// POST /admin/orders - Créer une commande manuellement
router.post('/orders', orderController.createManualOrder);

// PATCH /admin/orders/:id/status - Mettre à jour le statut d'une commande
router.patch('/orders/:id/status', orderController.updateOrderStatus);

export default router;
