import { UserModel, IUserDocument } from '../models/User.model.js';

export class UserRepository {
  async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase() });
  }

  async create(data: Partial<IUserDocument>): Promise<IUserDocument> {
    return UserModel.create(data);
  }

  async updateLastLogin(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  async updateRole(id: string, role: any): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, { role }, { new: true });
  }
}

export const userRepository = new UserRepository();

