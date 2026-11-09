import mongoose, { Types } from 'mongoose';
import { config, env } from '@p11/config';
import { UserModel } from '../apps/api/src/models/User.model.js';
import { AlumnusModel } from '../apps/api/src/models/Alumnus.model.js';
import { MentorCapacityModel } from '../apps/api/src/models/MentorCapacity.model.js';
import { StudentProfileModel } from '../apps/api/src/models/StudentProfile.model.js';
import { InstitutionalAlumniRecordModel } from '../apps/api/src/models/InstitutionalAlumniRecord.model.js';
import { VerificationRequestModel } from '../apps/api/src/models/VerificationRequest.model.js';
import { MentorshipModel } from '../apps/api/src/models/Mentorship.model.js';
import { MentorshipRequestModel } from '../apps/api/src/models/MentorshipRequest.model.js';
import { SessionModel } from '../apps/api/src/models/Session.model.js';
import { GoalModel } from '../apps/api/src/models/Goal.model.js';
import { ActionItemModel } from '../apps/api/src/models/ActionItem.model.js';
import { FeedbackModel } from '../apps/api/src/models/Feedback.model.js';
import { MessageModel } from '../apps/api/src/models/Message.model.js';
import { PlacementRecordModel } from '../apps/api/src/models/PlacementRecord.model.js';
import { ProgrammeSettingsModel } from '../apps/api/src/models/ProgrammeSettings.model.js';
import { AvailabilityWindowModel } from '../apps/api/src/models/AvailabilityWindow.model.js';
import { NotificationModel } from '../apps/api/src/models/Notification.model.js';
import { hashPassword } from '../apps/api/src/utils/password.util.js';
import { encryptMessage } from '../apps/api/src/utils/crypto.util.js';

