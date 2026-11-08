# REST API Specification (Contract)
## P11 — Verified Alumni Mentorship Platform
**API Base URL:** `/api/v1`  
**Protocol:** HTTPS with strict JSON payload serialization  

---

## 1. Global Conventions & Standards

### 1.1 Response Envelope
All API responses follow a uniform envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "timestamp": "2026-11-07T17:30:00.000Z"
  }
}
```

### 1.2 Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "CAPACITY_EXCEEDED",
    "message": "Mentor is currently at maximum mentee capacity.",
    "details": [],
    "requestId": "req_8f192b0e"
  }
}
```

---

## 2. API Endpoints by Domain

### 2.1 Authentication (`/auth`)
- `POST /auth/register` — Register new user account (role: `STUDENT` or `ALUMNI_MENTOR`).
- `POST /auth/login` — Authenticate credentials; sets HTTP-only JWT cookie.
- `POST /auth/logout` — Revokes active session and clears auth cookies.
- `GET /auth/me` — Retrieve current authenticated user profile and permissions.
- `POST /auth/forgot-password` — Dispatch password reset token.
- `POST /auth/reset-password` — Apply new password using verification token.
- `POST /auth/verify-email` — Confirm email address ownership.

### 2.2 Alumni Verification (`/alumni/verification`)
- `POST /alumni/verification/submit` — Submit institutional credentials and verification documents.
- `GET /alumni/verification/status` — Query current alumnus verification stage.
- `GET /alumni/verification/queue` — [OFFICER] Paginated pending verification requests.
- `POST /alumni/verification/:id/review` — [OFFICER] Approve, reject, or request information with review notes.
- `POST /alumni/verification/batch-import` — [OFFICER] Upload verified institutional alumni CSV.

### 2.3 Alumni Profiles & Capacity (`/alumni/profile`)
- `GET /alumni/profile/me` — Retrieve own full mentor profile.
- `PUT /alumni/profile/me` — Update professional designation, organisation, summary, expertise tags.
- `GET /alumni/capacity` — Query current mentee capacity, remaining slots, and pause status.
- `PUT /alumni/capacity` — Update `maxActiveMentees` ($1 \le N \le 10$) and `isAcceptingRequests`.
- `POST /alumni/capacity/pause` — Toggle pause mentoring status with optional reason.

### 2.4 Availability Management (`/alumni/availability`)
- `GET /alumni/availability/:mentorId` — Retrieve public recurring slots and blackout dates (sanitized).
- `PUT /alumni/availability` — Configure weekly availability windows and minimum notice.
- `POST /alumni/availability/blackout` — Add specific blackout date range.

### 2.5 Student Profiles (`/students/profile`)
- `GET /students/profile/me` — Retrieve own student profile and completion status.
- `PUT /students/profile/me` — Update academic programme, graduation year, target roles, skills.
- `POST /students/goals` — Add structured career goal.
- `PUT /students/goals/:id` — Update or mark career goal completed.

### 2.6 Intelligent Matching (`/matching`)
- `GET /matching/mentors` — Search and filter verified active mentors with pagination.
- `GET /matching/recommendations` — Compute multi-factor weighted recommendations with explainable overlap cards.
- `GET /matching/explain/:mentorId` — Detailed breakdown of skill, role, industry, and availability overlap.

### 2.7 Mentorship Requests (`/requests`)
- `POST /requests` — Submit new mentorship request (throttled by Redis).
- `GET /requests/sent` — [STUDENT] List outgoing requests.
- `GET /requests/incoming` — [MENTOR] List incoming requests pending response.
- `POST /requests/:id/accept` — [MENTOR] Accept request (atomic capacity reservation).
- `POST /requests/:id/decline` — [MENTOR] Decline request with optional feedback.
- `POST /requests/:id/cancel` — [STUDENT] Cancel pending request before mentor response.

### 2.8 Mentorships (`/mentorships`)
- `GET /mentorships` — List active, paused, or completed mentorships for current user.
- `GET /mentorships/:id` — Detailed mentorship workspace (status, sessions, goals, action items).
- `POST /mentorships/:id/close` — Terminate or complete mentorship (releases 1 mentor capacity slot).

### 2.9 Scheduling & Sessions (`/mentorships/:id/sessions`)
- `POST /mentorships/:id/sessions` — Propose session slot.
- `POST /sessions/:id/confirm` — Accept proposed session.
- `POST /sessions/:id/reschedule` — Request alternate time.
- `POST /sessions/:id/cancel` — Cancel session with explanation.
- `POST /sessions/:id/notes` — Record post-session notes (mentor private vs shared).

### 2.10 Goals & Action Items (`/mentorships/:id/goals`)
- `POST /mentorships/:id/goals` — Create shared mentorship goal.
- `PUT /goals/:id` — Update goal progress or status.
- `POST /goals/:id/action-items` — Create action item with assignee and deadline.
- `PATCH /action-items/:id/toggle` — Mark action item completed/incomplete.

### 2.11 Feedback (`/mentorships/:id/feedback`)
- `POST /mentorships/:id/feedback` — Submit post-session or relationship feedback.
- `GET /mentorships/:id/feedback` — View historical feedback (subject to visibility rules).

### 2.12 Secure In-Platform Messaging (`/messaging`)
- `GET /messaging/conversations` — List conversations with latest message preview and unread counts.
- `GET /messaging/:mentorshipId/messages` — Paginated message history (PII-masked).
- `POST /messaging/:mentorshipId/read` — Acknowledge read status.

### 2.13 Administration & Officer Management (`/admin`)
- `GET /admin/users` — Search and manage user accounts and roles.
- `GET /admin/verification-stats` — Overview of pending, approved, and rejected verifications.
- `GET /admin/mentor-capacity-overview` — Utilization rates, saturated mentors, and overload risks.
- `GET /admin/engagement-health` — Breakdown of healthy, at-risk, and dormant mentorships.
- `GET /admin/settings` — Read configurable programme settings (weights, limits).
- `PUT /admin/settings` — Update matching weights and request limits.
- `GET /admin/audit-logs` — Query immutable system audit trail with filters.

### 2.14 Analytics & Placement (`/analytics`)
- `GET /analytics/overview` — High-level KPI dashboard.
- `GET /analytics/funnel` — Request conversion, acceptance, decline, and expiration metrics.
- `GET /analytics/placement-correlation` — [PLACEMENT_OFFICER] Goal achievement vs placement outcomes.
- `GET /analytics/export` — Secure CSV export with strict contact PII redaction.

