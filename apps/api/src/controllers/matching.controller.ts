import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { matchingEngineService } from '../services/matchingEngine.service.js';

export class MatchingController {
  async getRecommendations(req: Request, res: Response) {
    const limit = Number(req.query.limit) || 10;
    const recommendations = await matchingEngineService.getRecommendationsForStudent(
      req.user!.userId,
      limit
    );
    res.status(200).json(createSuccessResponse(recommendations));
  }
}

export const matchingController = new MatchingController();

