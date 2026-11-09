import { Router } from 'express';
import { programmeSettingsController } from '../controllers/programmeSettings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Retrieve active settings (Officers & Admin)
router.get(
  '/',
  authenticate,
  requireRole('ALUMNI_RELATIONS_OFFICER', 'PLACEMENT_OFFICER', 'SUPER_ADMIN'),
  asyncHandler(programmeSettingsController.getSettings.bind(programmeSettingsController))
);

// Update settings (Strictly Super Admin only, audited)
router.put(
  '/',
  authenticate,
  requireRole('SUPER_ADMIN'),
  asyncHandler(programmeSettingsController.updateSettings.bind(programmeSettingsController))
);

// Retrieve change history (Officers & Admin)
router.get(
  '/history',
  authenticate,
  requireRole('ALUMNI_RELATIONS_OFFICER', 'PLACEMENT_OFFICER', 'SUPER_ADMIN'),
  asyncHandler(programmeSettingsController.getHistory.bind(programmeSettingsController))
);

export default router;
