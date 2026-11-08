# P11 Platform — Routing & Navigation Architecture
## Production-Grade Enterprise Page Hierarchy & State Flow

---

## 1. System Navigation Philosophy

The P11 Platform is structured as an **institutional role-driven ecosystem**. Users navigate through dedicated, isolated workspaces depending on their verified institutional role:
- **Public / Unauthenticated**: Discovery, marketing overview, authentication.
- **Student (`STUDENT`)**: Career development, mentor discovery, throttled requests, collaborative workspaces.
- **Alumni Mentor (`ALUMNI_MENTOR`)**: Professional identity, capacity-protected request triage, mentee workspaces.
- **Alumni Relations Officer (`ALUMNI_RELATIONS_OFFICER`)**: Identity audit queue, registrar master sync, health oversight.
- **Placement Officer (`PLACEMENT_OFFICER`)**: Read-only career outcome and mentorship correlation analytics.
- **Super Administrator (`SUPER_ADMIN`)**: Institutional policy, matching weights, security audit.

---

## 2. Complete Route Matrix & Permissions

| URL Path | Permitted Roles | Purpose & Features | Upstream / Source | Downstream / Destinations |
|---|---|---|---|---|
| `/` | Public | Institutional landing page, value props, demo launcher | Direct entry / Bookmark | `/auth/login`, `/auth/register` |
| `/auth/login` | Public | Authentication gateway with **Demo Credential Station** | `/`, Session timeout, Unauthorized redirects | Redirects to role dashboard upon auth |
| `/auth/register` | Public | Onboarding for students & alumni | `/auth/login` | `/student/profile` or `/mentor/verification` |
| **STUDENT ROUTES** | | | | |
| `/student` or `/student/dashboard` | `STUDENT` | Main student hub: KPIs, readiness gauge, upcoming sessions | `/auth/login`, Navbar | `/student/discover`, `/student/requests`, `/student/mentorships` |
| `/student/discover` | `STUDENT` | Multi-factor mentor recommendations & search with filters | `/student/dashboard` | Mentorship Request Modal, `/student/requests` |
| `/student/requests` | `STUDENT` | Sent mentorship request tracking & anti-spam quota status | `/student/dashboard`, Request modal | `/student/mentorships` (on accept) |
| `/student/mentorships` | `STUDENT` | Active mentorship list & collaborative workspaces | `/student/dashboard` | Sub-workspaces (Sessions, Goals, Chat, Feedback) |
| `/student/profile` | `STUDENT` | Career profile, target roles, preferred industries, skills | `/student/dashboard`, Notification banner | `/student/discover` (updated matches) |
| **MENTOR ROUTES** | | | | |
| `/mentor` or `/mentor/dashboard` | `ALUMNI_MENTOR` | Mentor hub: capacity gauge, pause/resume switch, alerts | `/auth/login`, Navbar | `/mentor/requests`, `/mentor/mentorships` |
| `/mentor/verification` | `ALUMNI_MENTOR` | Identity verification status & registrar submission form | `/mentor/dashboard` banner | `/mentor/dashboard` |
| `/mentor/requests` | `ALUMNI_MENTOR` | Incoming request queue: Accept (atomic) / Decline actions | `/mentor/dashboard`, Push alert | `/mentor/mentorships` (on accept) |
| `/mentor/mentorships` | `ALUMNI_MENTOR` | Active mentee workspaces (Sessions, Goals, In-Platform Chat) | `/mentor/dashboard` | Active workspace details |
| `/mentor/availability` | `ALUMNI_MENTOR` | Recurring weekly schedule & buffer time configuration | `/mentor/dashboard` | `/mentor/dashboard` |
| `/mentor/profile` | `ALUMNI_MENTOR` | Professional bio, company, experience, capacity ($1 \le N \le 10$) | `/mentor/dashboard` | `/mentor/dashboard` |
| **OFFICER ROUTES** | | | | |
| `/officer` or `/officer/dashboard` | `ALUMNI_RELATIONS_OFFICER` | Executive institutional oversight & health breakdown | `/auth/login`, Navbar | `/officer/verifications`, `/officer/registrar-sync` |
| `/officer/verifications` | `ALUMNI_RELATIONS_OFFICER` | Alumni identity audit queue with Approve/Reject actions | `/officer/dashboard` | `/officer/dashboard` |
| `/officer/registrar-sync` | `ALUMNI_RELATIONS_OFFICER` | Batch CSV upload for Registrar ERP master records | `/officer/dashboard` | `/officer/verifications` |
| `/officer/mentorships` | `ALUMNI_RELATIONS_OFFICER` | Campus-wide mentorship health tracker (Healthy/At-Risk/Dormant) | `/officer/dashboard` | Direct relationship intervention |
| `/officer/reports` | `ALUMNI_RELATIONS_OFFICER` | Audit trail & institutional engagement reports | `/officer/dashboard` | Export CSV / PDF |
| **ADMIN & ERROR ROUTES** | | | | |
| `/admin` | `SUPER_ADMIN` | Matching engine weights, request quotas, platform settings | `/auth/login` | System reconfiguration |
| `/unauthorized` | Any Authenticated | 403 Forbidden page when attempting cross-role traversal | Role-guard rejection | Safe redirect to user's permitted dashboard |

