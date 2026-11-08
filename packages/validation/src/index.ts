import { z } from 'zod';

// Password strength requirement: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// User Registration Schema
export const registerUserSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: passwordSchema,
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  role: z.enum(['STUDENT', 'ALUMNI_MENTOR']),
});
export type RegisterUserInput = z.infer<typeof registerUserSchema>;

// User Login Schema
export const loginUserSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginUserInput = z.infer<typeof loginUserSchema>;

// Alumni Verification Submission Schema
export const submitVerificationSchema = z.object({
  submittedAlumniId: z.string().trim().min(2, 'Institutional Alumni ID is required').toUpperCase(),
  graduationYear: z.number().int().min(1950).max(new Date().getFullYear()),
  academicDepartment: z.string().trim().min(2, 'Department is required'),
  degree: z.string().trim().min(2, 'Degree/Programme is required'),
  documentUrls: z.array(z.string().url('Invalid document URL')).optional().default([]),
});
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;

// Officer Verification Review Schema
export const reviewVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'NEEDS_INFORMATION', 'SUSPENDED']),
  reviewNotes: z.string().trim().max(1000).optional(),
  rejectionReason: z.string().trim().max(500).optional(),
});
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;

// Institutional Alumni Record CSV Import Schema
export const institutionalAlumniRecordSchema = z.object({
  institutionalAlumniId: z.string().trim().min(2).toUpperCase(),
  legalFullName: z.string().trim().min(2),
  graduationYear: z.coerce.number().int().min(1950).max(new Date().getFullYear()),
  academicDepartment: z.string().trim().min(2),
  degreeAwarded: z.string().trim().min(2),
  officialEmail: z.string().trim().email().toLowerCase().optional(),
});
export type InstitutionalAlumniRecordInput = z.infer<typeof institutionalAlumniRecordSchema>;

// Mentor Professional Profile Schema
export const updateMentorProfileSchema = z.object({
  professionalDesignation: z.string().trim().min(2, 'Designation is required').max(100),
  organisation: z.string().trim().min(2, 'Organisation is required').max(100),
  industry: z.string().trim().min(2, 'Industry is required').max(50),
  yearsOfExperience: z.number().int().min(0).max(60),
  professionalSummary: z.string().trim().min(20, 'Summary must be at least 20 characters').max(1500),
  expertiseTags: z.array(z.string().trim().min(1)).min(1, 'At least 1 expertise tag is required'),
  mentoringTopics: z.array(z.string().trim().min(1)).min(1, 'At least 1 mentoring topic is required'),
  preferredStudentProfiles: z.array(z.string().trim()).optional().default([]),
  preferredCareerStages: z.array(z.string().trim()).optional().default([]),
});
export type UpdateMentorProfileInput = z.infer<typeof updateMentorProfileSchema>;

// Mentor Capacity Schema
export const updateMentorCapacitySchema = z.object({
  maxActiveMentees: z.number().int().min(1, 'Capacity must be at least 1').max(10, 'Capacity cannot exceed 10'),
  isAcceptingRequests: z.boolean(),
  isPaused: z.boolean(),
  pauseReason: z.string().trim().max(250).optional(),
});
export type UpdateMentorCapacityInput = z.infer<typeof updateMentorCapacitySchema>;

// Student Career Profile Schema
export const updateStudentProfileSchema = z.object({
  institutionalStudentId: z.string().trim().min(2, 'Student Roll ID is required').toUpperCase(),
  academicProgramme: z.string().trim().min(2, 'Programme is required'),
  department: z.string().trim().min(2, 'Department is required'),
  expectedGraduationYear: z.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 6),
  skills: z.array(z.string().trim().min(1)).min(1, 'At least one skill is required'),
  targetJobRoles: z.array(z.string().trim().min(1)).min(1, 'At least one target job role is required'),
  preferredIndustries: z.array(z.string().trim().min(1)).min(1, 'At least one preferred industry is required'),
  preferredCommunicationFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']).default('BIWEEKLY'),
  timeZone: z.string().default('UTC'),
});
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

// Career Goal Schema
export const createCareerGoalSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(500),
  targetRole: z.string().trim().min(2),
  targetIndustry: z.string().trim().min(2),
  targetCompletionDate: z.coerce.date(),
  isPrimary: z.boolean().default(false),
});
export type CreateCareerGoalInput = z.infer<typeof createCareerGoalSchema>;

// Mentorship Request Schema
export const createMentorshipRequestSchema = z.object({
  mentorId: z.string().min(1, 'Mentor ID is required'),
  careerObjective: z.string().trim().min(10, 'Objective must be at least 10 characters').max(300),
  requestMessage: z.string().trim().min(20, 'Message must be at least 20 characters').max(1500),
  preferredTopics: z.array(z.string().trim().min(1)).min(1, 'Select at least 1 topic'),
  expectedOutcomes: z.string().trim().min(10).max(500),
  preferredAvailability: z.string().trim().min(5).max(200),
});
export type CreateMentorshipRequestInput = z.infer<typeof createMentorshipRequestSchema>;

// Session Proposal Schema
export const proposeSessionSchema = z.object({
  scheduledStartTime: z.coerce.date(),
  scheduledEndTime: z.coerce.date(),
  timeZone: z.string().default('UTC'),
  agenda: z.string().trim().min(5).max(500),
  meetingLink: z.string().url().optional(),
});
export type ProposeSessionInput = z.infer<typeof proposeSessionSchema>;

