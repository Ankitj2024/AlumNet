# Product Requirements Specification (PRS)
## P11 — Verified Alumni Mentorship Matching and Engagement Platform
**Document Version:** 1.0.0  
**Status:** Approved for Baseline Implementation  
**Product Category:** University Alumni Engagement and Career Mentorship Management System  

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
Universities possess expansive alumni networks consisting of accomplished industry professionals, researchers, and entrepreneurs. However, mentorship engagement remains predominantly informal, fragmented, and inefficient:
1. **Unstructured Discovery**: Students rely on cold outreach via LinkedIn or personal networks, encountering low response rates and mismatched expectations.
2. **Mentor Burnout & Overload**: Popular alumni receive uncoordinated, overwhelming volumes of student inquiries without tools to set boundaries or control capacity.
3. **Institutional Blindspot**: Universities and placement cells lack visibility into:
   - Active mentoring relationships and their duration.
   - Mentor capacity utilization and risk of burnout.
   - Student goal achievement and career milestone completion.
   - Correlation between verified mentorship and placement/employment outcomes.
4. **Trust and Safety Deficits**: Without institutional verification, bad actors can impersonate alumni, and student privacy or alumni contact details can be leaked.

### 1.2 Core Product Promise
*Connect the right student with the right verified alumnus at the right time while strictly protecting alumni privacy and professional capacity.*

### 1.3 Core Product Principles
1. **Verified Professional Identity**: Every alumnus acting as a mentor must be institutionally verified before becoming discoverable.
2. **Relevant and Explainable Matching**: Mentor recommendations must be transparent, multi-dimensional, and explain why a match was proposed.
3. **Complete Protection of Mentor Capacity**: Capacity is an atomic invariant; a mentor accepting $N$ mentees will never exceed $N$ concurrent relationships under any race condition.
4. **Privacy-First Communication**: Alumni direct email and phone details are never exposed to students. All messaging and session coordination occurs securely within platform boundaries.
5. **Measurable Mentorship Outcomes**: Mentorship is tracked via concrete goals, actionable tasks, structured feedback, and placement correlation analytics.

---

## 2. Stakeholders & User Roles

| Role | Description | Key Objectives |
| :--- | :--- | :--- |
| **Student (`STUDENT`)** | Enrolled undergraduate or graduate student | Discover verified alumni, submit targeted requests, track goals, participate in structured mentoring sessions. |
| **Alumni Mentor (`ALUMNI_MENTOR`)** | Verified graduate of the institution | Guide students within strictly protected capacity, accept/decline requests with one click, manage availability. |
| **Alumni Relations Officer (`ALUMNI_RELATIONS_OFFICER`)** | University advancement / alumni office personnel | Verify alumni credentials, monitor mentor utilization/burnout, resolve disputes, oversee engagement health. |
| **Placement Officer (`PLACEMENT_OFFICER`)** | Career services and corporate relations officer | Analyze career outcomes, goal completions, industry trends, and placement correlation metrics (read-only). |
| **Super Administrator (`SUPER_ADMIN`)** | Central IT / Platform administrator | Configure system parameters, matching weights, integration credentials, security policies, and user privileges. |

---

## 3. Functional Requirements (Modules M1 – M10)

### 3.1 M1: Alumni Identity Verification
- **FR-1.1**: Alumni must submit institutional ID, degree, graduation year, academic department, current professional role, and optional supporting document (degree certificate, alumni card, or institutional letter).
- **FR-1.2**: Verification pipeline must support 3 sources:
  1. Automated lookup against institutional database / ERP.
  2. Batch CSV import from verified university registrar records.
  3. Manual document review by an authorized `ALUMNI_RELATIONS_OFFICER`.
- **FR-1.3**: Status machine: `NOT_SUBMITTED` $\to$ `PENDING` $\to$ `UNDER_REVIEW` $\to$ `VERIFIED` | `REJECTED` | `NEEDS_INFORMATION` | `SUSPENDED`.
- **FR-1.4**: Only `VERIFIED` and active alumni are discoverable by students.
- **FR-1.5**: Full audit logging of all reviewer actions, timestamps, and notes.

### 3.2 M2: Professional Profile and Capacity
- **FR-2.1**: Mentors manage professional profiles (designation, company, industry, experience, skills, mentoring topics, preferred student profiles).
- **FR-2.2**: Mentors define maximum active mentee capacity ($1 \le N \le 10$, default 2).
- **FR-2.3**: Backend invariant: `currentActiveMentees <= maxActiveMentees`. Atomic conditional updates and transactions must guarantee zero over-allocation under concurrent acceptances.
- **FR-2.4**: Capacity reconciliation background job to detect and repair drift.
- **FR-2.5**: One-click pause/resume mentoring toggle.

