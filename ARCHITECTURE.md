# AlumNet (P11) — System Architecture Specification

## 1. Executive Summary & Architecture Principles
AlumNet is an institutional mentorship platform engineered to connect students with verified alumni professionals. The system is designed around five core product principles:
1. **Verified Professional Identity**: Guaranteed verification against university registrar ERP records.
2. **Relevant & Explainable Matching**: Multi-factor matching engine with transparent scoring rationale.
3. **Capacity Protection**: Atomic concurrency guards guaranteeing mentor workload bounds ($1 \le N \le 10$).
4. **Privacy-First Communication**: In-platform messaging with real-time PII sanitization and AES-256-GCM encryption.
5. **Measurable Outcomes**: Career progression tracking, goal tracking, and placement attribution.

---

## 2. Monorepo Structure (Track J Specification)
The platform is organized as an enterprise TypeScript monorepo using npm workspaces:

```
AlumNet/
├── apps/
│   ├── api/            # Express.js REST API, Socket.IO, Mongoose models, and Background Jobs
│   ├── web/            # Next.js 14 App Router, Tailwind CSS, and 20 @uiarc motion components
│   └── worker/         # BullMQ queue workers for asynchronous task scheduling
├── packages/
│   ├── config/         # Typed Zod environment validation (env.ts) and shared configs
│   ├── shared/         # Cross-app utilities, error hierarchy, and PrivacyFilter engine
│   ├── types/          # Central TypeScript interfaces, DTOs, and role definitions
│   └── validation/     # Shared Zod schemas for request validation
├── infrastructure/     # Docker Compose (MongoDB 7.0 replica set & Redis 7.0)
├── e2e/                # Playwright end-to-end integration tests
└── scripts/            # University database seeding and migration utilities
```

---

## 3. Core Engine Specifications

### 3.1. Intelligent Matching Engine & Config-Driven Policy
Mentor recommendations are ranked using a multi-factor score:

$$\text{Score} = w_1 \cdot S_{\text{skills}} + w_2 \cdot S_{\text{role}} + w_3 \cdot S_{\text{industry}} + w_4 \cdot S_{\text{dept}} + w_5 \cdot S_{\text{comm}}$$

Where $\sum_{i=1}^5 w_i = 1.0$, dynamically managed through `ProgrammeSettings`:
- $S_{\text{skills}}$: Jaccard similarity across student career interests and mentor expertise tags.
- $S_{\text{role}}$: Target role alignment.
- $S_{\text{industry}}$: Student preferred industry overlap with mentor employer domain.
- $S_{\text{dept}}$: Academic department affinity.
- $S_{\text{comm}}$: Meeting cadence compatibility (weekly/bi-weekly).

Each recommendation returns an **Explainable Match Card** detailing exact overlap factors.

### 3.2. Atomic Concurrency & Capacity Protection
To prevent over-allocation during simultaneous mentor acceptance requests:
- **Acceptance Transaction**: Handled in a MongoDB multi-document ACID transaction:
  ```ts
  const updatedCapacity = await MentorCapacityModel.findOneAndUpdate(
    {
      mentorId: alumnus._id,
      isPaused: false,
      $expr: { $lt: ['$currentActiveMentees', '$maxActiveMentees'] }
    },
    { $inc: { currentActiveMentees: 1 } },
    { session, new: true }
  );
  if (!updatedCapacity) {
    throw new AppError('Mentor capacity exceeded', 409, ErrorCodes.CAPACITY_EXCEEDED);
  }
  ```
- **Auto-Cancellation on Full**: When capacity reaches $N$, pending requests are automatically cancelled and alternatives suggested.
- **Request Quota Protection**: Parallel request creation is guarded by conditional atomic `$inc` on `StudentProfileModel.pendingRequestsCount` matching `{ pendingRequestsCount: { $lt: maxPendingRequestsPerStudent } }`.

### 3.3. Privacy Shield V2 & Zero-PII Leak Pipeline
Direct personal contact disclosure is prevented on all student-mentor channels:
1. **Pre-processing Normalization**: Unicode NFKC normalization and zero-width character stripping.
2. **Regex Filter Engine**: Detects standard emails, obfuscated addresses (`user [at] domain [dot] com`), phone numbers (+91, international, spaced, hyphenated, spelled-out numbers like "nine eight seven"), social handles, and UPI IDs.
3. **AES-256-GCM Storage**: Original text is encrypted with a 256-bit key and stored alongside `iv` and `authTag`. Only sanitized text is delivered over the wire.
4. **Mutual Contact Unlock**: Filter is automatically relaxed only after $\ge 3$ completed verified sessions.
5. **Audited Moderation Decryption**: Officer endpoint requiring minimum 5-character justification and full audit trail logging.
6. **DTO Leak Prevention**: API responses enforce strict projection, stripping ciphertext, IVs, authTags, and private mentor notes.

### 3.4. Background Jobs Engine (apps/worker & BullMQ)
Jobs run with an injectable `Clock` interface for deterministic testing:
1. `expireRequests`: Transitions PENDING requests past 7 days to EXPIRED.
2. `autoCancelOnFull`: Auto-cancels remaining requests when a mentor accepts to maximum capacity.
3. `recomputeHealth`: Categorizes relationships into HEALTHY ($\le 14$d), AT_RISK ($15-28$d, with 7-day rate-limited nudges), DORMANT ($>28$d with 7-day grace period before automatic closure).
4. `reconcileCapacity`: Nightly audit repairing drift between active `Mentorship` documents and `MentorCapacity.currentActiveMentees`.
5. `resumePausedMentors`: Resumes temporarily paused mentors when `pausedUntil` has elapsed.
6. `sessionReminders`: Dispatches alerts 24h and 1h prior to scheduled sessions.
7. `purgeDeletedAccounts`: Enforces 30-day GDPR/DPDP permanent anonymization.

### 3.5. Notification Engine
- **In-App**: Stored in `NotificationModel` with real-time Socket.IO emission to room `user:${userId}`.
- **Email**: Nodemailer adapter with Mailpit development support and idempotency key deduplication.
- **Preferences**: Granular opt-in/opt-out per channel (transactional emails cannot be disabled).

### 3.6. Sessions & Google Meet
- **MeetProvider Abstraction**: Decoupled interface supporting `GoogleCalendarMeetProvider` (OAuth `conferenceData.createRequest`) and `MockMeetProvider`.
- **RFC 5545 iCalendar**: Generates `.ics` calendar invitation attachments for download and email distribution.
- **Availability Windows**: Timezone-aware slot matching preventing double-booking across both participants.

---

## 4. Security & Compliance Architecture
See [SECURITY.md](SECURITY.md) for full OWASP Top 10 mitigations, encryption standards, and GDPR / DPDP compliance procedures.
