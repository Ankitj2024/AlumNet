# Data Visibility Matrix & Privacy Boundary Controls
## P11 — Verified Alumni Mentorship Platform
**Classification:** Confidential Institutional Policy  
**Mandate:** Non-negotiable Privacy Guarantee  

---

## 1. Core Privacy Invariant: Alumni Contact Protection

> **CRITICAL DIRECTIVE:**
> An alumnus's direct personal email address, institutional email address, phone number, private physical address, verification identity documents, and OAuth calendar tokens **MUST NEVER** be exposed in any API response accessible to students or unauthenticated users.

---

## 2. Field-Level Data Visibility by Consumer Role

| Data Entity & Field | Student (`STUDENT`) | Mentor (`ALUMNI_MENTOR`) | Alumni Officer (`ALUMNI_RELATIONS_OFFICER`) | Placement Officer (`PLACEMENT_OFFICER`) | Super Admin (`SUPER_ADMIN`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Alumnus Identity** |
| Full Legal Name | Visible | Visible | Visible | Visible | Visible |
| Direct Personal Email | **MASKED / EXCLUDED** | Self Only | Visible (Admin View) | **MASKED / EXCLUDED** | Audited |
| Phone Number | **MASKED / EXCLUDED** | Self Only | Visible (Admin View) | **MASKED / EXCLUDED** | Audited |
| Institutional Roll / Alumni ID | **EXCLUDED** | Self Only | Visible | **EXCLUDED** | Visible |
| Verification Documents (S3 Paths) | **EXCLUDED** | Self Only | Full (Presigned URL) | **EXCLUDED** | Full |
| **Professional Profile** |
| Designation & Current Company | Visible | Visible | Visible | Visible | Visible |
| Industry & Domain | Visible | Visible | Visible | Visible | Visible |
| Years of Experience | Visible | Visible | Visible | Visible | Visible |
| Professional Summary & Bio | Visible | Visible | Visible | Visible | Visible |
| Skills & Expertise Tags | Visible | Visible | Visible | Visible | Visible |
| Mentoring Topics Offered | Visible | Visible | Visible | Visible | Visible |
| **Mentor Capacity & Availability** |
| Max Mentees / Total Capacity | **EXCLUDED** | Self Only | Visible | Aggregated | Visible |
| Active Mentee Count | **EXCLUDED** | Self Only | Visible | Aggregated | Visible |
| "Accepting Mentees" Badge | Visible (True/False) | Self Only | Visible | Aggregated | Visible |
| Public Recurring Slots | Available Only | Self Only | Visible | **EXCLUDED** | Visible |
| Private Calendar Event Titles | **NEVER** | Self (OAuth) | **NEVER** | **NEVER** | **NEVER** |
| Calendar Refresh Tokens | **NEVER** | **NEVER** | **NEVER** | **NEVER** | **NEVER** (Encrypted DB) |
| **Student Profile** |
| Student Full Name | Mentor (Accepted) | Mentor (Accepted) | Visible | Visible | Visible |
| Student Institutional Email | Enrolled Mentor | Self Only | Visible | Visible | Visible |
| Student Phone Number | **EXCLUDED** | Self Only | Visible | **EXCLUDED** | Visible |
| Academic Programme & Dept | Visible | Visible | Visible | Visible | Visible |
| Graduation Year & Skills | Visible | Visible | Visible | Visible | Visible |
| Career Goals & Objectives | Matched Mentor | Matched Mentor | Visible | Visible | Visible |
| **Mentorship Content** |
| Session Notes (Mentor Private) | **EXCLUDED** | Author Only | Compliance Audit Only | **EXCLUDED** | Compliance Audit Only |
| Session Notes (Shared) | Enrolled Both | Enrolled Both | Read-Only | **EXCLUDED** | Read-Only |
| In-Platform Chat Messages | Enrolled Both | Enrolled Both | Flagged/Audit Only | **EXCLUDED** | Flagged/Audit Only |
| Feedback Scores & Text | Aggregated/Self | Aggregated/Self | Full | Anonymized | Full |

---

## 3. Implementation of Allowlist DTO Serialization

The backend uses strictly typed serialization mappers:
1. `serializeStudentViewAlumnus(alumnus: IAlumnusDocument): StudentViewAlumnusDTO`
   - Explicitly omits `email`, `phone`, `institutionalId`, `documentUrls`, `currentActiveMentees`, and `maxActiveMentees`.
   - Exposes `id`, `name`, `professionalDesignation`, `organisation`, `industry`, `expertiseTags`, `mentoringTopics`, `isAcceptingRequests`.
2. Recursive JSON payload scanner runs during integration test execution to verify zero occurrences of `@` symbols or phone number patterns in any payload delivered to a student session.

