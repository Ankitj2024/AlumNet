import { UpdateMentorProfileInput, UpdateMentorCapacityInput } from '@p11/validation';
import { AppError, ErrorCodes } from '@p11/shared';
import { alumnusRepository } from '../repositories/alumnus.repository.js';
import { serializeStudentViewAlumnus, serializeAdminAlumnus } from '../serializers/alumni.serializer.js';

export class AlumnusService {
  async getProfileByUserId(userId: string) {
    const alumnus = await alumnusRepository.findByUserId(userId);
    if (!alumnus) {
      throw new AppError('Alumnus profile not found.', 404, ErrorCodes.NOT_FOUND);
    }
    const capacity = await alumnusRepository.findCapacity(alumnus._id.toString());
    return {
      profile: alumnus,
      capacity,
    };
  }

  async updateProfile(userId: string, input: UpdateMentorProfileInput) {
    const alumnus = await alumnusRepository.findByUserId(userId);
    if (!alumnus) {
      throw new AppError('Alumnus profile not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const updated = await alumnusRepository.update(alumnus._id.toString(), {
      professionalDesignation: input.professionalDesignation,
      organisation: input.organisation,
      industry: input.industry,
      yearsOfExperience: input.yearsOfExperience,
      professionalSummary: input.professionalSummary,
      expertiseTags: input.expertiseTags,
      mentoringTopics: input.mentoringTopics,
      preferredStudentProfiles: input.preferredStudentProfiles,
      preferredCareerStages: input.preferredCareerStages,
    });

    return updated;
  }

  async updateCapacity(userId: string, input: UpdateMentorCapacityInput) {
    const alumnus = await alumnusRepository.findByUserId(userId);
    if (!alumnus) {
      throw new AppError('Alumnus profile not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const capacity = await alumnusRepository.upsertCapacity(alumnus._id.toString(), {
      mentorId: alumnus._id,
      maxActiveMentees: input.maxActiveMentees,
      isAcceptingRequests: input.isAcceptingRequests,
      isPaused: input.isPaused,
      pauseReason: input.pauseReason,
    });

    // Update alumnus searchability based on active state and verification
    const isSearchable =
      alumnus.verificationStatus === 'VERIFIED' &&
      input.isAcceptingRequests &&
      !input.isPaused;

    await alumnusRepository.update(alumnus._id.toString(), { isSearchable });

    return capacity;
  }

  /**
   * Search verified mentors for students.
   * Guarantees strict privacy: Never returns email, phone, or verification documents.
   */
  async searchMentorsForStudents(
    query: { industry?: string; expertise?: string; search?: string },
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;
    const mongoQuery: any = {};

    if (query.industry) {
      mongoQuery.industry = new RegExp(query.industry, 'i');
    }

    if (query.expertise) {
      mongoQuery.expertiseTags = { $in: [new RegExp(query.expertise, 'i')] };
    }

    if (query.search) {
      mongoQuery.$or = [
        { professionalDesignation: new RegExp(query.search, 'i') },
        { organisation: new RegExp(query.search, 'i') },
        { expertiseTags: { $in: [new RegExp(query.search, 'i')] } },
      ];
    }

    const { mentors, total } = await alumnusRepository.findSearchableMentors(
      mongoQuery,
      skip,
      limit
    );

    // Strict privacy serialization: map through serializeStudentViewAlumnus
    const sanitizedMentors = mentors.map((m) =>
      serializeStudentViewAlumnus(m, (m as any).userId)
    );

    return {
      mentors: sanitizedMentors,
      total,
      page,
      limit,
    };
  }
}

export const alumnusService = new AlumnusService();

