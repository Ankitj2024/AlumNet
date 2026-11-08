import { AlumnusModel } from '../models/Alumnus.model.js';
import { MentorCapacityModel } from '../models/MentorCapacity.model.js';
import { StudentProfileModel } from '../models/StudentProfile.model.js';
import { AvailabilityWindowModel } from '../models/AvailabilityWindow.model.js';
import { ProgrammeSettingsModel } from '../models/ProgrammeSettings.model.js';
import { serializeStudentViewAlumnus } from '../serializers/alumni.serializer.js';
import { PROGRAMME_DEFAULTS } from '@p11/shared';

export interface MatchRecommendationResult {
  mentor: any;
  overallScore: number;
  breakdown: {
    expertiseScore: number;
    roleScore: number;
    industryScore: number;
    mentoringInterestScore: number;
    availabilityScore: number;
  };
  explanation: {
    matchingSkills: string[];
    matchingRoles: string[];
    matchingIndustries: string[];
    hasAvailabilityOverlap: boolean;
    reasons: string[];
  };
}

export class MatchingEngineService {
  /**
   * Compute multi-factor weighted match recommendations for a student
   */
  async getRecommendationsForStudent(
    userId: string,
    limit = 10
  ): Promise<MatchRecommendationResult[]> {
    const student = await StudentProfileModel.findOne({ userId });
    if (!student) {
      return [];
    }

    // Retrieve active matching weights from ProgrammeSettings or fallback to defaults
    const settings = await ProgrammeSettingsModel.findOne().sort({ createdAt: -1 });
    const weights = settings?.matchingWeights || {
      expertiseWeight: PROGRAMME_DEFAULTS.MATCHING_WEIGHTS.EXPERTISE,
      roleWeight: PROGRAMME_DEFAULTS.MATCHING_WEIGHTS.ROLE,
      industryWeight: PROGRAMME_DEFAULTS.MATCHING_WEIGHTS.INDUSTRY,
      mentoringInterestWeight: PROGRAMME_DEFAULTS.MATCHING_WEIGHTS.INTEREST,
      availabilityWeight: PROGRAMME_DEFAULTS.MATCHING_WEIGHTS.AVAILABILITY,
    };

    // Find all verified, searchable mentors
    const verifiedMentors = await AlumnusModel.find({
      verificationStatus: 'VERIFIED',
      isSearchable: true,
    }).populate('userId');

    // Retrieve active capacity records to filter out saturated mentors
    const capacities = await MentorCapacityModel.find({
      isAcceptingRequests: true,
      isPaused: false,
    });
    const capacityMap = new Map(capacities.map((c) => [c.mentorId.toString(), c]));

    const eligibleMentors = verifiedMentors.filter((mentor) => {
      const cap = capacityMap.get(mentor._id.toString());
      return cap && cap.currentActiveMentees < cap.maxActiveMentees;
    });

    const recommendations: MatchRecommendationResult[] = [];

    const studentSkills = new Set(student.skills.map((s) => s.toLowerCase().trim()));
    const studentRoles = new Set(student.targetJobRoles.map((r) => r.toLowerCase().trim()));
    const studentIndustries = new Set(student.preferredIndustries.map((i) => i.toLowerCase().trim()));

    for (const mentor of eligibleMentors) {
      // 1. Expertise Overlap
      const mentorTags = (mentor.expertiseTags || []).map((t) => t.toLowerCase().trim());
      const matchingSkills = mentorTags.filter((t) => studentSkills.has(t));
      const expertiseRatio =
        studentSkills.size > 0 ? matchingSkills.length / Math.min(studentSkills.size, 5) : 0;
      const expertiseScore = Math.min(100, Math.round(expertiseRatio * 100));

      // 2. Career Role Overlap
      const mentorRole = (mentor.professionalDesignation || '').toLowerCase();
      const matchingRoles = Array.from(studentRoles).filter(
        (targetRole) => mentorRole.includes(targetRole) || targetRole.includes(mentorRole)
      );
      const roleScore = matchingRoles.length > 0 ? 100 : 0;

      // 3. Industry Overlap
      const mentorIndustry = (mentor.industry || '').toLowerCase();
      const matchingIndustries = Array.from(studentIndustries).filter(
        (ind) => ind.includes(mentorIndustry) || mentorIndustry.includes(ind)
      );
      const industryScore = matchingIndustries.length > 0 ? 100 : 20;

      // 4. Mentoring Interest Overlap
      const mentoringTopics = (mentor.mentoringTopics || []).map((t) => t.toLowerCase());
      const hasInterviewPrep =
        mentoringTopics.some((t) => t.includes('interview') || t.includes('resume')) &&
        (student.academicProgramme || '').length > 0;
      const mentoringInterestScore = hasInterviewPrep ? 90 : 50;

      // 5. Availability Overlap
      const windows = await AvailabilityWindowModel.find({ mentorId: mentor._id });
      const hasAvailabilityOverlap = windows.length > 0;
      const availabilityScore = hasAvailabilityOverlap ? 100 : 60;

      // Weighted Total Score
      const totalWeight =
        weights.expertiseWeight +
        weights.roleWeight +
        weights.industryWeight +
        weights.mentoringInterestWeight +
        weights.availabilityWeight;

      const rawScore =
        expertiseScore * weights.expertiseWeight +
        roleScore * weights.roleWeight +
        industryScore * weights.industryWeight +
        mentoringInterestScore * weights.mentoringInterestWeight +
        availabilityScore * weights.availabilityWeight;

      const overallScore = Math.min(100, Math.round(rawScore / (totalWeight || 100)));

      // Explainable reasons
      const reasons: string[] = [];
      if (matchingSkills.length > 0) {
        reasons.push(
          `Matches ${matchingSkills.length} of your target skills: ${matchingSkills.slice(0, 3).join(', ')}`
        );
      }
      if (matchingRoles.length > 0) {
        reasons.push(`Experienced in your target career role (${mentor.professionalDesignation})`);
      }
      if (matchingIndustries.length > 0) {
        reasons.push(`Active in your preferred industry (${mentor.industry})`);
      }
      if (hasAvailabilityOverlap) {
        reasons.push(`Has recurring open mentoring availability slots`);
      }

      recommendations.push({
        mentor: serializeStudentViewAlumnus(mentor, (mentor as any).userId),
        overallScore,
        breakdown: {
          expertiseScore,
          roleScore,
          industryScore,
          mentoringInterestScore,
          availabilityScore,
        },
        explanation: {
          matchingSkills,
          matchingRoles,
          matchingIndustries,
          hasAvailabilityOverlap,
          reasons,
        },
      });
    }

    // Sort by overall score descending
    recommendations.sort((a, b) => b.overallScore - a.overallScore);
    return recommendations.slice(0, limit);
  }
}

export const matchingEngineService = new MatchingEngineService();
