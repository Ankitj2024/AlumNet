import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { mentorshipRequestService } from '../services/mentorshipRequest.service.js';

export class RequestController {
  async create(req: Request, res: Response) {
    const result = await mentorshipRequestService.createRequest(req.user!.userId, req.body);
    res.status(201).json(createSuccessResponse(result));
  }

  async accept(req: Request, res: Response) {
    const result = await mentorshipRequestService.acceptRequest(req.user!.userId, req.params.id);
    res.status(200).json(createSuccessResponse(result));
  }

  async decline(req: Request, res: Response) {
    const result = await mentorshipRequestService.declineRequest(
      req.user!.userId,
      req.params.id,
      req.body?.declineReason
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async cancel(req: Request, res: Response) {
    const result = await mentorshipRequestService.cancelRequest(req.user!.userId, req.params.id);
    res.status(200).json(createSuccessResponse(result));
  }

  async getSent(req: Request, res: Response) {
    const result = await mentorshipRequestService.getStudentRequests(req.user!.userId);
    res.status(200).json(createSuccessResponse(result));
  }

  async getIncoming(req: Request, res: Response) {
    const result = await mentorshipRequestService.getMentorIncomingRequests(req.user!.userId);
    res.status(200).json(createSuccessResponse(result));
  }
}

export const requestController = new RequestController();

