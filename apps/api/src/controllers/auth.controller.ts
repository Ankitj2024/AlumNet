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

    // 15-minute access token cookie for browser convenience
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    // Set refresh token in httpOnly Secure SameSite=Strict cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json(
      createSuccessResponse({
        user: result.user,
        accessToken: result.token,
        token: result.token, // backward compatibility
        refreshToken: result.refreshToken,
      })
    );
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
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(
      createSuccessResponse({
        user: result.user,
        accessToken: result.token,
        token: result.token,
        refreshToken: result.refreshToken,
      })
    );
  }

  async refresh(req: Request, res: Response) {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await authService.rotateRefreshToken(
      rawRefreshToken,
      req.ip,
      req.headers['user-agent']
    );

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(
      createSuccessResponse({
        user: result.user,
        accessToken: result.token,
        token: result.token,
        refreshToken: result.refreshToken,
      })
    );
  }

  async demoLogin(req: Request, res: Response) {
    const { role } = req.body;
    const result = await authService.demoLogin(
      role,
      req.ip,
      req.headers['user-agent']
    );

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json(
      createSuccessResponse({
        user: result.user,
        accessToken: result.token,
        token: result.token,
        refreshToken: result.refreshToken,
      })
    );
  }

  async logout(req: Request, res: Response) {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await authService.logout(rawRefreshToken, req.user?.userId);
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.status(200).json(createSuccessResponse({ message: 'Logged out successfully.' }));
  }

  async getMe(req: Request, res: Response) {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.status(200).json(createSuccessResponse(user));
  }
}

export const authController = new AuthController();
