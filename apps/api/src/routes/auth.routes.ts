import { Router, Request, Response, NextFunction } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { registerUserSchema, loginUserSchema } from '@p11/validation';
import { env } from '@p11/config';

const router = Router();

// Demo gating middleware: in production or when disabled, returns 404
const demoGateMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!env.ENABLE_DEMO_LOGIN || env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    });
  }
  next();
};

router.post(
  '/register',
  authLimiter,
  validateBody(registerUserSchema),
  asyncHandler(authController.register.bind(authController))
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginUserSchema),
  asyncHandler(authController.login.bind(authController))
);

router.post(
  '/refresh',
  authLimiter,
  asyncHandler(authController.refresh.bind(authController))
);

router.post(
  '/demo-login',
  demoGateMiddleware,
  authLimiter,
  asyncHandler(authController.demoLogin.bind(authController))
);

router.post('/logout', asyncHandler(authController.logout.bind(authController)));

router.get('/me', authenticate, asyncHandler(authController.getMe.bind(authController)));

export default router;
