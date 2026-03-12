import { Router } from 'express';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';
import iotController from '../controllers/iot.controller.js';
import iotAiController from '../controllers/iot.ai.controller.js';

const router = Router();

router.get('/metrics', protect, requireAdmin, iotController.getMetrics);
router.post('/analyze', protect, requireAdmin, iotAiController.analyzeMetrics);

export default router;
