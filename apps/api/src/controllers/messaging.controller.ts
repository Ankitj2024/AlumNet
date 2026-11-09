import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { messagingService } from '../services/messaging.service.js';

export class MessagingController {
  async sendMessage(req: Request, res: Response) {
    const result = await messagingService.sendMessage(
      req.user!.userId,
      req.params.mentorshipId,
      req.body.content
    );
    res.status(201).json(createSuccessResponse(result));
  }

  async getMessages(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const result = await messagingService.getMessages(
      req.user!.userId,
      req.params.mentorshipId,
      page,
      limit
    );
    res.status(200).json(
      createSuccessResponse(result.messages, {
        page: result.page,
        limit: result.limit,
        total: result.total,
      })
    );
  }

  async markAsRead(req: Request, res: Response) {
    const result = await messagingService.markAsRead(req.user!.userId, req.params.mentorshipId);
    res.status(200).json(createSuccessResponse(result));
  }

  async decryptForModeration(req: Request, res: Response) {
    const result = await messagingService.decryptForModeration(
      req.user!.userId,
      req.params.messageId,
      req.body.reason,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json(createSuccessResponse(result));
  }
}

export const messagingController = new MessagingController();
