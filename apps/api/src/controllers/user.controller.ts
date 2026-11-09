import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { dataRightsService } from '../services/dataRights.service.js';

export class UserController {
  /**
   * GET /api/v1/users/export
   * Downloadable JSON bundle of all personal data (GDPR Art 20 / DPDP)
   */
  async exportMyData(req: Request, res: Response) {
    const userId = req.user!.userId;
    const dataBundle = await dataRightsService.exportUserData(userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="user-data-export-${userId}.json"`
    );
    res.status(200).json(createSuccessResponse(dataBundle));
  }

  /**
   * DELETE /api/v1/users/me
   * Soft delete with 30-day purge schedule (GDPR Art 17 / DPDP)
   */
  async deleteMyAccount(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await dataRightsService.requestAccountDeletion(userId);
    res.status(200).json(createSuccessResponse(result));
  }

  /**
   * POST /api/v1/users/cancel-deletion
   * Cancel scheduled deletion
   */
  async cancelDeletion(req: Request, res: Response) {
    const userId = req.user!.userId;
    const result = await dataRightsService.cancelAccountDeletion(userId);
    res.status(200).json(createSuccessResponse(result));
  }
}

export const userController = new UserController();
