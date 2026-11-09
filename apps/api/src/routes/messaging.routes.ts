import { Router } from 'express';
import { messagingController } from '../controllers/messaging.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { chatLimiter } from '../middleware/rateLimiter.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post(
  '/:mentorshipId/messages',
  chatLimiter,
  authenticate,
  asyncHandler(messagingController.sendMessage.bind(messagingController))
);

router.get(
  '/:mentorshipId/messages',
  authenticate,
  asyncHandler(messagingController.getMessages.bind(messagingController))
);

router.post(
  '/:mentorshipId/read',
  authenticate,
  asyncHandler(messagingController.markAsRead.bind(messagingController))
);

router.post(
  '/:mentorshipId/messages/:messageId/moderation-decrypt',
  authenticate,
  requireRole('ALUMNI_RELATIONS_OFFICER', 'PLACEMENT_OFFICER', 'SUPER_ADMIN'),
  asyncHandler(messagingController.decryptForModeration.bind(messagingController))
);

export default router;

