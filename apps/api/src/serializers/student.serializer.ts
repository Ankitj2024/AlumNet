import { StudentProfileDTO } from '@p11/types';
import { IStudentProfileDocument } from '../models/StudentProfile.model.js';
import { IUserDocument } from '../models/User.model.js';

export function serializeStudentProfile(
  profile: IStudentProfileDocument,
  user?: IUserDocument | null
): StudentProfileDTO {
  return {
    id: profile._id.toString(),
    userId: profile.userId.toString(),
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    institutionalStudentId: profile.institutionalStudentId || '',
    academicProgramme: profile.academicProgramme || '',
    department: profile.department || '',
    expectedGraduationYear: profile.expectedGraduationYear || new Date().getFullYear(),
    skills: profile.skills || [],
    targetJobRoles: profile.targetJobRoles || [],
    preferredIndustries: profile.preferredIndustries || [],
    preferredCommunicationFrequency: profile.preferredCommunicationFrequency || 'BIWEEKLY',
    timeZone: profile.timeZone || 'UTC',
    profileCompletionScore: profile.profileCompletionScore || 0,
  };
}

