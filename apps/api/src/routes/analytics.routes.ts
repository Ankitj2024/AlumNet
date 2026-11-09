import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const officerRoles = ['ALUMNI_RELATIONS_OFFICER', 'PLACEMENT_OFFICER', 'SUPER_ADMIN'] as const;

// 1. Overview Metrics & CSV Export
router.get(
  '/overview',
  authenticate,
  requireRole(...officerRoles),
  asyncHandler(analyticsController.getOverview.bind(analyticsController))
);
router.get(
  '/overview/export',
  authenticate,
  requireRole(...officerRoles),
  asyncHandler(analyticsController.exportOverviewCsv.bind(analyticsController))
);

// 2. Placement Correlation & CSV Export
router.get(
  '/placement',
  authenticate,
  requireRole(...officerRoles),
  asyncHandler(analyticsController.getPlacement.bind(analyticsController))
);
router.get(
  '/placement/export',
  authenticate,
  requireRole(...officerRoles),
  asyncHandler(analyticsController.exportPlacementCsv.bind(analyticsController))
);

// 3. Placement Reporting & Registrar Batch Import
router.post(
  '/placements/self-report',
  authenticate,
  requireRole('STUDENT'),
  asyncHandler(analyticsController.selfReportPlacement.bind(analyticsController))
);
router.post(
  '/placements/import',
  authenticate,
  requireRole(...officerRoles),
  asyncHandler(analyticsController.importRegistrarPlacements.bind(analyticsController))
);

// 4. Officer Audit Log Viewer
router.get(
  '/audit-logs',
  authenticate,
  requireRole(...officerRoles),
  asyncHandler(analyticsController.getAuditLogs.bind(analyticsController))
);

// 5. Officer Moderation Queue
router.get(
  '/moderation-queue',
  authenticate,
  requireRole(...officerRoles),
  asyncHandler(analyticsController.getModerationQueue.bind(analyticsController))
);

export default router;
