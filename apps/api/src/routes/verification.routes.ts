import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { submitVerificationSchema, reviewVerificationSchema } from '@p11/validation';

const router = Router();

// Alumnus submission routes
router.post(
  '/submit',
  authenticate,
  requireRole('ALUMNI_MENTOR'),
  validateBody(submitVerificationSchema),
  asyncHandler(verificationController.submit.bind(verificationController))
);

router.get(
  '/status',
  authenticate,
  requireRole('ALUMNI_MENTOR'),
  asyncHandler(verificationController.getStatus.bind(verificationController))
);

// Officer review & management routes
router.get(
  '/queue',
  authenticate,
  requireRole('ALUMNI_RELATIONS_OFFICER', 'SUPER_ADMIN'),
  asyncHandler(verificationController.getQueue.bind(verificationController))
);

router.post(
  '/:id/review',
  authenticate,
  requireRole('ALUMNI_RELATIONS_OFFICER', 'SUPER_ADMIN'),
  validateBody(reviewVerificationSchema),
  asyncHandler(verificationController.review.bind(verificationController))
);

router.post(
  '/batch-import',
  authenticate,
  requireRole('ALUMNI_RELATIONS_OFFICER', 'SUPER_ADMIN'),
  asyncHandler(verificationController.batchImportCsv.bind(verificationController))
);

export default router;

