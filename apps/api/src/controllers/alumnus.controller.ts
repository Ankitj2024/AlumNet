import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { alumnusService } from '../services/alumnus.service.js';

export class AlumnusController {
  async getMyProfile(req: Request, res: Response) {
    const result = await alumnusService.getProfileByUserId(req.user!.userId);
    res.status(200).json(createSuccessResponse(result));
  }

  async updateMyProfile(req: Request, res: Response) {
    const result = await alumnusService.updateProfile(req.user!.userId, req.body);
    res.status(200).json(createSuccessResponse(result));
  }

  async getMyCapacity(req: Request, res: Response) {
    const { capacity } = await alumnusService.getProfileByUserId(req.user!.userId);
    res.status(200).json(createSuccessResponse(capacity));
  }

  async updateMyCapacity(req: Request, res: Response) {
    const result = await alumnusService.updateCapacity(req.user!.userId, req.body);
    res.status(200).json(createSuccessResponse(result));
  }

  async searchMentors(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await alumnusService.searchMentorsForStudents(
      {
        industry: req.query.industry as string,
        expertise: req.query.expertise as string,
        search: req.query.search as string,
      },
      page,
      limit
    );
    res.status(200).json(
      createSuccessResponse(result.mentors, {
        page: result.page,
        limit: result.limit,
        total: result.total,
      })
    );
  }
}

export const alumnusController = new AlumnusController();

