import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { analyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  async getOverview(req: Request, res: Response) {
    const metrics = await analyticsService.getOverviewMetrics();
    res.status(200).json(createSuccessResponse(metrics));
  }

  async getPlacement(req: Request, res: Response) {
    const stats = await analyticsService.getPlacementCorrelation();
    res.status(200).json(createSuccessResponse(stats));
  }
}

export const analyticsController = new AnalyticsController();