const MENTOR_DATA = [
  { name: 'Sarah Connor', company: 'Amazon Web Services', title: 'Senior Cloud Architect', dept: 'Computer Science', exp: 7, tags: ['Distributed Systems', 'Cloud Architecture', 'Go', 'Kubernetes'], topics: ['System Design Interviews', 'Cloud Certifications', 'Career Transitions'] },
  { name: 'Kevin Gao', company: 'Google', title: 'Staff Software Engineer', dept: 'Computer Science', exp: 9, tags: ['Distributed Systems', 'TypeScript', 'Node.js', 'Python'], topics: ['Resume Review', 'Algorithm Deep Dives', 'Staff Engineer Path'] },
  { name: 'Ananya Sen', company: 'Microsoft', title: 'Principal Applied Scientist', dept: 'Artificial Intelligence', exp: 8, tags: ['Machine Learning', 'NLP', 'PyTorch', 'Large Language Models'], topics: ['AI Research Career', 'PhD vs Industry', 'Interviewing for ML'] },
  { name: 'Marcus Brody', company: 'Stripe', title: 'Staff Infrastructure Engineer', dept: 'Computer Science', exp: 10, tags: ['FinTech', 'High-Throughput Systems', 'Databases', 'Reliability'], topics: ['Payments Engineering', 'Scale 101', 'Promotion Strategy'] },
  { name: 'Elena Rostova', company: 'Goldman Sachs', title: 'Vice President, Quant Strategies', dept: 'Financial Engineering', exp: 9, tags: ['Quantitative Finance', 'C++', 'Algorithmic Trading', 'Risk Modeling'], topics: ['Wall Street Tech', 'Hedge Fund Interviews', 'C++ Performance'] },
  { name: 'David Kim', company: 'Apple', title: 'Senior Kernel Engineer', dept: 'Computer Engineering', exp: 6, tags: ['Operating Systems', 'C', 'ARM', 'Embedded Systems'], topics: ['Low-level Systems', 'Kernel Development', 'Silicon Valley Moves'] },
  { name: 'Priya Nambiar', company: 'Meta', title: 'Engineering Manager, AI Infra', dept: 'Computer Science', exp: 11, tags: ['Engineering Management', 'Distributed Training', 'PyTorch', 'System Architecture'], topics: ['Tech Lead to EM', 'Handling Burnout', 'Staff Plus Career'] },
  { name: 'Rahul Varma', company: 'Netflix', title: 'Senior Distributed Systems Engineer', dept: 'Computer Science', exp: 8, tags: ['Microservices', 'Java', 'Observability', 'Chaos Engineering'], topics: ['Streaming Tech', 'High Availability', 'Architecture Reviews'] },
  { name: 'Chloe Dubois', company: 'McKinsey & Company', title: 'Associate Partner, Digital Practice', dept: 'Management & Technology', exp: 10, tags: ['Product Strategy', 'Digital Transformation', 'Enterprise Tech'], topics: ['Management Consulting', 'Tech Strategy', 'Executive Presence'] },
  { name: 'Siddharth Roy', company: 'Uber', title: 'Lead Routing & Marketplace Engineer', dept: 'Computer Science', exp: 7, tags: ['Geospatial Systems', 'Realtime Routing', 'Go', 'Kafka'], topics: ['Marketplace Algorithms', 'System Architecture', 'Negotiating Offers'] },
  { name: 'Aisha Patel', company: 'NVIDIA', title: 'Senior CUDA Systems Engineer', dept: 'Electrical & Computer Engineering', exp: 6, tags: ['GPU Computing', 'CUDA', 'High Performance Computing', 'C++'], topics: ['GPU Programming', 'Hardware-Software Co-Design', 'AI Acceleration'] },
  { name: 'Liam O’Connor', company: 'Salesforce', title: 'Director of Platform Engineering', dept: 'Software Engineering', exp: 12, tags: ['Multi-tenant Systems', 'Enterprise Software', 'Java', 'Leadership'], topics: ['Enterprise Architecture', 'Team Building', 'Engineering Culture'] },
  { name: 'Zhenyu Wang', company: 'Palantir', title: 'Senior Forward Deployed Architect', dept: 'Data Science', exp: 5, tags: ['Data Engineering', 'Foundry', 'Ontology Design', 'Full Stack'], topics: ['Forward Deployed Work', 'Data Pipeline Scale', 'Client-Facing Tech'] },
  { name: 'Fatima Al-Mansoor', company: 'Databricks', title: 'Senior Spark Engine Developer', dept: 'Computer Science', exp: 6, tags: ['Apache Spark', 'Scala', 'Data Lakes', 'Delta Lake'], topics: ['Open Source Contributions', 'Lakehouse Architecture', 'Distributed Query'] },
  { name: 'Carlos Mendez', company: 'Cisco Systems', title: 'Principal Network Security Architect', dept: 'Network Engineering', exp: 13, tags: ['Zero Trust', 'Cybersecurity', 'SDN', 'Cryptography'], topics: ['Enterprise Security', 'Security Clearance Careers', 'Cyber Resilience'] },
  { name: 'Emily Watson', company: 'Intel Corporation', title: 'Lead SoC Verification Engineer', dept: 'Electrical Engineering', exp: 8, tags: ['Verilog', 'UVM', 'SystemC', 'Semiconductor Design'], topics: ['VLSI Careers', 'Chip Design Flow', 'Post-Silicon Validation'] },
  { name: 'Karthik Raman', company: 'Oracle Cloud', title: 'Cloud Platform Architect', dept: 'Information Technology', exp: 9, tags: ['OCI', 'Terraform', 'Bare Metal Cloud', 'Storage Systems'], topics: ['Cloud Migration', 'Database Internals', 'Senior Architect Path'] },
  { name: 'Mei-Ling Zhou', company: 'Snowflake', title: 'Core Query Engine Engineer', dept: 'Computer Science', exp: 7, tags: ['Query Optimization', 'C++', 'Data Warehousing', 'Cloud Databases'], topics: ['Database Engines', 'Compiler Design in DBs', 'Tech Interviews'] },
  { name: 'Jonas Lindqvist', company: 'Spotify', title: 'Senior Backend Engineer, Audio Infra', dept: 'Media Engineering', exp: 7, tags: ['Audio Streaming', 'Java', 'GCP', 'Event-Driven Systems'], topics: ['Music Tech', 'Audio Codecs', 'Global CDN Optimization'] },
  { name: 'Tara Mukherjee', company: 'Airbnb', title: 'Staff Product Engineer', dept: 'Computer Science', exp: 8, tags: ['React', 'Design Systems', 'GraphQL', 'Mobile Web'], topics: ['Product Engineering', 'Frontend at Scale', 'User Centered Architecture'] },
  { name: 'Arjun Nair', company: 'Bloomberg LP', title: 'Senior Financial Systems Engineer', dept: 'Computer Science', exp: 6, tags: ['Low Latency', 'C++', 'Realtime Market Data', 'Python'], topics: ['Financial Markets 101', 'Market Data Systems', 'C++ Performance Tricks'] },
  { name: 'Rohan Mehra', company: 'JPMorgan Chase', title: 'Executive Director, Core Tech', dept: 'Computer Science', exp: 14, tags: ['Enterprise Java', 'Spring Boot', 'Cloud Migration', 'DevSecOps'], topics: ['Banking Technology', 'FinTech Leadership', 'Regulatory Tech'] },
  { name: 'Sergei Ivanov', company: 'Morgan Stanley', title: 'Algorithmic Trading Lead', dept: 'Applied Mathematics', exp: 10, tags: ['Electronic Trading', 'FIX Protocol', 'Linux Kernel Tuning', 'C++'], topics: ['High Frequency Trading', 'Quantitative Interview Prep', 'Market Microstructure'] },
  { name: 'Devika Pillai', company: 'LinkedIn', title: 'Staff Machine Learning Engineer', dept: 'Computer Science', exp: 8, tags: ['Graph Neural Networks', 'Recommendation Systems', 'TensorFlow', 'Java'], topics: ['Social Graph Scale', 'Ranking Algorithms', 'Career Transition to ML'] },
  { name: 'Tobias Mueller', company: 'Atlassian', title: 'Senior Systems Engineer, Jira Cloud', dept: 'Computer Science', exp: 7, tags: ['SaaS Architecture', 'Kotlin', 'AWS Lambda', 'Observability'], topics: ['Developer Tooling', 'Async Microservices', 'Work-Life Balance in Tech'] },
  { name: 'Hina Takahashi', company: 'ByteDance', title: 'Senior Video Recommendation Engineer', dept: 'Artificial Intelligence', exp: 5, tags: ['Deep Learning', 'PyTorch', 'Vector Databases', 'Recommendation Models'], topics: ['Short-form Video Tech', 'Feed Ranking at Scale', 'Chinese Tech Ecosystem'] },
  { name: 'Nikhil Saxena', company: 'Twilio', title: 'Telephony Infrastructure Engineer', dept: 'Telecommunications', exp: 7, tags: ['WebRTC', 'SIP', 'Go', 'Distributed Voice'], topics: ['Realtime Communications', 'API Design', 'DevRel & Engineering'] },
  { name: 'Hannah Campbell', company: 'OpenAI', title: 'Member of Technical Staff, Alignment', dept: 'Computer Science & Cognitive Science', exp: 6, tags: ['RLHF', 'Transformer Architectures', 'AI Safety', 'Python'], topics: ['Frontier Models', 'AI Alignment Careers', 'Research Engineering'] },
  { name: 'Sanjay Deshmukh', company: 'Google DeepMind', title: 'Research Engineer', dept: 'Robotics & AI', exp: 8, tags: ['Reinforcement Learning', 'JAX', 'Autonomous Agents', 'Simulation'], topics: ['Publishing in Top Venues', 'Deep Reinforcement Learning', 'Research Lab Culture'] },
  { name: 'Leila Berisha', company: 'Adobe Systems', title: 'Principal Creative Cloud Architect', dept: 'Computer Graphics', exp: 11, tags: ['Computer Graphics', 'WebAssembly', 'C++', 'Creative Tools'], topics: ['Graphics Engineering', 'WebAssembly at Scale', 'Product Innovation'] },
];

