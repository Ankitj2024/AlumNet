import { Router } from 'express';
import { studentController } from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { updateStudentProfileSchema } from '@p11/validation';

const router = Router();

router.get(
  '/profile/me',
  authenticate,
  requireRole('STUDENT'),
  asyncHandler(studentController.getMyProfile.bind(studentController))
);

router.put(
  '/profile/me',
  authenticate,
  requireRole('STUDENT'),
  validateBody(updateStudentProfileSchema),
  asyncHandler(studentController.updateMyProfile.bind(studentController))
);

export default router;

