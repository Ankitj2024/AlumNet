import { Router } from 'express';
import { messagingController } from '../controllers/messaging.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post(
  '/:mentorshipId/messages',
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

export default router;

