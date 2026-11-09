import { RefreshTokenModel, IRefreshTokenDocument } from '../models/RefreshToken.model.js';

export class RefreshTokenRepository {
  async create(data: Partial<IRefreshTokenDocument>): Promise<IRefreshTokenDocument> {
    return RefreshTokenModel.create(data);
  }

  async findByTokenHash(tokenHash: string): Promise<IRefreshTokenDocument | null> {
    return RefreshTokenModel.findOne({ tokenHash });
  }

  async revokeToken(tokenHash: string, replacedByTokenHash?: string): Promise<void> {
    await RefreshTokenModel.findOneAndUpdate(
      { tokenHash },
      {
        isRevoked: true,
        revokedAt: new Date(),
        ...(replacedByTokenHash ? { replacedByTokenHash } : {}),
      }
    );
  }

  async revokeFamily(familyId: string): Promise<number> {
    const result = await RefreshTokenModel.updateMany(
      { familyId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      }
    );
    return result.modifiedCount;
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const result = await RefreshTokenModel.updateMany(
      { userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      }
    );
    return result.modifiedCount;
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
