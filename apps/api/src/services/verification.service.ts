import { SubmitVerificationInput, ReviewVerificationInput, InstitutionalAlumniRecordInput } from '@p11/validation';
import { AppError, ErrorCodes } from '@p11/shared';
import { verificationRepository } from '../repositories/verification.repository.js';
import { institutionalRecordRepository } from '../repositories/institutionalRecord.repository.js';
import { alumnusRepository } from '../repositories/alumnus.repository.js';
import { auditService } from './audit.service.js';
import { parse } from 'csv-parse/sync';

export class VerificationService {
  /**
   * Submit institutional credentials and verification documents
   */
  async submitVerification(
    userId: string,
    input: SubmitVerificationInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const alumnus = await alumnusRepository.findByUserId(userId);
    if (!alumnus) {
      throw new AppError('Alumnus profile not found for this user.', 404, ErrorCodes.NOT_FOUND);
    }

    if (alumnus.verificationStatus === 'VERIFIED') {
      throw new AppError('Alumnus identity is already verified.', 400, ErrorCodes.BAD_REQUEST);
    }

    // Step 1: Check institutional records (Source 1 & 2: ERP or Registrar CSV sync)
    const matchingInstitutionalRecord = await institutionalRecordRepository.findByAlumniId(
      input.submittedAlumniId
    );

    let initialStatus: 'PENDING' | 'VERIFIED' = 'PENDING';
    let verificationMethod: 'INSTITUTIONAL_ERP_MATCH' | 'MANUAL_DOCUMENT_REVIEW' =
      'MANUAL_DOCUMENT_REVIEW';

    // If an exact institutional record exists with matching graduation year and department
    if (
      matchingInstitutionalRecord &&
      matchingInstitutionalRecord.graduationYear === input.graduationYear &&
      matchingInstitutionalRecord.academicDepartment.toLowerCase() ===
        input.academicDepartment.toLowerCase()
    ) {
      initialStatus = 'VERIFIED';
      verificationMethod = 'INSTITUTIONAL_ERP_MATCH';
      await institutionalRecordRepository.markAsClaimed(
        matchingInstitutionalRecord._id.toString(),
        userId
      );
    }

    // Create or update verification request
    let request = await verificationRepository.findByAlumnusId(alumnus._id.toString());
    const auditEntry = {
      action: initialStatus === 'VERIFIED' ? 'AUTO_VERIFIED_VIA_ERP' : 'VERIFICATION_SUBMITTED',
      performedBy: userId as any,
      timestamp: new Date(),
      comment:
        initialStatus === 'VERIFIED'
          ? 'Matched confirmed institutional registrar record.'
          : 'Submitted credentials for officer review.',
    };

    if (request) {
      request = await verificationRepository.update(request._id.toString(), {
        submittedAlumniId: input.submittedAlumniId,
        graduationYear: input.graduationYear,
        academicDepartment: input.academicDepartment,
        degree: input.degree,
        documentUrls: input.documentUrls,
        status: initialStatus,
        verificationMethod,
        institutionalRecordId: matchingInstitutionalRecord?._id,
        $push: { auditHistory: auditEntry } as any,
      });
    } else {
      request = await verificationRepository.create({
        alumnusId: alumnus._id,
        userId: userId as any,
        submittedAlumniId: input.submittedAlumniId,
        graduationYear: input.graduationYear,
        academicDepartment: input.academicDepartment,
        degree: input.degree,
        documentUrls: input.documentUrls,
        status: initialStatus,
        verificationMethod,
        institutionalRecordId: matchingInstitutionalRecord?._id,
        auditHistory: [auditEntry],
      });
    }

    // Update Alumnus record
    await alumnusRepository.update(alumnus._id.toString(), {
      institutionalId: input.submittedAlumniId,
      graduationYear: input.graduationYear,
      academicDepartment: input.academicDepartment,
      degree: input.degree,
      verificationStatus: initialStatus,
      isSearchable: initialStatus === 'VERIFIED',
    });

    await auditService.log({
      actorId: userId,
      actorRole: 'ALUMNI_MENTOR',
      action: auditEntry.action,
      entityType: 'VerificationRequest',
      entityId: request!._id.toString(),
      ipAddress,
      userAgent,
      metadata: { status: initialStatus, verificationMethod },
    });

    return request;
  }

  /**
   * Officer manual review of submitted verification request
   */
  async reviewVerification(
    requestId: string,
    officerId: string,
    input: ReviewVerificationInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const request = await verificationRepository.findById(requestId);
    if (!request) {
      throw new AppError('Verification request not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const auditEntry = {
      action: `OFFICER_REVIEW_${input.status}`,
      performedBy: officerId as any,
      timestamp: new Date(),
      comment: input.reviewNotes || input.rejectionReason,
    };

    const updatedRequest = await verificationRepository.update(requestId, {
      status: input.status,
      reviewedBy: officerId as any,
      reviewedAt: new Date(),
      reviewNotes: input.reviewNotes,
      rejectionReason: input.rejectionReason,
      $push: { auditHistory: auditEntry } as any,
    });

    // Update Alumnus status
    const isVerified = input.status === 'VERIFIED';
    await alumnusRepository.update(request.alumnusId.toString(), {
      verificationStatus: input.status,
      isSearchable: isVerified,
    });

    await auditService.log({
      actorId: officerId,
      actorRole: 'ALUMNI_RELATIONS_OFFICER',
      action: `VERIFICATION_${input.status}`,
      entityType: 'VerificationRequest',
      entityId: requestId,
      ipAddress,
      userAgent,
      metadata: {
        alumnusId: request.alumnusId.toString(),
        notes: input.reviewNotes,
        rejectionReason: input.rejectionReason,
      },
    });

    return updatedRequest;
  }

  /**
   * Batch import verified institutional records from CSV (Source 2)
   */
  async importRecordsFromCsv(csvContent: string, officerId: string): Promise<any> {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const parsedRecords: Partial<InstitutionalAlumniRecordInput>[] = records.map((row: any) => ({
      institutionalAlumniId: row.institutionalAlumniId || row.alumniId || row.rollNo,
      legalFullName: row.legalFullName || row.name,
      graduationYear: Number(row.graduationYear || row.year),
      academicDepartment: row.academicDepartment || row.department,
      degreeAwarded: row.degreeAwarded || row.degree,
      officialEmail: row.officialEmail || row.email,
    }));

    const result = await institutionalRecordRepository.batchInsert(parsedRecords as any);

    await auditService.log({
      actorId: officerId,
      actorRole: 'ALUMNI_RELATIONS_OFFICER',
      action: 'CSV_BATCH_ALUMNI_IMPORT',
      entityType: 'InstitutionalAlumniRecord',
      entityId: 'BATCH',
      metadata: { importedCount: records.length },
    });

    return { importedCount: records.length, writeResult: result };
  }

  /**
   * Retrieve verification queue for officers
   */
  async getQueue(status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = status ? { status } : {};
    return verificationRepository.findQueue(query, skip, limit);
  }

  /**
   * Retrieve verification status for an alumnus user
   */
  async getStatusForUser(userId: string) {
    const alumnus = await alumnusRepository.findByUserId(userId);
    if (!alumnus) {
      throw new AppError('Alumnus profile not found.', 404, ErrorCodes.NOT_FOUND);
    }
    const request = await verificationRepository.findByAlumnusId(alumnus._id.toString());
    return {
      alumnus,
      request,
    };
  }
}

export const verificationService = new VerificationService();
