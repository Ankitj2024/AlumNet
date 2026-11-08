import { UserDTO } from '@p11/types';
import { IUserDocument } from '../models/User.model.js';

export function serializeUser(user: IUserDocument): UserDTO {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt.toISOString(),
  };
}

