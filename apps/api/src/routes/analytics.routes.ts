import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/overview', authenticate, asyncHandler(analyticsController.getOverview.bind(analyticsController)));
router.get('/placement', authenticate, asyncHandler(analyticsController.getPlacement.bind(analyticsController)));

export default router;

