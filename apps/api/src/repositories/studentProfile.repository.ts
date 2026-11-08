import {
  StudentProfileModel,
  IStudentProfileDocument,
} from '../models/StudentProfile.model.js';

export class StudentProfileRepository {
  async findByUserId(userId: string): Promise<IStudentProfileDocument | null> {
    return StudentProfileModel.findOne({ userId }).populate('userId');
  }

  async findById(id: string): Promise<IStudentProfileDocument | null> {
    return StudentProfileModel.findById(id).populate('userId');
  }

  async create(data: Partial<IStudentProfileDocument>): Promise<IStudentProfileDocument> {
    return StudentProfileModel.create(data);
  }

  async update(
    id: string,
    data: Partial<IStudentProfileDocument>
  ): Promise<IStudentProfileDocument | null> {
    return StudentProfileModel.findByIdAndUpdate(id, data, { new: true }).populate('userId');
  }
}

export const studentProfileRepository = new StudentProfileRepository();

