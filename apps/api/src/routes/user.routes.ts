import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GDPR / DPDP Right to Data Portability
router.get(
  '/export',
  authenticate,
  asyncHandler(userController.exportMyData.bind(userController))
);

// GDPR / DPDP Right to Erasure (Soft delete with 30-day purge schedule)
router.delete(
  '/me',
  authenticate,
  asyncHandler(userController.deleteMyAccount.bind(userController))
);

// Cancel deletion
router.post(
  '/cancel-deletion',
  authenticate,
  asyncHandler(userController.cancelDeletion.bind(userController))
);

export default router;
