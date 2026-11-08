import { UpdateStudentProfileInput } from '@p11/validation';
import { AppError, ErrorCodes } from '@p11/shared';
import { studentProfileRepository } from '../repositories/studentProfile.repository.js';
import { serializeStudentProfile } from '../serializers/student.serializer.js';

export class StudentService {
  async getProfileByUserId(userId: string) {
    const profile = await studentProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new AppError('Student profile not found.', 404, ErrorCodes.NOT_FOUND);
    }
    return serializeStudentProfile(profile, (profile as any).userId);
  }

  async updateProfile(userId: string, input: UpdateStudentProfileInput) {
    let profile = await studentProfileRepository.findByUserId(userId);
    if (!profile) {
      throw new AppError('Student profile not found.', 404, ErrorCodes.NOT_FOUND);
    }

    // Compute profile completion score
    let score = 20; // Base score for account
    if (input.institutionalStudentId) score += 15;
    if (input.academicProgramme && input.department) score += 20;
    if (input.skills.length > 0) score += 15;
    if (input.targetJobRoles.length > 0) score += 15;
    if (input.preferredIndustries.length > 0) score += 15;

    const updated = await studentProfileRepository.update(profile._id.toString(), {
      institutionalStudentId: input.institutionalStudentId,
      academicProgramme: input.academicProgramme,
      department: input.department,
      expectedGraduationYear: input.expectedGraduationYear,
      skills: input.skills,
      targetJobRoles: input.targetJobRoles,
      preferredIndustries: input.preferredIndustries,
      preferredCommunicationFrequency: input.preferredCommunicationFrequency,
      timeZone: input.timeZone,
      profileCompletionScore: Math.min(100, score),
    });

    return serializeStudentProfile(updated!, (updated as any).userId);
  }
}

export const studentService = new StudentService();

