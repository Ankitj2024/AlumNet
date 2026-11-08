import { RegisterUserInput, LoginUserInput } from '@p11/validation';
import { AppError, ErrorCodes } from '@p11/shared';
import { userRepository } from '../repositories/user.repository.js';
import { alumnusRepository } from '../repositories/alumnus.repository.js';
import { studentProfileRepository } from '../repositories/studentProfile.repository.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateToken } from '../utils/jwt.util.js';
import { serializeUser } from '../serializers/user.serializer.js';
import { auditService } from './audit.service.js';

export class AuthService {
  async register(input: RegisterUserInput, ipAddress?: string, userAgent?: string) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(
        'An account with this email address already exists.',
        409,
        ErrorCodes.CONFLICT
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.create({
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      status: 'ACTIVE',
      isEmailVerified: true, // Auto-verified for baseline institutional onboarding
    });

    // Create role-specific domain profile
    if (input.role === 'ALUMNI_MENTOR') {
      const alumnus = await alumnusRepository.create({
        userId: user._id,
        verificationStatus: 'NOT_SUBMITTED',
        isSearchable: false,
      });

      // Default mentor capacity: 2 mentees
      await alumnusRepository.upsertCapacity(alumnus._id.toString(), {
        mentorId: alumnus._id,
        maxActiveMentees: 2,
        currentActiveMentees: 0,
        isAcceptingRequests: true,
        isPaused: false,
      });
    } else if (input.role === 'STUDENT') {
      await studentProfileRepository.create({
        userId: user._id,
        skills: [],
        targetJobRoles: [],
        preferredIndustries: [],
        profileCompletionScore: 10,
      });
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    await auditService.log({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id.toString(),
      ipAddress,
      userAgent,
      metadata: { role: user.role, email: user.email },
    });

    return {
      user: serializeUser(user),
      token,
    };
  }

  async login(input: LoginUserInput, ipAddress?: string, userAgent?: string) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError(
        'Invalid email or password credentials.',
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw new AppError(
        `Your account has been ${user.status.toLowerCase()}. Please contact university administration.`,
        403,
        ErrorCodes.FORBIDDEN
      );
    }

    const isValid = await comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError(
        'Invalid email or password credentials.',
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    await userRepository.updateLastLogin(user._id.toString());

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    await auditService.log({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      ipAddress,
      userAgent,
    });

    return {
      user: serializeUser(user),
      token,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404, ErrorCodes.NOT_FOUND);
    }
    return serializeUser(user);
  }
}

export const authService = new AuthService();

