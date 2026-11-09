# AlumNet (P11) — Security & Compliance Architecture

## 1. Security Overview
AlumNet is designed for enterprise university environments handling sensitive student and alumni records. All endpoints, authentication layers, and data flows are built to meet OWASP ASVS (Application Security Verification Standard) and GDPR / DPDP regulatory compliance requirements.

---

## 2. Authentication & Session Hardening (Task 1)

### 2.1. Dual-Token Architecture
- **Access Token**: Short-lived (15 minutes), kept in client memory only (never written to `localStorage` or `sessionStorage`).
- **Refresh Token**: Long-lived (7 days), stored in an `httpOnly`, `Secure`, `SameSite=Strict` cookie.
- **Refresh Token Rotation (RTR)**: Each refresh generates a new token pair and marks the previous token replaced.
- **Family Reuse Detection**: If an already replaced token is presented (token theft indicator), the entire family of tokens associated with the subject is immediately revoked, forcing re-authentication.

### 2.2. Login Lockout & Brute-Force Defense
- **Lockout Policy**: After 5 consecutive failed login attempts on an account, the user is locked out for 30 minutes (`HTTP 423 Locked`).
- **Distributed Rate Limiting**:
  - Auth routes (`/api/v1/auth/login`, `/register`): 5 requests per minute.
  - Request creation: 10 requests per minute.
  - Messaging: 30 messages per minute.
  - OTP verification: 3 attempts per 5 minutes.

### 2.3. Production Safety Validator (`packages/config/src/env.ts`)
The server validates all environment variables at startup and refuses to boot if:
- `NODE_ENV === 'production'` and `ENABLE_DEMO_LOGIN === true`.
- `NODE_ENV === 'production'` and default development JWT/encryption secrets are detected.
- Any mandatory secret is shorter than minimum entropy bounds (e.g. 32 chars for secrets, 64 hex chars for AES-256 keys).

---

## 3. Data Protection & Cryptography

### 3.1. AES-256-GCM In-Flight & At-Rest Encryption
Messages and calendar OAuth tokens are encrypted using Authenticated Encryption with Associated Data (AEAD) via `AES-256-GCM`:
- Unique 96-bit random Initialization Vector (IV) generated per message (`crypto.randomBytes(12)`).
- 128-bit authentication tag (`cipher.getAuthTag()`) verifies ciphertext integrity.
- Ciphertext, IV, and authTag are stored in database models; plaintext is never stored unredacted in database fields.

### 3.2. Privacy Shield V2
Prevents student and mentor personal contact exchange:
- **NFKC Normalization**: Strips zero-width unicode characters and normalizes homoglyphs.
- **Regex Filter Engine**: Detects standard emails, obfuscated addresses (`user [at] gmail [dot] com`), phone numbers (+91, international, spaced, hyphenated, spelled-out digits), social handles, and UPI IDs.
- **Progressive Sanctions**: 3 PII violations within 24 hours places the user in 24-hour read-only mode (`HTTP 429`).
- **Mutual Contact Unlock**: Filter is relaxed only after $\ge 3$ verified completed sessions.

### 3.3. Audited Moderation Decryption
Officers cannot view original message text without submitting a formal audit justification:
- Endpoint: `POST /api/v1/messaging/:mentorshipId/messages/:messageId/moderation-decrypt`
- Role Requirement: `ALUMNI_RELATIONS_OFFICER` or `SUPER_ADMIN`.
- Justification: Minimum 5 characters recorded in `AuditLog` alongside timestamp, IP, and officer ID.

---

## 4. Injection & Input Sanitization
- **NoSQL Injection Defense**: `express-mongo-sanitize` middleware removes any request body or query keys containing `$` or `.` characters.
- **Schema Validation**: All inbound payloads are validated using strict Zod schemas with `.strip()` or `.strict()` before reaching controller logic.
- **HTTP Security Headers**: `helmet` is enabled with strict Content-Security-Policy (CSP), HSTS, and frame protection.
- **CORS Allowlist**: Strict origin checking against `CORS_ALLOWED_ORIGINS`.

---

## 5. GDPR & DPDP Compliance (Task 8)

| Regulatory Article | Capability | Implementation |
|---|---|---|
| **Right to Access & Portability** (GDPR Art. 15/20) | User Data Export | `GET /api/v1/users/export` returns a complete JSON archive of profile data, requests, mentorships, decrypted sent messages, goals, action items, feedback, and placement records. |
| **Right to Erasure** (GDPR Art. 17) | Account Deletion | `DELETE /api/v1/users/me` soft-deletes the account, pauses mentor capacity, revokes all tokens, and schedules permanent purging for 30 days. |
| **Grace Period Restoral** | Cancellation of Deletion | `POST /api/v1/users/cancel-deletion` restores account access within 30 days. |
| **Permanent Anonymization** | 30-Day Purge Job | `purgeDeletedAccountsJob` permanently scrambles credentials, removes personal identifiable details, purges tokens, and logs anonymization in audit history. |

---

## 6. Audit Trail & Traceability
All privileged actions (registrar syncing, verification decisions, policy modifications, moderation decryptions) write immutable records to the `AuditLog` collection, indexed by timestamp, user, and action type.
