import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// Get user notifications & unread count
router.get('/', asyncHandler(notificationController.getNotifications.bind(notificationController)));

// Mark single notification as read
router.patch(
  '/:id/read',
  asyncHandler(notificationController.markAsRead.bind(notificationController))
);

// Mark all as read
router.post(
  '/read-all',
  asyncHandler(notificationController.markAllAsRead.bind(notificationController))
);

// Preferences
router.get(
  '/preferences',
  asyncHandler(notificationController.getPreferences.bind(notificationController))
);

router.put(
  '/preferences',
  asyncHandler(notificationController.updatePreferences.bind(notificationController))
);

export default router;
