import { Router } from 'express';
import { requestController } from '../controllers/request.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createMentorshipRequestSchema } from '@p11/validation';

const router = Router();

// Student request creation & management
router.post(
  '/',
  authenticate,
  requireRole('STUDENT'),
  validateBody(createMentorshipRequestSchema),
  asyncHandler(requestController.create.bind(requestController))
);

router.get(
  '/sent',
  authenticate,
  requireRole('STUDENT'),
  asyncHandler(requestController.getSent.bind(requestController))
);

router.post(
  '/:id/cancel',
  authenticate,
  requireRole('STUDENT'),
  asyncHandler(requestController.cancel.bind(requestController))
);

// Mentor request review
router.get(
  '/incoming',
  authenticate,
  requireRole('ALUMNI_MENTOR'),
  asyncHandler(requestController.getIncoming.bind(requestController))
);

router.post(
  '/:id/accept',
  authenticate,
  requireRole('ALUMNI_MENTOR'),
  asyncHandler(requestController.accept.bind(requestController))
);

router.post(
  '/:id/decline',
  authenticate,
  requireRole('ALUMNI_MENTOR'),
  asyncHandler(requestController.decline.bind(requestController))
);

export default router;

