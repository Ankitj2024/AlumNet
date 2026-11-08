import mongoose from 'mongoose';
import { config } from '@p11/config';
import { UserModel } from '../apps/api/src/models/User.model.js';
import { AlumnusModel } from '../apps/api/src/models/Alumnus.model.js';
import { MentorCapacityModel } from '../apps/api/src/models/MentorCapacity.model.js';
import { StudentProfileModel } from '../apps/api/src/models/StudentProfile.model.js';
import { InstitutionalAlumniRecordModel } from '../apps/api/src/models/InstitutionalAlumniRecord.model.js';
import { VerificationRequestModel } from '../apps/api/src/models/VerificationRequest.model.js';
import { hashPassword } from '../apps/api/src/utils/password.util.js';

async function seed() {
  console.log(`[P11 Seeder] Connecting to database at ${config.MONGODB_URI}...`);
  await mongoose.connect(config.MONGODB_URI);

  console.log('[P11 Seeder] Cleaning existing collections...');
  await Promise.all([
    UserModel.deleteMany({}),
    AlumnusModel.deleteMany({}),
    MentorCapacityModel.deleteMany({}),
    StudentProfileModel.deleteMany({}),
    InstitutionalAlumniRecordModel.deleteMany({}),
    VerificationRequestModel.deleteMany({}),
  ]);

  const defaultPasswordHash = await hashPassword('DemoPassword123!');

  console.log('[P11 Seeder] Seeding institutional registrar alumni records...');
  const instRecords = await InstitutionalAlumniRecordModel.create([
    {
      institutionalAlumniId: 'ALUM-2022-CS-001',
      legalFullName: 'Sarah Connor',
      graduationYear: 2022,
      academicDepartment: 'Computer Science',
      degreeAwarded: 'B.Tech Computer Science',
      officialEmail: 'sarah.c@alumni.edu',
      source: 'REGISTRAR_ERP_SYNC',
    },
    {
      institutionalAlumniId: 'ALUM-2020-CS-088',
      legalFullName: 'Kevin Gao',
      graduationYear: 2020,
      academicDepartment: 'Computer Science',
      degreeAwarded: 'B.Tech Computer Science',
      officialEmail: 'kevin.g@alumni.edu',
      source: 'REGISTRAR_ERP_SYNC',
    },
    {
      institutionalAlumniId: 'ALUM-2021-EE-045',
      legalFullName: 'Ananya Sen',
      graduationYear: 2021,
      academicDepartment: 'Electrical Engineering',
      degreeAwarded: 'B.Tech Electrical',
      officialEmail: 'ananya.s@alumni.edu',
      source: 'REGISTRAR_ERP_SYNC',
    },
  ]);

  console.log('[P11 Seeder] Seeding Super Admin and Alumni Relations Officer...');
  const officerUser = await UserModel.create({
    email: 'officer.demo@university.edu',
    passwordHash: defaultPasswordHash,
    firstName: 'Carol',
    lastName: 'Vance',
    role: 'ALUMNI_RELATIONS_OFFICER',
    status: 'ACTIVE',
    isEmailVerified: true,
  });

  const adminUser = await UserModel.create({
    email: 'admin.demo@university.edu',
    passwordHash: defaultPasswordHash,
    firstName: 'System',
    lastName: 'Administrator',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    isEmailVerified: true,
  });

  console.log('[P11 Seeder] Seeding Verified Alumni Mentors...');
  // Mentor 1: Sarah Connor
  const mentor1User = await UserModel.create({
    email: 'mentor.demo@alumni.edu',
    passwordHash: defaultPasswordHash,
    firstName: 'Sarah',
    lastName: 'Connor',
    role: 'ALUMNI_MENTOR',
    status: 'ACTIVE',
    isEmailVerified: true,
  });

  const mentor1Alumnus = await AlumnusModel.create({
    userId: mentor1User._id,
    institutionalId: 'ALUM-2022-CS-001',
    graduationYear: 2022,
    academicDepartment: 'Computer Science',
    degree: 'B.Tech Computer Science',
    professionalDesignation: 'Senior Cloud Architect',
    organisation: 'Amazon Web Services',
    industry: 'Cloud Infrastructure',
    yearsOfExperience: 6,
    professionalSummary:
      'Passionate about guiding computer science undergraduates in cloud architecture, distributed systems, and real-world system design interviews.',
    expertiseTags: ['Distributed Systems', 'Cloud Architecture', 'Go', 'Kubernetes'],
    mentoringTopics: ['System Design Interviews', 'Cloud Certifications', 'Career Transitions'],
    verificationStatus: 'VERIFIED',
    isSearchable: true,
  });

  await MentorCapacityModel.create({
    mentorId: mentor1Alumnus._id,
    maxActiveMentees: 3,
    currentActiveMentees: 0,
    isAcceptingRequests: true,
    isPaused: false,
  });

  await VerificationRequestModel.create({
    alumnusId: mentor1Alumnus._id,
    userId: mentor1User._id,
    submittedAlumniId: 'ALUM-2022-CS-001',
    graduationYear: 2022,
    academicDepartment: 'Computer Science',
    degree: 'B.Tech Computer Science',
    status: 'VERIFIED',
    verificationMethod: 'INSTITUTIONAL_ERP_MATCH',
    institutionalRecordId: instRecords[0]._id,
    reviewedBy: officerUser._id,
    reviewedAt: new Date(),
    reviewNotes: 'Verified via institutional registrar database sync.',
    auditHistory: [
      {
        action: 'AUTO_VERIFIED_VIA_ERP',
        performedBy: mentor1User._id,
        timestamp: new Date(),
        comment: 'Matched confirmed registrar record.',
      },
    ],
  });

  // Mentor 2: Kevin Gao
  const mentor2User = await UserModel.create({
    email: 'kevin.gao@alumni.edu',
    passwordHash: defaultPasswordHash,
    firstName: 'Kevin',
    lastName: 'Gao',
    role: 'ALUMNI_MENTOR',
    status: 'ACTIVE',
    isEmailVerified: true,
  });

  const mentor2Alumnus = await AlumnusModel.create({
    userId: mentor2User._id,
    institutionalId: 'ALUM-2020-CS-088',
    graduationYear: 2020,
    academicDepartment: 'Computer Science',
    degree: 'B.Tech Computer Science',
    professionalDesignation: 'Staff Software Engineer',
    organisation: 'Google',
    industry: 'Distributed Systems',
    yearsOfExperience: 8,
    professionalSummary:
      'Engineering leader specializing in large-scale machine learning infrastructure and engineering career progression.',
    expertiseTags: ['TypeScript', 'Node.js', 'Distributed Systems', 'Python'],
    mentoringTopics: ['Resume Review', 'Algorithm Deep Dives', 'Staff Engineer Path'],
    verificationStatus: 'VERIFIED',
    isSearchable: true,
  });

  await MentorCapacityModel.create({
    mentorId: mentor2Alumnus._id,
    maxActiveMentees: 2,
    currentActiveMentees: 0,
    isAcceptingRequests: true,
    isPaused: false,
  });

  console.log('[P11 Seeder] Seeding Enrolled Students...');
  const studentUser = await UserModel.create({
    email: 'student.demo@university.edu',
    passwordHash: defaultPasswordHash,
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'STUDENT',
    status: 'ACTIVE',
    isEmailVerified: true,
  });

  await StudentProfileModel.create({
    userId: studentUser._id,
    institutionalStudentId: 'STU-2024-CS-019',
    academicProgramme: 'B.Tech',
    department: 'Computer Science',
    expectedGraduationYear: 2026,
    skills: ['TypeScript', 'React', 'MongoDB', 'Node.js'],
    targetJobRoles: ['Full Stack Engineer', 'Cloud Developer'],
    preferredIndustries: ['FinTech', 'Cloud Infrastructure'],
    preferredCommunicationFrequency: 'BIWEEKLY',
    timeZone: 'Asia/Kolkata',
    profileCompletionScore: 90,
  });

  console.log('[P11 Seeder] Database seeded successfully!');
  console.log(`
======================================================================
  P11 DEMO SEED CREDENTIALS (Password for all: DemoPassword123!)
======================================================================
  STUDENT:                  student.demo@university.edu
  VERIFIED ALUMNI MENTOR 1: mentor.demo@alumni.edu
  VERIFIED ALUMNI MENTOR 2: kevin.gao@alumni.edu
  ALUMNI RELATIONS OFFICER: officer.demo@university.edu
  SUPER ADMIN:              admin.demo@university.edu
======================================================================
`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[P11 Seeder] Failed to seed database:', err);
  process.exit(1);
});