---

## 3. "Where to Where From Where" Flowcharts

### A. Student Journey
```
                       [ Landing Page (/) ]
                                |
                        [ /auth/login ]
                                | (Select Student Demo or Enter Credentials)
                        [ /student/dashboard ]
                     /          |           \
                    /           |            \
   [ /student/profile ]   [ /student/discover ]   [ /student/requests ]
   (Complete Skills &      (Review Match Cards,    (Track Pending Quotas:
    Target Job Roles)       Click Request Mentor)    e.g. 1/3 Used)
            |                   |                         |
             \                  v                         v
              `---> [ Mentorship Request Modal ] ---> [ Request Sent ]
                                                          |
                                            (Alumnus Accepts Request)
                                                          |
                                                          v
                                              [ /student/mentorships ]
                                              * Google Meet Sessions
                                              * Goals & Action Items
                                              * PII-Shielded Chat
                                              * Evaluation & Feedback
```

### B. Alumni Mentor Journey
```
                       [ /auth/login ]
                              | (Select Mentor Demo or Enter Credentials)
                      [ /mentor/dashboard ]
                     /        |          \
                    /         |           \
  [ /mentor/verification ]  [ /mentor/availability ]  [ /mentor/requests ]
  (Submit Alumni ID &       (Set Weekly Schedule &    (Review Pending Inbound
   Graduation Year)          Capacity: e.g. Max 3)      Requests)
            |                                             |
   (Officer Approves)                                     |-- [ Decline (with Reason) ]
            |                                             |
            v                                             `-- [ Accept Request ]
  [ Mentor Discovered in Search ]                             (Atomic Capacity Check)
                                                                  |
                                                                  v
                                                      [ /mentor/mentorships ]
                                                      * Workspace Activated
                                                      * Collaborate on Goals
                                                      * Confirm Calendar Calls
```

### C. Alumni Relations Officer Journey
```
                       [ /auth/login ]
                              | (Select Officer Demo)
                      [ /officer/dashboard ]
                     /        |          \
                    /         |           \
  [ /officer/registrar-sync ] |            [ /officer/mentorships ]
  (Upload Master CSV from    |            (Monitor Inactivity:
   University Registrar)      |             Healthy <=14d, At-Risk 15-28d)
            |                 |
            v                 v
  [ /officer/verifications ] - Audit Pending Submissions
  * Compare against ERP records
  * Click [Approve] -> Status VERIFIED -> Mentor becomes Searchable
  * Click [Reject]  -> Enter mandatory justification note
```

---

## 4. Authentication & State Lifecycle

```
[ Visitor ] ---> [ /auth/login ]
                      |
        POST /api/v1/auth/login { email, password }
                      |
       --------------------------------
       | Response: 200 OK             |
       | { token, user: { role, ...}} |
       --------------------------------
                      |
  1. Store token in localStorage ('token')
  2. Set HTTP-only session cookie (api response)
  3. Rehydrate AuthContext { user, role, isAuthenticated: true }
  4. Perform Deterministic Role Routing:
         if role == 'STUDENT'                  --> /student
         if role == 'ALUMNI_MENTOR'            --> /mentor
         if role == 'ALUMNI_RELATIONS_OFFICER' --> /officer
         if role == 'SUPER_ADMIN'              --> /admin
```

---

## 5. Working Demo Credentials Station

The login page exposes 4 one-tap autofill buttons:

| Button | Email | Password | Target Role & Route |
|---|---|---|---|
| **Demo Student** | `student.demo@university.edu` | `DemoPassword123!` | `STUDENT` &rarr; `/student` |
| **Demo Mentor** | `mentor.demo@alumni.edu` | `DemoPassword123!` | `ALUMNI_MENTOR` &rarr; `/mentor` |
| **Demo Officer** | `officer.demo@university.edu` | `DemoPassword123!` | `ALUMNI_RELATIONS_OFFICER` &rarr; `/officer` |
| **Demo Admin** | `admin.demo@university.edu` | `DemoPassword123!` | `SUPER_ADMIN` &rarr; `/admin` |

