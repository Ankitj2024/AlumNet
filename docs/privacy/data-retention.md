# Data Retention and Anonymization Policies
## P11 — Verified Alumni Mentorship Platform
**Version:** 1.0.0  

---

## 1. Statutory & Institutional Retention Schedules

| Data Category | Target Entity | Active Retention Period | Post-Closure Retention | Terminal Action |
| :--- | :--- | :--- | :--- | :--- |
| **Verification Identity Documents** | `VerificationRequest.documentUrls` | Duration of review + 90 days | N/A | Hard deletion from private object storage once verified. Retain only audit metadata. |
| **Institutional Alumni Records** | `InstitutionalAlumniRecord` | Indefinite (Registrar master) | Indefinite | Retained for alumni verification reference. |
| **User Account & Auth Credentials** | `User`, `CalendarIntegration` | Active tenure | 30 days post deactivation request | Anonymize PII (`deleted_user_xyz`), revoke OAuth tokens, purge password hashes. |
| **Mentorship Requests** | `MentorshipRequest` | Pending (7-day TTL) | 1 academic year (Reporting) | Anonymize message bodies; retain category and outcome counters. |
| **Mentorship Workspace & Goals** | `Mentorship`, `Goal`, `ActionItem` | Active relationship | 3 years post graduation | Aggregate into career outcome metrics; anonymize individual task details. |
| **In-Platform Messages** | `Message` | Active relationship | 180 days post mentorship closure | Encrypted archival or purge unless flagged for safety compliance. |
| **System Audit Logs** | `AuditLog` | 7 years | N/A | Immutable append-only cold storage for security audits. |

---

## 2. Right to Erasure & Account Anonymization Procedure

When a user exercises their right to account deletion:
1. `User.status` is set to `DEACTIVATED`.
2. Personal contact fields (`email`, `phone`, `mfaSecret`) are scrubbed and replaced with deterministic pseudonym hashes.
3. Active mentorships are gracefully closed with reason `PARTICIPANT_ACCOUNT_CLOSED`.
4. Mentor capacity counters are automatically decremented to release pending slots.
5. Calendar integration refresh tokens are immediately revoked with Google/Microsoft APIs and wiped from the database.
6. Verification documents in S3 are deleted.