const STUDENT_NAMES = [
  'Aarav Sharma', 'Aditi Rao', 'Akash Gupta', 'Ananya Roy', 'Armaan Sethi',
  'Ayush Verma', 'Bhavna Kulkarni', 'Chetan Desai', 'Deepika Nair', 'Devansh Pandey',
  'Divya Joshi', 'Eeshan Iyer', 'Gaurav Chopra', 'Harshita Sen', 'Ishaan Malhotra',
  'Jaya Reddy', 'Kabir Das', 'Kavita Menon', 'Kunal Bhatia', 'Lavanya Saxena',
  'Manish Tiwari', 'Meera Bhatt', 'Mohit Singhania', 'Neha Kapur', 'Naveen Prabhu',
  'Nisha Agarwal', 'Omkar Patil', 'Pallavi Ghosh', 'Parth Shukla', 'Pranav Hegde',
  'Pooja Nair', 'Raghav Bansal', 'Rhea Mehra', 'Rishi Kaushik', 'Ritu Srivastava',
  'Rohan Chawla', 'Sanjana Varma', 'Siddharth Bose', 'Simran Anand', 'Sneha Pillai',
  'Soham Mukherjee', 'Sparsh Mathur', 'Tanvi Mahajan', 'Tarun Nambiar', 'Trisha Paul',
  'Udit Narayan', 'Urvi Shah', 'Vaibhav Goyal', 'Vandana Rawat', 'Varun Reddy',
  'Vidya Shankar', 'Vikramaditya Rao', 'Vinay Kumar', 'Vrinda Kapoor', 'Yash Singhal',
  'Zara Siddiqui', 'Aman Oberoi', 'Anika Dixit', 'Dhruv Talwar', 'Esha Sengupta'
];

