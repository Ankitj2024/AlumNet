import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { notificationService } from '../services/notification.service.js';

export class NotificationController {
  async getNotifications(req: Request, res: Response) {
    const unreadOnly = req.query.unread === 'true';
    const limit = parseInt(req.query.limit as string) || 30;
    const notifications = await notificationService.getUserNotifications(
      req.user!.userId,
      limit,
      unreadOnly
    );
    const unreadCount = await notificationService.getUnreadCount(req.user!.userId);

    res.status(200).json(
      createSuccessResponse({
        notifications,
        unreadCount,
      })
    );
  }

  async markAsRead(req: Request, res: Response) {
    const { id } = req.params;
    const success = await notificationService.markAsRead(id, req.user!.userId);
    res.status(200).json(createSuccessResponse({ success }));
  }

  async markAllAsRead(req: Request, res: Response) {
    const count = await notificationService.markAllAsRead(req.user!.userId);
    res.status(200).json(createSuccessResponse({ markedCount: count }));
  }

  async getPreferences(req: Request, res: Response) {
    const prefs = await notificationService.getPreferences(req.user!.userId);
    res.status(200).json(createSuccessResponse(prefs));
  }

  async updatePreferences(req: Request, res: Response) {
    const updated = await notificationService.updatePreferences(req.user!.userId, req.body);
    res.status(200).json(createSuccessResponse(updated));
  }
}

export const notificationController = new NotificationController();
