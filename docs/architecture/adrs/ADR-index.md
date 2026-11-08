# Architecture Decision Records (ADRs)
## P11 — Verified Alumni Mentorship Platform

---

### ADR-001: Selection of Modular Monorepo Architecture
- **Status**: Accepted
- **Context**: The platform contains tightly coupled domain contracts between the Next.js frontend, Express REST API, and BullMQ background workers. Maintaining separate repositories would cause schema drift, duplicate TypeScript definitions, and coordination overhead.
- **Decision**: Adopt a modular monorepo structure with npm workspaces. Shared packages (`@p11/types`, `@p11/validation`, `@p11/shared`, `@p11/config`) supply unified contracts across `apps/web`, `apps/api`, and `apps/worker`.
- **Consequences**: Single source of truth for validation schemas (Zod) and TypeScript types; simplified CI/CD; clear boundaries without premature microservice overhead.

---

### ADR-002: Atomic Conditional Updates & Transactions for Mentor Capacity Protection
- **Status**: Accepted
- **Context**: A mentor's active capacity is a non-negotiable invariant. If two requests are accepted concurrently when 1 slot remains, naive read-then-write creates an over-allocation vulnerability (e.g. 4 mentees on capacity 3).
- **Decision**: Enforce capacity bounds at the database level using conditional atomic operations (`$inc: { currentActiveMentees: 1 }` where `currentActiveMentees < maxActiveMentees`). When running on a MongoDB replica set, coordinate capacity reservation, mentorship creation, and request state transition within an ACID transaction with exponential backoff on write conflicts.
- **Consequences**: Guarantees zero capacity breaches. Requires MongoDB replica set support in production and robust transaction retry logic.

---

### ADR-003: Explicit Allowlist DTO Serializers for Strict Privacy Protection
- **Status**: Accepted
- **Context**: Alumni email addresses, phone numbers, and identity verification documents must never be leaked to students under any circumstance (API response, error log, nested population).
- **Decision**: Prohibit direct Mongoose document serialization in controllers. Enforce explicit mapping to allowlisted Data Transfer Objects (DTOs) for each user role (`StudentViewMentorDTO`, `AlumniOfficerMentorDTO`, etc.). Implement an automated test suite that recursively asserts absence of PII regexes in all student-facing endpoints.
- **Consequences**: Requires explicit serializer functions for every query output; eliminates accidental leakage caused by Mongoose `.populate()` or schema changes.

---

### ADR-004: Redis & BullMQ for Asynchronous Workflows and Distributed Throttling
- **Status**: Accepted
- **Context**: Operations such as request expiration (7 days), session email notifications, calendar synchronization, and weekly engagement snapshots must run reliably without blocking HTTP requests or duplicating side-effects upon server restarts.
- **Decision**: Deploy Redis 7 with BullMQ. Implement dedicated queue processors with exponential backoff, dead-letter queues (DLQ), and idempotent job handlers with Redis distributed locks.
- **Consequences**: Requires Redis in the infrastructure stack. Guarantees predictable scheduling, fault tolerance, and rate limiting.

---

### ADR-005: Authentication & Session Security Architecture
- **Status**: Accepted
- **Context**: University students and verified alumni require institutional-grade authentication, resisting credential stuffing, XSS, and CSRF attacks.
- **Decision**: 
  1. Passwords hashed using Argon2id (memory cost 65536 KB, 3 iterations, 4 parallelism).
  2. Sessions managed via signed, HTTP-only, SameSite=Strict, Secure cookies containing short-lived JWTs, paired with Redis-backed session revocation lists.
  3. Strict double-submit or header-based CSRF protection for state-changing endpoints.
  4. Role-based access control (RBAC) enforced on the server for 5 distinct roles (`STUDENT`, `ALUMNI_MENTOR`, `ALUMNI_RELATIONS_OFFICER`, `PLACEMENT_OFFICER`, `SUPER_ADMIN`).
- **Consequences**: Secure against token theft in browser local storage; enables instant session revocation upon suspicious activity or role change.

