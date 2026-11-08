// User Roles & Account Lifecycle
export type UserRole =
  | 'STUDENT'
  | 'ALUMNI_MENTOR'
  | 'ALUMNI_RELATIONS_OFFICER'
  | 'PLACEMENT_OFFICER'
  | 'SUPER_ADMIN';

export type UserStatus =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED'
  | 'PENDING_EMAIL_VERIFICATION';

// Verification Lifecycle
export type VerificationStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'NEEDS_INFORMATION'
  | 'SUSPENDED';

export type VerificationMethod =
  | 'INSTITUTIONAL_ERP_MATCH'
  | 'CSV_REGISTRAR_MATCH'
  | 'MANUAL_DOCUMENT_REVIEW';

// Mentorship & Request Lifecycle
export type MentorshipRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export type MentorshipStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'PAUSED'
  | 'TERMINATED';

export type MentorshipHealthStatus =
  | 'HEALTHY'
  | 'AT_RISK'
  | 'DORMANT';

// Sessions & Goals Lifecycle
export type SessionStatus =
  | 'PROPOSED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export type CalendarProvider = 'GOOGLE' | 'OUTLOOK' | 'NONE';

export type GoalCategory =
  | 'TECHNICAL_SKILLS'
  | 'CAREER_STRATEGY'
  | 'INTERVIEW_PREP'
  | 'NETWORKING'
  | 'PORTFOLIO_REVIEW';

export type GoalStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export type ActionItemPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// User DTOs
export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface AuthSessionDTO {
  user: UserDTO;
  token?: string; // Optional if sent via HTTP-only cookie
}

// Alumnus & Mentor DTOs - STRICT PRIVACY SEPARATION
/**
 * StudentViewAlumnusDTO: Strictly strips personal contact info, direct email,
 * phone number, and internal institutional documents.
 */
export interface StudentViewAlumnusDTO {
  id: string;
  alumnusId: string;
  firstName: string;
  lastName: string;
  professionalDesignation: string;
  organisation: string;
  industry: string;
  yearsOfExperience: number;
  professionalSummary: string;
  expertiseTags: string[];
  mentoringTopics: string[];
  preferredStudentProfiles: string[];
  preferredCareerStages: string[];
  graduationYear: number;
  academicDepartment: string;
  degree: string;
  isAcceptingRequests: boolean;
  verificationStatus: VerificationStatus;
}

/**
 * AdminAlumnusDTO: Authorized view for Alumni Relations Officers containing
 * verification review references.
 */
export interface AdminAlumnusDTO extends StudentViewAlumnusDTO {
  email: string;
  institutionalId: string;
  verificationMethod?: VerificationMethod;
  documentUrls: string[];
  maxActiveMentees: number;
  currentActiveMentees: number;
  isPaused: boolean;
  pauseReason?: string;
}

// Student Profile DTO
export interface StudentProfileDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  institutionalStudentId: string;
  academicProgramme: string;
  department: string;
  expectedGraduationYear: number;
  skills: string[];
  targetJobRoles: string[];
  preferredIndustries: string[];
  preferredCommunicationFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  timeZone: string;
  profileCompletionScore: number;
}

// Verification Request DTO
export interface VerificationRequestDTO {
  id: string;
  alumnusId: string;
  userId: string;
  applicantName: string;
  submittedAlumniId: string;
  graduationYear: number;
  academicDepartment: string;
  degree: string;
  documentUrls: string[];
  verificationMethod: VerificationMethod;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  reviewNotes?: string;
  matchedInstitutionalRecord?: {
    id: string;
    legalFullName: string;
    graduationYear: number;
    academicDepartment: string;
    degreeAwarded: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Institutional Alumni Record DTO
export interface InstitutionalAlumniRecordDTO {
  id: string;
  institutionalAlumniId: string;
  legalFullName: string;
  graduationYear: number;
  academicDepartment: string;
  degreeAwarded: string;
  officialEmail?: string;
  source: 'MANUAL_IMPORT' | 'REGISTRAR_ERP_SYNC' | 'CSV_BATCH';
  isClaimed: boolean;
}

// Mentor Capacity DTO
export interface MentorCapacityDTO {
  mentorId: string;
  maxActiveMentees: number;
  currentActiveMentees: number;
  remainingCapacity: number;
  isAcceptingRequests: boolean;
  isPaused: boolean;
  pauseReason?: string;
  lastUpdated: string;
}

// API Response Envelopes
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
    requestId?: string;
  };
}

