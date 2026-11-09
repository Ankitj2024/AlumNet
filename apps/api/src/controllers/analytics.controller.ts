import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { analyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  async getOverview(req: Request, res: Response) {
    if (req.query.format === 'csv') {
      const csv = await analyticsService.exportOverviewCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="alumni-mentorship-overview.csv"');
      return res.status(200).send(csv);
    }
    const metrics = await analyticsService.getOverviewMetrics();
    res.status(200).json(createSuccessResponse(metrics));
  }

  async getPlacement(req: Request, res: Response) {
    if (req.query.format === 'csv') {
      const csv = await analyticsService.exportPlacementCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="placement-outcomes-correlation.csv"');
      return res.status(200).send(csv);
    }
    const stats = await analyticsService.getPlacementCorrelation();
    res.status(200).json(createSuccessResponse(stats));
  }

  async exportOverviewCsv(req: Request, res: Response) {
    const csv = await analyticsService.exportOverviewCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="alumni-mentorship-overview.csv"');
    res.status(200).send(csv);
  }

  async exportPlacementCsv(req: Request, res: Response) {
    const csv = await analyticsService.exportPlacementCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="placement-outcomes-correlation.csv"');
    res.status(200).send(csv);
  }

  async selfReportPlacement(req: Request, res: Response) {
    const result = await analyticsService.selfReportPlacement(req.user!.userId, req.body);
    res.status(201).json(createSuccessResponse(result));
  }

  async importRegistrarPlacements(req: Request, res: Response) {
    const result = await analyticsService.importRegistrarPlacements(
      req.user!.userId,
      req.body.records || req.body
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async getAuditLogs(req: Request, res: Response) {
    const result = await analyticsService.getAuditLogs({
      action: req.query.action as string,
      actorId: req.query.actorId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    res.status(200).json(createSuccessResponse(result));
  }

  async getModerationQueue(req: Request, res: Response) {
    const result = await analyticsService.getModerationQueue({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    res.status(200).json(createSuccessResponse(result));
  }
}

export const analyticsController = new AnalyticsController();
