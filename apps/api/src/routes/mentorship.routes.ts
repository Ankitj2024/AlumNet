import { Router } from 'express';
import { mentorshipController } from '../controllers/mentorship.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { proposeSessionSchema } from '@p11/validation';

const router = Router();

// Mentorship listing & workspace details
router.get('/', authenticate, asyncHandler(mentorshipController.getMyMentorships.bind(mentorshipController)));
router.get('/:id', authenticate, asyncHandler(mentorshipController.getMentorshipDetails.bind(mentorshipController)));
router.post('/:id/close', authenticate, asyncHandler(mentorshipController.close.bind(mentorshipController)));

// Sessions
router.get('/:id/sessions', authenticate, asyncHandler(mentorshipController.getSessions.bind(mentorshipController)));
router.post(
  '/:id/sessions',
  authenticate,
  validateBody(proposeSessionSchema),
  asyncHandler(mentorshipController.proposeSession.bind(mentorshipController))
);
router.post(
  '/:id/sessions/:sessionId/confirm',
  authenticate,
  asyncHandler(mentorshipController.confirmSession.bind(mentorshipController))
);
router.post(
  '/:id/sessions/:sessionId/cancel',
  authenticate,
  asyncHandler(mentorshipController.cancelSession.bind(mentorshipController))
);
router.post(
  '/:id/sessions/:sessionId/reschedule',
  authenticate,
  asyncHandler(mentorshipController.rescheduleSession.bind(mentorshipController))
);
router.post(
  '/:id/sessions/:sessionId/no-show',
  authenticate,
  asyncHandler(mentorshipController.recordNoShow.bind(mentorshipController))
);
router.post(
  '/:id/sessions/:sessionId/notes',
  authenticate,
  asyncHandler(mentorshipController.recordSessionNotes.bind(mentorshipController))
);
router.post(
  '/:id/sessions/:sessionId/rating',
  authenticate,
  asyncHandler(mentorshipController.submitStudentRating.bind(mentorshipController))
);
router.get(
  '/:id/sessions/:sessionId/ics',
  authenticate,
  asyncHandler(mentorshipController.downloadIcs.bind(mentorshipController))
);

// Goals & Action Items
router.post(
  '/:id/goals',
  authenticate,
  asyncHandler(mentorshipController.createGoal.bind(mentorshipController))
);
router.patch(
  '/:id/goals/:goalId',
  authenticate,
  asyncHandler(mentorshipController.updateGoal.bind(mentorshipController))
);
router.post(
  '/:id/goals/:goalId/action-items',
  authenticate,
  asyncHandler(mentorshipController.createActionItem.bind(mentorshipController))
);
router.patch(
  '/:id/action-items/:itemId/toggle',
  authenticate,
  asyncHandler(mentorshipController.toggleActionItem.bind(mentorshipController))
);

// Feedback
router.post(
  '/:id/feedback',
  authenticate,
  asyncHandler(mentorshipController.submitFeedback.bind(mentorshipController))
);

export default router;

