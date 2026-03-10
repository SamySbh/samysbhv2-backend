import { Router } from 'express';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';
import iotController from '../controllers/iot.controller.js';

const router = Router();

router.get('/metrics', protect, requireAdmin, iotController.getMetrics);

export default router;
