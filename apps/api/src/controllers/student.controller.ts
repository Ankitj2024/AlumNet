import { Request, Response } from 'express';
import { createSuccessResponse } from '@p11/shared';
import { studentService } from '../services/student.service.js';

export class StudentController {
  async getMyProfile(req: Request, res: Response) {
    const result = await studentService.getProfileByUserId(req.user!.userId);
    res.status(200).json(createSuccessResponse(result));
  }

  async updateMyProfile(req: Request, res: Response) {
    const result = await studentService.updateProfile(req.user!.userId, req.body);
    res.status(200).json(createSuccessResponse(result));
  }
}

export const studentController = new StudentController();

