import { Router } from 'express';
import { alumnusController } from '../controllers/alumnus.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { updateMentorProfileSchema, updateMentorCapacitySchema } from '@p11/validation';

const router = Router();

// Mentor self-profile & capacity
router.get(
  '/profile/me',
  authenticate,
  requireRole('ALUMNI_MENTOR'),
  asyncHandler(alumnusController.getMyProfile.bind(alumnusController))
);

router.put(
  '/profile/me',
  authenticate,
  requireRole('ALUMNI_MENTOR'),
  validateBody(updateMentorProfileSchema),
  asyncHandler(alumnusController.updateMyProfile.bind(alumnusController))
);

router.get(
  '/capacity',
  authenticate,
  requireRole('ALUMNI_MENTOR'),
  asyncHandler(alumnusController.getMyCapacity.bind(alumnusController))
);

router.put(
  '/capacity',
  authenticate,
  requireRole('ALUMNI_MENTOR'),
  validateBody(updateMentorCapacitySchema),
  asyncHandler(alumnusController.updateMyCapacity.bind(alumnusController))
);

// Public / Student Search for verified mentors
router.get(
  '/mentors',
  authenticate,
  asyncHandler(alumnusController.searchMentors.bind(alumnusController))
);

export default router;

