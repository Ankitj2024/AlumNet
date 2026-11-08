import {
  VerificationRequestModel,
  IVerificationRequestDocument,
} from '../models/VerificationRequest.model.js';

export class VerificationRepository {
  async findByAlumnusId(alumnusId: string): Promise<IVerificationRequestDocument | null> {
    return VerificationRequestModel.findOne({ alumnusId })
      .populate('userId')
      .populate('institutionalRecordId');
  }

  async findById(id: string): Promise<IVerificationRequestDocument | null> {
    return VerificationRequestModel.findById(id)
      .populate('userId')
      .populate('institutionalRecordId');
  }

  async create(data: Partial<IVerificationRequestDocument>): Promise<IVerificationRequestDocument> {
    return VerificationRequestModel.create(data);
  }

  async update(
    id: string,
    data: any
  ): Promise<IVerificationRequestDocument | null> {
    return VerificationRequestModel.findByIdAndUpdate(id, data, { new: true })
      .populate('userId')
      .populate('institutionalRecordId');
  }

  async findQueue(query: any = {}, skip = 0, limit = 20) {
    const filter = {
      ...query,
    };
    const [requests, total] = await Promise.all([
      VerificationRequestModel.find(filter)
        .populate('userId')
        .populate('institutionalRecordId')
        .populate('reviewedBy')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: 1 }),
      VerificationRequestModel.countDocuments(filter),
    ]);

    return { requests, total };
  }
}

export const verificationRepository = new VerificationRepository();
