# Quality Assurance & Test Strategy
## P11 — Verified Alumni Mentorship Platform
**Version:** 1.0.0  

---

## 1. Test Pyramids & Categorization

1. **Unit Tests (Vitest / Jest)**:
   - Business calculation logic (e.g., matching engine scoring algorithms).
   - Time zone conversion and availability slot overlap computations.
   - PII screening regexes and sanitization routines.
   - Zod schema validation rules and transformations.

2. **Integration Tests (Supertest + MongoDB / In-Memory RS)**:
   - Auth endpoints (registration, login, cookie setting, CSRF).
   - RBAC enforcement across all roles.
   - Alumni verification workflow transitions (`PENDING` $\to$ `UNDER_REVIEW` $\to$ `VERIFIED`).
   - Request creation, throttle limits, and idempotency deduplication.
   - Session proposal, acceptance, and cancellation flows.

3. **Concurrency & Invariant Tests**:
   - Concurrency race tests: 10 parallel acceptance requests against a mentor with capacity 1. Must ensure exactly 1 succeeds and 9 fail with `CAPACITY_EXCEEDED` without counter negative or over-allocation.

4. **Privacy Regression Tests**:
   - Automated crawler hitting every student-facing endpoint.
   - Asserts zero occurrences of email addresses, phone numbers, or private document paths in responses.

5. **End-to-End Tests (Playwright)**:
   - Student onboarding $\to$ profile creation $\to$ mentor discovery $\to$ request submission.
   - Alumni onboarding $\to$ verification submission $\to$ officer approval $\to$ request acceptance.

---

## 2. Test Execution Commands
- Unit & Integration Tests: `npm run test`
- Privacy Regression Suite: `npm run test:privacy`
- Concurrency Invariant Suite: `npm run test:concurrency`
- E2E Suite: `npm run test:e2e`

