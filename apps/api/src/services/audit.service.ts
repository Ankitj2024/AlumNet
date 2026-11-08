import { AuditLogModel } from '../models/AuditLog.model.js';
import { logger } from '../config/logger.js';

export class AuditService {
  async log(entry: {
    actorId?: string;
    actorRole?: string;
    action: string;
    entityType: string;
    entityId: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await AuditLogModel.create({
        actorId: entry.actorId as any,
        actorRole: entry.actorRole,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: entry.metadata,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error('Failed to persist audit log entry:', error);
    }
  }
}

export const auditService = new AuditService();

