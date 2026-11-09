import crypto from 'crypto';
import { RegisterUserInput, LoginUserInput } from '@p11/validation';
import { AppError, ErrorCodes } from '@p11/shared';
import { env } from '@p11/config';
import { userRepository } from '../repositories/user.repository.js';
import { alumnusRepository } from '../repositories/alumnus.repository.js';
import { studentProfileRepository } from '../repositories/studentProfile.repository.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
} from '../utils/jwt.util.js';
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
      failedLoginAttempts: 0,
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

    // Generate 15-minute access token (in-memory) & 7-day refresh token
    const token = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);
    const familyId = crypto.randomUUID();

    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash,
      familyId,
      generation: 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
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
      refreshToken: rawRefreshToken,
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

    // 1. Check Login Lockout Policy (5 failed attempts -> 30 min lockout)
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (60 * 1000));
      await auditService.log({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: 'USER_LOGIN_LOCKED_ATTEMPT',
        entityType: 'User',
        entityId: user._id.toString(),
        ipAddress,
        userAgent,
        metadata: { remainingMinutes },
      });
      throw new AppError(
        `Account is temporarily locked due to 5 consecutive failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        423,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // 2. Check Account Status
    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      throw new AppError(
        `Your account has been ${user.status.toLowerCase()}. Please contact university administration.`,
        403,
        ErrorCodes.FORBIDDEN
      );
    }

    // 3. Verify Password
    const isValid = await comparePassword(input.password, user.passwordHash);
    if (!isValid) {
      const { failedAttempts, isLocked, lockoutUntil } = await userRepository.recordFailedLogin(user._id.toString());
      await auditService.log({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: 'USER_LOGIN_FAILED',
        entityType: 'User',
        entityId: user._id.toString(),
        ipAddress,
        userAgent,
        metadata: { failedAttempts, isLocked },
      });

      if (isLocked) {
        throw new AppError(
          'Account has been locked for 30 minutes due to 5 consecutive failed login attempts.',
          423,
          ErrorCodes.UNAUTHORIZED
        );
      }

      throw new AppError(
        `Invalid email or password credentials. (${5 - failedAttempts} attempts remaining before temporary lockout)`,
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // Reset failed login attempts and update last login
    await userRepository.updateLastLogin(user._id.toString());

    // 4. Generate 15-minute access token & 7-day refresh token with family
    const token = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);
    const familyId = crypto.randomUUID();

    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash,
      familyId,
      generation: 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
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
      refreshToken: rawRefreshToken,
    };
  }

  /**
   * Refresh Token Rotation with Reuse Detection
   * If a revoked token is used, revokes the entire token family!
   */
  async rotateRefreshToken(rawRefreshToken: string, ipAddress?: string, userAgent?: string) {
    if (!rawRefreshToken) {
      throw new AppError('Refresh token required.', 401, ErrorCodes.UNAUTHORIZED);
    }

    const tokenHash = hashToken(rawRefreshToken);
    const existingToken = await refreshTokenRepository.findByTokenHash(tokenHash);

    // REUSE DETECTION: Token not found or already revoked!
    if (!existingToken || existingToken.isRevoked) {
      if (existingToken) {
        // Reuse detected: Revoke entire token family immediately!
        await refreshTokenRepository.revokeFamily(existingToken.familyId);
        await auditService.log({
          actorId: existingToken.userId.toString(),
          actorRole: 'STUDENT',
          action: 'SECURITY_REFRESH_TOKEN_REUSE_DETECTED',
          entityType: 'RefreshToken',
          entityId: existingToken._id.toString(),
          ipAddress,
          userAgent,
          metadata: { familyId: existingToken.familyId, generation: existingToken.generation },
        });
      }
      throw new AppError(
        'Invalid or reused refresh token. All active sessions in this family have been terminated for security.',
        401,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // Expiry check
    if (existingToken.expiresAt < new Date()) {
      await refreshTokenRepository.revokeToken(tokenHash);
      throw new AppError('Refresh token has expired. Please sign in again.', 401, ErrorCodes.UNAUTHORIZED);
    }

    const user = await userRepository.findById(existingToken.userId.toString());
    if (!user || user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      await refreshTokenRepository.revokeFamily(existingToken.familyId);
      throw new AppError('Account is inactive or suspended.', 403, ErrorCodes.FORBIDDEN);
    }

    // Generate new refresh token in the same family with incremented generation
    const newRawRefreshToken = generateRefreshTokenString();
    const newTokenHash = hashToken(newRawRefreshToken);

    // Mark current token as revoked and replaced
    await refreshTokenRepository.revokeToken(tokenHash, newTokenHash);

    // Create new rotated token in family
    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash: newTokenHash,
      familyId: existingToken.familyId,
      generation: existingToken.generation + 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    });

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    return {
      user: serializeUser(user),
      token: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(rawRefreshToken?: string, userId?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      const tokenDoc = await refreshTokenRepository.findByTokenHash(tokenHash);
      if (tokenDoc) {
        await refreshTokenRepository.revokeFamily(tokenDoc.familyId);
      }
    } else if (userId) {
      await refreshTokenRepository.revokeAllForUser(userId);
    }
  }

  /**
   * Demo Login - Strictly Gated behind ENABLE_DEMO_LOGIN=true and NODE_ENV !== 'production'
   */
  async demoLogin(role: string, ipAddress?: string, userAgent?: string) {
    if (!env.ENABLE_DEMO_LOGIN || env.NODE_ENV === 'production') {
      throw new AppError(
        'Demo login is permanently disabled in this environment.',
        404,
        ErrorCodes.NOT_FOUND
      );
    }

    let demoEmail: string;
    switch (role) {
      case 'STUDENT':
        demoEmail = 'student.demo@university.edu';
        break;
      case 'ALUMNI_MENTOR':
        demoEmail = 'mentor.demo@alumni.edu';
        break;
      case 'ALUMNI_RELATIONS_OFFICER':
        demoEmail = 'officer.demo@university.edu';
        break;
      case 'SUPER_ADMIN':
        demoEmail = 'admin.demo@university.edu';
        break;
      default:
        throw new AppError('Invalid demo role requested.', 400, ErrorCodes.BAD_REQUEST);
    }

    const user = await userRepository.findByEmail(demoEmail);
    if (!user) {
      throw new AppError('Demo user not found. Ensure database is seeded.', 404, ErrorCodes.NOT_FOUND);
    }

    const token = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    const rawRefreshToken = generateRefreshTokenString();
    const tokenHash = hashToken(rawRefreshToken);
    const familyId = crypto.randomUUID();

    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash,
      familyId,
      generation: 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress,
      userAgent,
    });

    return {
      user: serializeUser(user),
      token,
      refreshToken: rawRefreshToken,
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