### 3.3 M3: Availability Management
- **FR-3.1**: Weekly recurring availability windows (day of week, start time UTC, end time UTC, local time zone).
- **FR-3.2**: Specific blackout dates and date-specific custom overrides.
- **FR-3.3**: Buffer rules: Minimum scheduling notice (e.g. 24h), maximum advance booking (e.g. 30 days).
- **FR-3.4**: UTC timestamp persistence paired with IANA time zone strings for daylight-saving transitions.

### 3.4 M4: Student Career Profile
- **FR-4.1**: Academic programme, department, expected graduation year, current skills, target job roles, preferred industries.
- **FR-4.2**: Multiple structured career goals with target timeframes.
- **FR-4.3**: Mentoring topic preferences and learning objectives.
- **FR-4.4**: Profile completion percentage score.

### 3.5 M5: Intelligent Mentor Matching
- **FR-5.1**: Multi-factor weighted ranking engine:
  - Expertise relevance (default 40%)
  - Career role relevance (default 20%)
  - Industry relevance (default 15%)
  - Mentoring interest relevance (default 10%)
  - Availability overlap (default 15%)
- **FR-5.2**: Automatic exclusion of unverified, paused, suspended, or full-capacity mentors.
- **FR-5.3**: Explainable match cards returning explicit overlap rationale (e.g., "Matches 3 of your target skills: React, Cloud Architecture, System Design").
- **FR-5.4**: Configurable weights managed by Super Admin with versioned audit trail.

### 3.6 M6: Mentorship Request Management
- **FR-6.1**: Student request submission with targeted objective, topic selection, expected outcomes, and preferred availability.
- **FR-6.2**: Throttling policies enforced on backend via Redis:
  - Max 3 concurrent pending requests per student.
  - Max 5 new requests per rolling 7-day window.
- **FR-6.3**: Request lifecycle: `PENDING` $\to$ `ACCEPTED` $\to$ `DECLINED` | `EXPIRED` | `CANCELLED`.
- **FR-6.4**: Automatic expiration after 7 days if unresponded.
- **FR-6.5**: One-click decline with optional polite feedback; zero penalty to mentor rating.
- **FR-6.6**: Idempotency keys on request creation and acceptance to prevent duplicate records.

### 3.7 M7: Scheduling and Session Management
- **FR-7.1**: In-platform session proposal, acceptance, rescheduling, and cancellation with reason.
- **FR-7.2**: Conflict detection against mentor availability and existing booked sessions.
- **FR-7.3**: Automated reminders (24h and 1h prior via BullMQ).
- **FR-7.4**: External calendar integration (Google Calendar & Microsoft Outlook) using encrypted OAuth refresh tokens.
- **FR-7.5**: Fallback to internal scheduling without external calendar requirements.

### 3.8 M8: Goals, Action Items and Feedback
- **FR-8.1**: Collaborative goal setting between mentor and student with category, milestone target date, and progress tracker.
- **FR-8.2**: Action item checklist with assignees, due dates, priority, and completion status.
- **FR-8.3**: Bi-directional post-session feedback (satisfaction rating 1-5, usefulness score, communication quality, private notes).

### 3.9 M9: Engagement Monitoring
- **FR-9.1**: Relationship health classification:
  - `HEALTHY`: Activity or scheduled session within last 14 days.
  - `AT_RISK`: No activity between 15 and 28 days.
  - `DORMANT`: Inactive for > 28 days.
- **FR-9.2**: Scheduled weekly background evaluator snapshotting engagement state.
- **FR-9.3**: Automated gentle nudges with rate-limited cooldowns.
- **FR-9.4**: Administrative intervention workflow for Alumni Relations Officers.

### 3.10 M10: Secure In-Platform Messaging
- **FR-10.1**: Real-time 1-on-1 messaging powered by Socket.IO over authenticated WebSocket sessions.
- **FR-10.2**: Strict room authorization: only authorized mentor and student of an active mentorship can subscribe.
- **FR-10.3**: PII protection engine: regex and heuristic screening for email addresses, phone numbers, and external messaging links with masking/warning.
- **FR-10.4**: Unread counts, delivery receipts, and paginated message history.

---

## 4. Non-Functional Requirements (NFRs)

- **Security**: OWASP ASVS compliance; Argon2id password hashing; HTTP-only, SameSite, Secure cookies; CSRF tokens; strictly sanitized inputs against NoSQL injection; rate limiting on all endpoints.
- **Privacy**: Strict field-level DTO serialization. Alumni email and phone numbers must never leak to student-facing responses under any circumstance.
- **Reliability & Idempotency**: Atomic capacity reservation; Redis-backed distributed locks and BullMQ job retries with exponential backoff and dead-letter queues.
- **Scalability**: Target 10,000 active students, 2,000 alumni mentors, 5,000 concurrent sessions. Database reads optimized with compound indexes.
- **Performance**: API p95 response time $< 150\text{ms}$ for read queries, $< 250\text{ms}$ for transactional writes.
- **Accessibility**: WCAG 2.1 AA compliance across all web views.

