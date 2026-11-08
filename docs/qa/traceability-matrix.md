# Requirements Traceability Matrix (RTM)
## P11 — Verified Alumni Mentorship Platform

| Req ID | Requirement Description | Primary Module | Model / Service | Automated Test Suite | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M0-1** | Modular Monorepo Architecture | Core | `apps/api`, `apps/web`, `apps/worker` | Build verification | In Progress |
| **M1-1** | User Auth & Argon2id Password Hashing | Auth | `UserModel`, `AuthService` | `tests/integration/auth.test.ts` | In Progress |
| **M1-2** | 5-Role RBAC Authorization | Auth | `rbac.middleware.ts` | `tests/integration/rbac.test.ts` | In Progress |
| **M1-3** | 3-Source Alumni Verification | M1 Verification | `VerificationRequestModel`, `VerificationService` | `tests/integration/verification.test.ts` | In Progress |
| **M1-4** | Zero-Contact Privacy DTO Serializers | Privacy | `alumni.serializer.ts` | `tests/privacy/dto-leak.test.ts` | In Progress |
| **M1-5** | Student & Mentor Profiles | M1/M2 Profiles | `StudentProfileModel`, `AlumnusModel` | `tests/integration/profiles.test.ts` | In Progress |
| **M2-1** | Atomic Mentor Capacity Invariant | M2 Capacity | `MentorCapacityModel`, `CapacityService` | `tests/concurrency/capacity-race.test.ts` | M2 Planned |
| **M2-2** | Multi-Factor Weighted Matching | M5 Matching | `MatchingEngineService` | `tests/unit/matching-engine.test.ts` | M2 Planned |
| **M2-3** | Request Throttling & Auto-Expiry | M6 Requests | `MentorshipRequestModel`, `ThrottleMiddleware` | `tests/integration/requests.test.ts` | M2 Planned |
| **M3-1** | Scheduling & Conflict Validation | M7 Sessions | `SessionModel`, `SchedulingService` | `tests/integration/sessions.test.ts` | M3 Planned |
| **M3-2** | In-Platform Messaging & PII Shield | M10 Messaging | `MessageModel`, `pii-shield.ts` | `tests/integration/messaging.test.ts` | M3 Planned |
| **M4-1** | Goals & Action Item Tracking | M8 Goals | `GoalModel`, `ActionItemModel` | `tests/integration/goals.test.ts` | M4 Planned |
| **M4-2** | Weekly Engagement Health Evaluator | M9 Engagement | `EngagementSnapshotModel`, BullMQ Worker | `tests/integration/engagement.test.ts` | M4 Planned |
| **M5-1** | Placement & Operational Analytics | Analytics | `AnalyticsService` | `tests/integration/analytics.test.ts` | M5 Planned |
| **M5-2** | Production Docker & Health Checks | Ops | `docker-compose.yml`, `/health` | Integration smoke tests | M5 Planned |