const STUDENT_DEPARTMENTS = [
  { dept: 'Computer Science', prog: 'B.Tech Computer Science', skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'], roles: ['Software Engineer', 'Full Stack Developer', 'Cloud Engineer'] },
  { dept: 'Artificial Intelligence', prog: 'M.Tech AI & Data Science', skills: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'FastAPI'], roles: ['Machine Learning Engineer', 'Data Scientist', 'AI Researcher'] },
  { dept: 'Financial Engineering', prog: 'Dual Degree Financial Tech', skills: ['Python', 'C++', 'Financial Modeling', 'SQL', 'Risk Analysis'], roles: ['Quantitative Analyst', 'Risk Strategist', 'FinTech Engineer'] },
  { dept: 'Electrical Engineering', prog: 'B.Tech Electrical & Electronics', skills: ['Verilog', 'Embedded C', 'MATLAB', 'VLSI', 'IoT Protocols'], roles: ['Embedded Systems Engineer', 'Hardware Architect', 'Firmware Developer'] },
  { dept: 'Information Systems', prog: 'B.Tech Information Technology', skills: ['Java', 'Spring Boot', 'Kubernetes', 'AWS', 'Kafka'], roles: ['Backend Engineer', 'DevOps Specialist', 'Cloud Solutions Architect'] },
  { dept: 'Data Science & Analytics', prog: 'M.Sc Data Science', skills: ['Python', 'Apache Spark', 'Tableau', 'R', 'Data Warehousing'], roles: ['Data Engineer', 'Business Intelligence Lead', 'Analytics Engineer'] },
];

