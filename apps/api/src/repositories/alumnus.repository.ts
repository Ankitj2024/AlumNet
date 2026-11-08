import { AlumnusModel, IAlumnusDocument } from '../models/Alumnus.model.js';
import { MentorCapacityModel, IMentorCapacityDocument } from '../models/MentorCapacity.model.js';

export class AlumnusRepository {
  async findById(id: string): Promise<IAlumnusDocument | null> {
    return AlumnusModel.findById(id).populate('userId');
  }

  async findByUserId(userId: string): Promise<IAlumnusDocument | null> {
    return AlumnusModel.findOne({ userId }).populate('userId');
  }

  async create(data: Partial<IAlumnusDocument>): Promise<IAlumnusDocument> {
    return AlumnusModel.create(data);
  }

  async update(id: string, data: Partial<IAlumnusDocument>): Promise<IAlumnusDocument | null> {
    return AlumnusModel.findByIdAndUpdate(id, data, { new: true }).populate('userId');
  }

  async findSearchableMentors(query: any = {}, skip = 0, limit = 20) {
    const filter = {
      verificationStatus: 'VERIFIED',
      isSearchable: true,
      ...query,
    };

    const [mentors, total] = await Promise.all([
      AlumnusModel.find(filter)
        .populate('userId')
        .skip(skip)
        .limit(limit)
        .sort({ updatedAt: -1 }),
      AlumnusModel.countDocuments(filter),
    ]);

    return { mentors, total };
  }

  async findCapacity(mentorId: string): Promise<IMentorCapacityDocument | null> {
    return MentorCapacityModel.findOne({ mentorId });
  }

  async upsertCapacity(mentorId: string, data: Partial<IMentorCapacityDocument>): Promise<IMentorCapacityDocument> {
    return MentorCapacityModel.findOneAndUpdate(
      { mentorId },
      { ...data, lastUpdated: new Date() },
      { new: true, upsert: true }
    );
  }
}

export const alumnusRepository = new AlumnusRepository();

