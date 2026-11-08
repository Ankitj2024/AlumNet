# Threat Model & Security Engineering Specification
## P11 — Verified Alumni Mentorship Platform
**Methodology:** STRIDE Threat Modeling & OWASP ASVS v4.0  

---

## 1. Threat Identification & Mitigation Matrix

| Threat Category | Asset / Target | Threat Scenario | Impact | Mitigation Strategy & Controls |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Alumni Identity | Bad actor registers with fake alumnus name to mentor vulnerable students. | High | Multi-source verification (ERP lookup, CSV registrar batch, manual document review). Unverified accounts remain undiscoverable. |
| **Spoofing** | Authentication Session | Attacker steals JWT cookie via XSS. | Critical | Store JWT in `HttpOnly`, `Secure`, `SameSite=Strict` cookies. CSP headers prohibit inline script execution. |
| **Tampering** | Mentor Capacity Invariant | Attacker submits concurrent accept requests to inflate active mentees beyond maximum. | High | Atomic conditional update (`$inc` where `currentActiveMentees < maxActiveMentees`) within MongoDB ACID transaction. |
| **Tampering** | In-Platform Messages | Student sends external phone/email masked with spaces/dots to bypass platform rules. | Medium | Multi-pass regex and heuristic scanner with normalization; flagging and warning UX. |
| **Repudiation** | Verification & Role Approval | Officer denies approving an unverified user who later violates policy. | High | Immutable `AuditLog` records actor ID, role, IP address, timestamp, and review notes for every status change. |
| **Information Disclosure** | Alumni Contact Privacy | Student inspects browser network tab / API payload to find mentor's direct email or phone. | Critical | Strict allowlisted DTO serializers; Mongoose documents are never directly serialized; automated privacy regression tests. |
| **Information Disclosure** | Private Calendar Events | Attacker exploits calendar OAuth sync to read mentor's private meeting subjects. | High | Request minimal OAuth scopes (`calendar.events.freebusy` and insert permissions only); never ingest or store foreign event titles. |
| **Denial of Service** | Mentorship Request Flooding | Script spams a popular mentor with hundreds of requests. | High | Redis-backed distributed rate limiter: max 3 active pending requests, max 5 requests per rolling 7-day window. |
| **Elevation of Privilege** | Student to Admin | Student modifies JSON payload on user update endpoint to inject `role: "SUPER_ADMIN"`. | Critical | Server-side Zod validation schemas strictly whitelist allowed fields per role; role mutation restricted to Super Admin. |
| **IDOR** | Mentorship Workspaces | Student accesses another student's session notes by tampering with `mentorshipId` URL param. | High | Resource ownership authorization middleware verifies that `req.user.id` matches either `mentor.userId` or `student.userId`. |

---

## 2. Cryptographic Architecture
1. **Password Hashing**: Argon2id with recommended OWASP memory hardness ($m=65536, t=3, p=4$). Fallback to bcrypt ($12$ rounds) where native bindings require.
2. **Calendar OAuth Tokens**: AES-256-GCM authenticated encryption at rest using a 256-bit key from environment configuration (`CALENDAR_ENCRYPTION_KEY`).
3. **Session Cookies**: Signed with a cryptographically random secret (`COOKIE_SECRET`), rotated periodically.