async function seed() {
  console.log(`[P11 Seeder] Connecting to database at ${config.MONGODB_URI}...`);
  await mongoose.connect(config.MONGODB_URI);

  console.log('[P11 Seeder] Purging existing database collections for clean idempotent seed...');
  await Promise.all([
    UserModel.deleteMany({}),
    AlumnusModel.deleteMany({}),
    MentorCapacityModel.deleteMany({}),
    StudentProfileModel.deleteMany({}),
    InstitutionalAlumniRecordModel.deleteMany({}),
    VerificationRequestModel.deleteMany({}),
    MentorshipModel.deleteMany({}),
    MentorshipRequestModel.deleteMany({}),
    SessionModel.deleteMany({}),
    GoalModel.deleteMany({}),
    ActionItemModel.deleteMany({}),
    FeedbackModel.deleteMany({}),
    MessageModel.deleteMany({}),
    PlacementRecordModel.deleteMany({}),
    ProgrammeSettingsModel.deleteMany({}),
    AvailabilityWindowModel.deleteMany({}),
    NotificationModel.deleteMany({}),
  ]);

  const defaultPasswordHash = await hashPassword('DemoPassword123!');

  console.log('[P11 Seeder] Initializing Programme Settings...');
  await ProgrammeSettingsModel.create({
    matchingWeights: {
      skillOverlap: 0.35,
      industryMatch: 0.25,
      roleMatch: 0.20,
      departmentMatch: 0.10,
      communicationPreferenceMatch: 0.10,
    },
    maxPendingRequestsPerStudent: 3,
    maxRequestsPerRollingPeriod: 5,
    rollingPeriodDays: 7,
    requestExpiryDays: 7,
    mentorMinCapacity: 1,
    mentorMaxCapacity: 10,
    healthThresholds: {
      healthyMaxDays: 14,
      atRiskMaxDays: 28,
      dormantGraceDays: 7,
    },
    updatedBy: new Types.ObjectId(),
    changeHistory: [
      {
        modifiedBy: new Types.ObjectId(),
        modifiedAt: new Date(),
        reason: 'Initial production system baseline configuration',
        diff: 'Configured standard balanced matching weights and 14/28 health thresholds',
      },
    ],
  });

  console.log('[P11 Seeder] Seeding University Administrative & Officer Accounts...');
  const superAdmin = await UserModel.create({
    email: 'admin@university.edu',
    passwordHash: defaultPasswordHash,
    firstName: 'System',
    lastName: 'Administrator',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    isEmailVerified: true,
  });

  const alumniOfficer = await UserModel.create({
    email: 'officer@university.edu',
    passwordHash: defaultPasswordHash,
    firstName: 'Carol',
    lastName: 'Vance',
    role: 'ALUMNI_RELATIONS_OFFICER',
    status: 'ACTIVE',
    isEmailVerified: true,
  });

  const placementOfficer = await UserModel.create({
    email: 'placement@university.edu',
    passwordHash: defaultPasswordHash,
    firstName: 'Robert',
    lastName: 'Sterling',
    role: 'CAREER_SERVICES_OFFICER',
    status: 'ACTIVE',
    isEmailVerified: true,
  });

  console.log(`[P11 Seeder] Seeding 30 Verified Alumni Mentors across top industries...`);
  const mentorDocs: Array<{ user: any; alumnus: any }> = [];

  for (let i = 0; i < MENTOR_DATA.length; i++) {
    const data = MENTOR_DATA[i];
    const [firstName, ...lastNames] = data.name.split(' ');
    const lastName = lastNames.join(' ');
    const emailName = firstName.toLowerCase() + '.' + (lastName.toLowerCase().replace(/[^a-z]/g, ''));
    const email = `${emailName}@alumni.edu`;
    const instId = `ALUM-201${4 + (i % 8)}-${data.dept.substring(0, 2).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;

    // 1. Institutional Record
    const instRecord = await InstitutionalAlumniRecordModel.create({
      institutionalAlumniId: instId,
      legalFullName: data.name,
      graduationYear: 2014 + (i % 8),
      academicDepartment: data.dept,
      degreeAwarded: `B.Tech ${data.dept}`,
      officialEmail: email,
      source: 'REGISTRAR_ERP_SYNC',
    });

    // 2. User
    const user = await UserModel.create({
      email,
      passwordHash: defaultPasswordHash,
      firstName,
      lastName,
      role: 'ALUMNI_MENTOR',
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    // 3. Alumnus Profile
    const alumnus = await AlumnusModel.create({
      userId: user._id,
      institutionalId: instId,
      graduationYear: 2014 + (i % 8),
      academicDepartment: data.dept,
      degree: `B.Tech ${data.dept}`,
      professionalDesignation: data.title,
      organisation: data.company,
      industry: data.company === 'Goldman Sachs' || data.company === 'Morgan Stanley' || data.company === 'Stripe' ? 'FinTech' : 'Technology & Cloud',
      yearsOfExperience: data.exp,
      professionalSummary: `Seasoned professional at ${data.company} passionate about guiding ambitious university students in ${data.tags.slice(0, 3).join(', ')}.`,
      expertiseTags: data.tags,
      mentoringTopics: data.topics,
      verificationStatus: 'VERIFIED',
      isSearchable: true,
    });

    // 4. Capacity (2 to 4 slots)
    const maxSlots = 2 + (i % 3);
    await MentorCapacityModel.create({
      mentorId: alumnus._id,
      maxActiveMentees: maxSlots,
      currentActiveMentees: 0,
      isAcceptingRequests: true,
      isPaused: false,
    });

    // 5. Verification Request
    await VerificationRequestModel.create({
      alumnusId: alumnus._id,
      userId: user._id,
      submittedAlumniId: instId,
      graduationYear: 2014 + (i % 8),
      academicDepartment: data.dept,
      degree: `B.Tech ${data.dept}`,
      status: 'VERIFIED',
      verificationMethod: 'INSTITUTIONAL_ERP_MATCH',
      institutionalRecordId: instRecord._id,
      reviewedBy: alumniOfficer._id,
      reviewedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      reviewNotes: 'Verified against confirmed registrar graduation record.',
      auditHistory: [
        {
          action: 'AUTO_VERIFIED_VIA_ERP',
          performedBy: user._id,
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          comment: 'Matched official registrar alumni records.',
        },
      ],
    });

    // 6. Availability Window (Wednesdays and Saturdays 14:00 - 18:00 UTC)
    await AvailabilityWindowModel.create({
      mentorId: alumnus._id,
      dayOfWeek: i % 2 === 0 ? 3 : 6, // Wed or Sat
      startTimeUTC: '14:00',
      endTimeUTC: '18:00',
      mentorTimeZone: 'UTC',
      sessionDurationMinutes: 45,
      minNoticeHours: 24,
      maxAdvanceDays: 30,
      isRecurring: true,
      blackoutDates: [],
    });

    mentorDocs.push({ user, alumnus });
  }

  console.log(`[P11 Seeder] Seeding 60 Enrolled Students with academic profiles...`);
  const studentDocs: Array<{ user: any; profile: any }> = [];

  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const fullName = STUDENT_NAMES[i];
    const [firstName, ...lastNames] = fullName.split(' ');
    const lastName = lastNames.join(' ');
    const emailName = firstName.toLowerCase() + '.' + (lastName.toLowerCase().replace(/[^a-z]/g, ''));
    const email = `${emailName}@university.edu`;
    const instId = `STU-2023-${String(i + 1).padStart(3, '0')}`;
    const deptInfo = STUDENT_DEPARTMENTS[i % STUDENT_DEPARTMENTS.length];

    const user = await UserModel.create({
      email,
      passwordHash: defaultPasswordHash,
      firstName,
      lastName,
      role: 'STUDENT',
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    const profile = await StudentProfileModel.create({
      userId: user._id,
      institutionalStudentId: instId,
      academicProgramme: deptInfo.prog,
      department: deptInfo.dept,
      expectedGraduationYear: 2026,
      skills: deptInfo.skills,
      targetJobRoles: deptInfo.roles,
      preferredIndustries: ['Technology & Cloud', 'FinTech', 'Artificial Intelligence'],
      preferredCommunicationFrequency: i % 2 === 0 ? 'WEEKLY' : 'BIWEEKLY',
      timeZone: 'Asia/Kolkata',
      profileCompletionScore: 85 + (i % 15),
      pendingRequestsCount: 0,
    });

    studentDocs.push({ user, profile });
  }

  console.log('[P11 Seeder] Creating Mentorships, Requests, Sessions, Goals, Action Items, and Messages...');
  // 1. Establish 20 Active Mentorships
  for (let i = 0; i < 20; i++) {
    const student = studentDocs[i];
    const mentor = mentorDocs[i % mentorDocs.length];

    // Request
    const request = await MentorshipRequestModel.create({
      studentId: student.profile._id,
      mentorId: mentor.alumnus._id,
      careerObjective: `Seeking mentorship in ${student.profile.targetJobRoles[0]} and system architecture.`,
      requestMessage: `Hello ${mentor.user.firstName}, I am preparing for upcoming campus placements and would value your guidance on industry best practices and interview techniques.`,
      preferredTopics: mentor.alumnus.mentoringTopics.slice(0, 2),
      expectedOutcomes: 'Resume review, mock architectural discussion, and career navigation advice.',
      preferredAvailability: 'Wednesday afternoons',
      status: 'ACCEPTED',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      statusHistory: [
        { status: 'PENDING', changedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
        { status: 'ACCEPTED', changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), note: 'Delighted to mentor.' },
      ],
    });

    // Mentorship
    const mentorship = await MentorshipModel.create({
      studentId: student.profile._id,
      mentorId: mentor.alumnus._id,
      requestId: request._id,
      status: 'ACTIVE',
      healthStatus: i === 15 ? 'AT_RISK' : 'HEALTHY',
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      lastMeaningfulActivityAt: i === 15 ? new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) : new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      totalSessionsCompleted: 2,
    });

    // Increment mentor capacity
    await MentorCapacityModel.updateOne(
      { mentorId: mentor.alumnus._id },
      { $inc: { currentActiveMentees: 1 } }
    );

    // Goal
    const goal = await GoalModel.create({
      mentorshipId: mentorship._id,
      title: 'Technical Interview Mastery & Resume Refinement',
      description: 'Polish distributed systems portfolio and complete 3 mock system design sessions.',
      category: 'INTERVIEW_PREP',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      progressPercentage: 65,
      status: 'IN_PROGRESS',
      createdBy: mentor.user._id,
    });

    // Action Items
    await ActionItemModel.create([
      {
        goalId: goal._id,
        mentorshipId: mentorship._id,
        description: 'Complete end-to-end design doc for a distributed caching service',
        assignedTo: student.user._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'HIGH',
        isCompleted: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        goalId: goal._id,
        mentorshipId: mentorship._id,
        description: 'Review and update GitHub repository READMEs with architectural diagrams',
        assignedTo: student.user._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: 'MEDIUM',
        isCompleted: false,
      },
    ]);

    // Sessions: 1 Completed, 1 Confirmed Upcoming
    const pastStart = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    pastStart.setUTCHours(14, 0, 0, 0);
    const pastEnd = new Date(pastStart.getTime() + 45 * 60 * 1000);

    const pastSession = await SessionModel.create({
      mentorshipId: mentorship._id,
      scheduledStartTime: pastStart,
      scheduledEndTime: pastEnd,
      timeZone: 'UTC',
      status: 'COMPLETED',
      proposedBy: student.user._id,
      meetingLink: `https://meet.google.com/seed-ses-${i + 1}`,
      agenda: 'Introductory discussion and career timeline roadmap',
      mentorNotes: 'Student has a strong grasp of data structures. Needs more exposure to CAP theorem trade-offs.',
      sharedNotes: 'Action items established: Focus on database indexing and read/write replication strategies.',
      reminded24h: true,
      reminded1h: true,
      studentRating: 5,
      studentFeedback: 'Incredible session! Clear, actionable feedback on my technical preparation.',
    });

    // Feedback
    await FeedbackModel.create({
      mentorshipId: mentorship._id,
      sessionId: pastSession._id,
      submittedBy: student.user._id,
      recipientRole: 'MENTOR',
      satisfactionRating: 5,
      usefulnessScore: 5,
      communicationQuality: 5,
      textFeedback: 'Extremely supportive and insightful mentorship session.',
      isAnonymousToRecipient: false,
    });

    const futureStart = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    futureStart.setUTCHours(15, 0, 0, 0);
    const futureEnd = new Date(futureStart.getTime() + 45 * 60 * 1000);

    await SessionModel.create({
      mentorshipId: mentorship._id,
      scheduledStartTime: futureStart,
      scheduledEndTime: futureEnd,
      timeZone: 'UTC',
      status: 'CONFIRMED',
      proposedBy: mentor.user._id,
      meetingLink: `https://meet.google.com/upc-ses-${i + 1}`,
      agenda: 'Mock System Design Interview: Design URL Shortener at Scale',
      sharedNotes: 'Please review Redis caching and Cassandra data modeling prior to the call.',
      reminded24h: false,
      reminded1h: false,
    });

    // Privacy-Shield Protected Chat Messages
    const msg1Text = 'Hi! Looking forward to our mock design interview this week.';
    const enc1 = encryptMessage(msg1Text);
    await MessageModel.create({
      mentorshipId: mentorship._id,
      senderId: student.user._id,
      content: msg1Text,
      encryptedContent: enc1.encryptedContent,
      iv: enc1.iv,
      authTag: enc1.authTag,
      isRedacted: false,
      detectedTypes: [],
      readBy: [{ userId: mentor.user._id, readAt: new Date() }],
    });

    const msg2Text = 'Sounds great. Prepare your notes on sharding and consistency models.';
    const enc2 = encryptMessage(msg2Text);
    await MessageModel.create({
      mentorshipId: mentorship._id,
      senderId: mentor.user._id,
      content: msg2Text,
      encryptedContent: enc2.encryptedContent,
      iv: enc2.iv,
      authTag: enc2.authTag,
      isRedacted: false,
      detectedTypes: [],
      readBy: [{ userId: student.user._id, readAt: new Date() }],
    });
  }

  // 2. Establish 10 Completed Mentorships (Historical Success Stories)
  for (let i = 20; i < 30; i++) {
    const student = studentDocs[i];
    const mentor = mentorDocs[i % mentorDocs.length];

    const request = await MentorshipRequestModel.create({
      studentId: student.profile._id,
      mentorId: mentor.alumnus._id,
      careerObjective: 'Career transition and placement preparation',
      requestMessage: 'Requesting guidance for senior placement recruitment drive.',
      preferredTopics: mentor.alumnus.mentoringTopics,
      expectedOutcomes: 'Completed placement preparation and offer negotiation.',
      preferredAvailability: 'Weekends',
      status: 'ACCEPTED',
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      statusHistory: [{ status: 'ACCEPTED', changedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) }],
    });

    await MentorshipModel.create({
      studentId: student.profile._id,
      mentorId: mentor.alumnus._id,
      requestId: request._id,
      status: 'COMPLETED',
      healthStatus: 'HEALTHY',
      startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      lastMeaningfulActivityAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      totalSessionsCompleted: 4,
      closureReason: 'Successfully achieved career placement goals and secured campus offer.',
    });
  }

  // 3. Establish 5 Pending Requests
  for (let i = 30; i < 35; i++) {
    const student = studentDocs[i];
    const mentor = mentorDocs[(i + 5) % mentorDocs.length];

    await MentorshipRequestModel.create({
      studentId: student.profile._id,
      mentorId: mentor.alumnus._id,
      careerObjective: 'Interested in algorithmic trading and low latency C++ design.',
      requestMessage: `Dear ${mentor.user.firstName}, I would be honored to learn from your career journey at ${mentor.alumnus.organisation}.`,
      preferredTopics: mentor.alumnus.mentoringTopics,
      expectedOutcomes: 'Guidance on preparation strategy and code review.',
      preferredAvailability: 'Flexible',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      statusHistory: [{ status: 'PENDING', changedAt: new Date() }],
    });

    await StudentProfileModel.updateOne(
      { _id: student.profile._id },
      { $inc: { pendingRequestsCount: 1 } }
    );
  }

  // 4. Seed Verified Placement Records (For Analytics & Career Services)
  console.log('[P11 Seeder] Seeding 15 Verified Placement Records...');
  const placementCompanies = [
    { company: 'Google', role: 'Software Engineer', pkg: 3800000, curr: 'INR' },
    { company: 'Microsoft', role: 'Software Engineer', pkg: 3200000, curr: 'INR' },
    { company: 'Amazon Web Services', role: 'Cloud Support Engineer', pkg: 2800000, curr: 'INR' },
    { company: 'Goldman Sachs', role: 'Quant Analyst', pkg: 3400000, curr: 'INR' },
    { company: 'Stripe', role: 'Infrastructure Engineer', pkg: 4200000, curr: 'INR' },
    { company: 'Apple', role: 'Hardware Systems Engineer', pkg: 3600000, curr: 'INR' },
    { company: 'NVIDIA', role: 'System Software Engineer', pkg: 4000000, curr: 'INR' },
    { company: 'Databricks', role: 'Solutions Architect', pkg: 4500000, curr: 'INR' },
    { company: 'Uber', role: 'Software Engineer - Backend', pkg: 3500000, curr: 'INR' },
    { company: 'Salesforce', role: 'MTS 1', pkg: 3000000, curr: 'INR' },
    { company: 'Bloomberg LP', role: 'Software Engineer', pkg: 3300000, curr: 'INR' },
    { company: 'JPMorgan Chase', role: 'Software Analyst', pkg: 2400000, curr: 'INR' },
    { company: 'McKinsey & Company', role: 'Junior Digital Specialist', pkg: 2600000, curr: 'INR' },
    { company: 'OpenAI', role: 'AI Platform Fellow', pkg: 5000000, curr: 'INR' },
    { company: 'Atlassian', role: 'Graduate Developer', pkg: 2900000, curr: 'INR' },
  ];

  for (let i = 0; i < placementCompanies.length; i++) {
    const student = studentDocs[20 + i]; // Students with completed mentorships
    const comp = placementCompanies[i];

    await PlacementRecordModel.create({
      studentId: student.user._id,
      company: comp.company,
      role: comp.role,
      package: comp.pkg,
      currency: comp.curr,
      mentorshipAttributed: true,
      placedAt: new Date(Date.now() - (15 + i) * 24 * 60 * 60 * 1000),
      reportedBy: student.user._id,
      source: 'STUDENT_SELF_REPORT',
      verificationStatus: 'VERIFIED',
      notes: `AlumNet mentorship directly contributed to successful campus placement at ${comp.company}.`,
    });
  }

  console.log('[P11 Seeder] Seed complete!');
  console.log(`
================================================================================
  P11 / ALUMNET PRODUCTION SEED CREDENTIALS (Password for all: DemoPassword123!)
================================================================================
  SUPER ADMIN:              admin@university.edu
  ALUMNI RELATIONS OFFICER: officer@university.edu
  PLACEMENT OFFICER:        placement@university.edu

  VERIFIED ALUMNI MENTORS (30 total across top tech & finance leaders):
    - Sarah Connor (AWS):        sarah.connor@alumni.edu
    - Kevin Gao (Google):        kevin.gao@alumni.edu
    - Ananya Sen (Microsoft):    ananya.sen@alumni.edu
    - Marcus Brody (Stripe):     marcus.brody@alumni.edu
    - Elena Rostova (Goldman):   elena.rostova@alumni.edu
    - David Kim (Apple):         david.kim@alumni.edu
    - Priya Nambiar (Meta):      priya.nambiar@alumni.edu
    - Rahul Varma (Netflix):     rahul.varma@alumni.edu
    - Chloe Dubois (McKinsey):   chloe.dubois@alumni.edu
    - Siddharth Roy (Uber):      siddharth.roy@alumni.edu
    - Aisha Patel (NVIDIA):      aisha.patel@alumni.edu
    - Sanjay Deshmukh (DeepMind): sanjay.deshmukh@alumni.edu
    - Hannah Campbell (OpenAI):  hannah.campbell@alumni.edu
    (... and 17 more across Databricks, Snowflake, Spotify, Bloomberg, JPMC, etc.)

  STUDENTS (60 total across CS, AI, FinTech, Systems):
    - Aarav Sharma:              aarav.sharma@university.edu
    - Aditi Rao:                 aditi.rao@university.edu
    - Akash Gupta:               akash.gupta@university.edu
    - Ananya Roy:                ananya.roy@university.edu
================================================================================
`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[P11 Seeder] Failed to seed database:', err);
  process.exit(1);
});
