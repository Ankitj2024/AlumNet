import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { authService } from '../services/auth.service.js';

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(
      req.body,
      req.ip,
      req.headers['user-agent']
    );

    // Set secure HTTP-only cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 'lax' permits smooth development navigation
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json(createSuccessResponse(result));
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(
      req.body,
      req.ip,
      req.headers['user-agent']
    );

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(createSuccessResponse(result));
  }

  async logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.status(200).json(createSuccessResponse({ message: 'Logged out successfully.' }));
  }

  async getMe(req: Request, res: Response) {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.status(200).json(createSuccessResponse(user));
  }
}

export const authController = new AuthController();

