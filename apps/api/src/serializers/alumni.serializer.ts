import { StudentViewAlumnusDTO, AdminAlumnusDTO } from '@p11/types';
import { IAlumnusDocument } from '../models/Alumnus.model.js';
import { IUserDocument } from '../models/User.model.js';

/**
 * STRICT PRIVACY SERIALIZER for Student Consumers.
 * Guarantees that:
 * 1. Direct email and phone number are EXCLUDED.
 * 2. Institutional IDs and uploaded verification document paths are EXCLUDED.
 * 3. Exact active mentee counts are EXCLUDED.
 * Only safe, public professional attributes are returned.
 */
export function serializeStudentViewAlumnus(
  alumnus: IAlumnusDocument,
  user?: IUserDocument | null
): StudentViewAlumnusDTO {
  return {
    id: alumnus._id.toString(),
    alumnusId: alumnus._id.toString(),
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    professionalDesignation: alumnus.professionalDesignation || 'Alumni Professional',
    organisation: alumnus.organisation || 'Independent',
    industry: alumnus.industry || 'General',
    yearsOfExperience: alumnus.yearsOfExperience || 0,
    professionalSummary: alumnus.professionalSummary || '',
    expertiseTags: alumnus.expertiseTags || [],
    mentoringTopics: alumnus.mentoringTopics || [],
    preferredStudentProfiles: alumnus.preferredStudentProfiles || [],
    preferredCareerStages: alumnus.preferredCareerStages || [],
    graduationYear: alumnus.graduationYear || 0,
    academicDepartment: alumnus.academicDepartment || '',
    degree: alumnus.degree || '',
    isAcceptingRequests: alumnus.isSearchable,
    verificationStatus: alumnus.verificationStatus,
  };
}

/**
 * Authorized Serializer for Alumni Relations Officers and Administrators.
 */
export function serializeAdminAlumnus(
  alumnus: IAlumnusDocument,
  user: IUserDocument,
  capacity?: { maxActiveMentees: number; currentActiveMentees: number; isPaused: boolean; pauseReason?: string }
): AdminAlumnusDTO {
  return {
    ...serializeStudentViewAlumnus(alumnus, user),
    email: user.email,
    institutionalId: alumnus.institutionalId || '',
    documentUrls: [],
    maxActiveMentees: capacity?.maxActiveMentees ?? 2,
    currentActiveMentees: capacity?.currentActiveMentees ?? 0,
    isPaused: capacity?.isPaused ?? false,
    pauseReason: capacity?.pauseReason,
  };
}

