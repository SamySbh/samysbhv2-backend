import { Router } from 'express';
import projectRequestController from '../controllers/project-request.controller.js';
import { protect, requireAdmin, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes publiques (optionalAuth attache req.user si connecté, sans bloquer sinon)
router.post('/', optionalAuth, projectRequestController.create.bind(projectRequestController));
router.get('/:id', projectRequestController.findOne.bind(projectRequestController));

// Routes admin (protégées)
router.get('/admin/list', protect, requireAdmin, projectRequestController.findAll.bind(projectRequestController));
router.patch('/admin/:id/status', protect, requireAdmin, projectRequestController.updateStatus.bind(projectRequestController));

export default router;
