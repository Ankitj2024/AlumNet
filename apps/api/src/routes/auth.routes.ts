import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { registerUserSchema, loginUserSchema } from '@p11/validation';

const router = Router();

router.post(
  '/register',
  validateBody(registerUserSchema),
  asyncHandler(authController.register.bind(authController))
);

router.post(
  '/login',
  validateBody(loginUserSchema),
  asyncHandler(authController.login.bind(authController))
);

router.post('/logout', asyncHandler(authController.logout.bind(authController)));

router.get('/me', authenticate, asyncHandler(authController.getMe.bind(authController)));

export default router;

