import { Router } from 'express';
import { matchingController } from '../controllers/matching.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/recommendations',
  authenticate,
  requireRole('STUDENT'),
  asyncHandler(matchingController.getRecommendations.bind(matchingController))
);

export default router;

