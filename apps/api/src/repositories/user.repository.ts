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
    await UserModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      $unset: { lockoutUntil: 1 },
    });
  }

  async recordFailedLogin(id: string): Promise<{ failedAttempts: number; isLocked: boolean; lockoutUntil?: Date }> {
    const user = await UserModel.findById(id);
    if (!user) return { failedAttempts: 0, isLocked: false };

    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    let lockoutUntil: Date | undefined;

    if (failedAttempts >= 5) {
      // Lock for 30 minutes
      lockoutUntil = new Date(Date.now() + 30 * 60 * 1000);
      await UserModel.findByIdAndUpdate(id, {
        failedLoginAttempts: failedAttempts,
        lockoutUntil,
      });
      return { failedAttempts, isLocked: true, lockoutUntil };
    }

    await UserModel.findByIdAndUpdate(id, {
      failedLoginAttempts: failedAttempts,
    });
    return { failedAttempts, isLocked: false };
  }

  async resetFailedLogins(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      failedLoginAttempts: 0,
      $unset: { lockoutUntil: 1 },
    });
  }

  async updateRole(id: string, role: any): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, { role }, { new: true });
  }
}

export const userRepository = new UserRepository();
