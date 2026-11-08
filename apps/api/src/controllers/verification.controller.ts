import { Request, Response } from 'express';
import { createSuccessResponse, AppError, ErrorCodes } from '@p11/shared';
import { verificationService } from '../services/verification.service.js';

export class VerificationController {
  async submit(req: Request, res: Response) {
    const result = await verificationService.submitVerification(
      req.user!.userId,
      req.body,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async getStatus(req: Request, res: Response) {
    const result = await verificationService.getStatusForUser(req.user!.userId);
    res.status(200).json(createSuccessResponse(result));
  }

  async getQueue(req: Request, res: Response) {
    const status = req.query.status as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const { requests, total } = await verificationService.getQueue(status, page, limit);
    res.status(200).json(createSuccessResponse(requests, { page, limit, total }));
  }

  async review(req: Request, res: Response) {
    const requestId = req.params.id;
    const result = await verificationService.reviewVerification(
      requestId,
      req.user!.userId,
      req.body,
      req.ip,
      req.headers['user-agent']
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async batchImportCsv(req: Request, res: Response) {
    if (!req.body || !req.body.csvContent) {
      throw new AppError('csvContent string is required in request body.', 400, ErrorCodes.BAD_REQUEST);
    }
    const result = await verificationService.importRecordsFromCsv(
      req.body.csvContent,
      req.user!.userId
    );
    res.status(200).json(createSuccessResponse(result));
  }
}

export const verificationController = new VerificationController();

