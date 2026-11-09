import { Router } from 'express';
import authRoutes from './auth.routes.js';
import verificationRoutes from './verification.routes.js';
import alumnusRoutes from './alumnus.routes.js';
import studentRoutes from './student.routes.js';
import matchingRoutes from './matching.routes.js';
import requestRoutes from './request.routes.js';
import mentorshipRoutes from './mentorship.routes.js';
import messagingRoutes from './messaging.routes.js';
import analyticsRoutes from './analytics.routes.js';
import programmeSettingsRoutes from './programmeSettings.routes.js';
import notificationRoutes from './notification.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/alumni/verification', verificationRoutes);
router.use('/alumni', alumnusRoutes);
router.use('/students', studentRoutes);
router.use('/matching', matchingRoutes);
router.use('/requests', requestRoutes);
router.use('/mentorships', mentorshipRoutes);
router.use('/messaging', messagingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/programme-settings', programmeSettingsRoutes);
router.use('/notifications', notificationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export default router;
