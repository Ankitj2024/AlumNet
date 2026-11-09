import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { programmeSettingsService } from '../services/programmeSettings.service.js';

export class ProgrammeSettingsController {
  async getSettings(req: Request, res: Response) {
    const settings = await programmeSettingsService.getSettings();
    res.status(200).json(createSuccessResponse(settings));
  }

  async updateSettings(req: Request, res: Response) {
    const updated = await programmeSettingsService.updateSettings(
      req.user!.userId,
      req.body,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json(createSuccessResponse(updated));
  }

  async getHistory(req: Request, res: Response) {
    const history = await programmeSettingsService.getChangeHistory();
    res.status(200).json(createSuccessResponse(history));
  }
}

export const programmeSettingsController = new ProgrammeSettingsController();
