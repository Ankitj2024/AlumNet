# AlumNet — Verified Alumni Mentorship Matching & Engagement Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-169%2F169%20Passed-brightgreen.svg)](#testing)
[![Coverage](https://img.shields.io/badge/Coverage-80.98%25-brightgreen.svg)](#testing)
[![Security](https://img.shields.io/badge/Security-OWASP%20ASVS%20%2B%20GDPR-blue.svg)](SECURITY.md)

A university-grade software system connecting enrolled students with verified alumni mentors while guaranteeing **zero PII leakage**, **atomic mentor capacity protection**, **explainable multi-factor matching**, **RFC 5545 calendar integration**, **AES-256-GCM encryption**, and a **minimalist Apple-grade UI** styled with the **Apple San Francisco (`SF-Pro`)** font and 20 motion-driven `@uiarc` components.

---

## 📚 Complete Project Documentation

| Document | Purpose |
|---|---|
| [**DEMO_WALKTHROUGH.md**](DEMO_WALKTHROUGH.md) | **5-minute step-by-step evaluator walkthrough script** |
| [**ARCHITECTURE.md**](ARCHITECTURE.md) | Full system design, mathematical formulas, and concurrency invariants |
| [**SECURITY.md**](SECURITY.md) | OWASP Top 10 defenses, cryptographic specs, and GDPR / DPDP compliance |
| [**DEPLOYMENT.md**](DEPLOYMENT.md) | Production Docker, Redis, MongoDB Replica Set, and ingress topology |
| [**.env.example**](.env.example) | Complete typed environment configuration reference |

---

## 🌟 Key Features & Phase 2 Capabilities

* **Production Safety & Hardened Auth (Task 1)**:
  * Strict environment gating (`ENABLE_DEMO_LOGIN` prohibited when `NODE_ENV=production`).
  * Refresh token rotation with reuse family revocation.
  * 15-minute access tokens in memory; httpOnly, Secure, SameSite=Strict cookies.
  * 5-failure login lockout with 30-minute block (HTTP 423).
  * Rate-limiting on auth, OTP, request creation, and messaging endpoints.
  * NoSQL injection sanitization via `express-mongo-sanitize` and HTTP security headers via `helmet`.
* **Config-Driven Programme Policy (Task 2)**:
  * Super Admin managed `ProgrammeSettings` with mathematical sum validation ($\sum w_i = 1.0$).
  * Dynamic pending request limits (default 3), rolling 7-day quotas (default 5), and health thresholds (14/28 days).
  * In-memory cached accessor with instant cache invalidation on updates.
  * Dedicated Officer Policy dashboard with live validation and immutable change history ledger.
* **Background Jobs Engine (Task 3)**:
  * BullMQ + Redis job processing with an injectable Clock interface.
  * 6 idempotent jobs: `expireRequests`, `autoCancelOnFull`, `recomputeHealth` (tested at exact day boundaries 14, 15, 28, 29, 36), `reconcileCapacity`, `resumePausedMentors`, and `sessionReminders`.
* **Notification Engine (Task 4)**:
  * Multi-channel delivery: in-app notifications and real-time Socket.IO events (`user:${userId}`).
  * Transactional email delivery with Nodemailer and Mailpit development integration.
  * Granular user preferences and idempotency key deduplication.
  * Animated Notification Bell component with unread badges across all role layouts.
* **Sessions & Google Meet Integration (Task 5)**:
  * Decoupled `MeetProvider` supporting `GoogleCalendarMeetProvider` and `MockMeetProvider`.
  * Mentor availability windows and cross-participant double-booking prevention.
  * Reschedule, cancel with reason, NO_SHOW, mentor private notes, shared notes, and star ratings (1–5).
  * RFC 5545 compliant `.ics` calendar invitation download.
* **Privacy Shield V2 (Task 6)**:
  * Unicode NFKC normalization, zero-width stripping, and obfuscated contact detection (`user [at] domain [dot] com`, spelled-out numbers, +91 formats, UPI IDs).
  * AES-256-GCM authenticated encryption for original text storage.
  * Progressive sanctions (3 violations in 24h triggers 24h read-only mode).
  * Mutual contact unlock after $\ge 3$ completed sessions.
  * Audited moderation decryption requiring officer justification of $\ge 5$ characters.
  * Strict DTO leak protection: zero ciphertext, IVs, or private mentor notes in student responses.
* **Officer Analytics & Placement Tracking (Task 7)**:
  * Aggregated institutional metrics strictly stripped of student PII.
  * RFC 4180 CSV report exports for overview and placement outcomes.
  * Student self-reported placement workflow with automated mentorship attribution.
  * Registrar batch placement import and interactive moderation queue.
* **GDPR & DPDP Data Rights (Task 8)**:
  * Article 15/20 data portability export bundle (`GET /api/v1/users/export`).
  * Article 17 right to erasure soft-deletion with 30-day grace period restoral.
  * Background permanent purge job anonymizing credentials past 30 days.
* **Quality Gates & Concurrency Protection (Task 9)**:
  * Concurrency test: 20 simultaneous acceptance attempts against capacity 2 (verified: exactly 2 succeed, 18 rejected with `CAPACITY_EXCEEDED` and auto-cancelled).
  * Parallel quota race tests guarding rolling window and max 3 pending requests.
  * Playwright E2E test suite covering full onboarding -> verification -> match -> request -> session lifecycle.
  * Complete GitHub Actions CI pipeline (`.github/workflows/ci.yml`).

---

## 🎨 Apple Minimalist Design & Typography

* **Typography**: Exclusively styled with Apple's **San Francisco (`SF-Pro`)** font family across 47 weights and variations.
* **UI Components**: Built using the complete suite of **20 `@uiarc` motion components**:
  * `@uiarc/button` • `@uiarc/swipe-actions` • `@uiarc/password-strength` • `@uiarc/expanding-search`
  * `@uiarc/switch` • `@uiarc/tabs` • `@uiarc/breadcrumb` • `@uiarc/pagination`
  * `@uiarc/scroll-area` • `@uiarc/countdown` • `@uiarc/card` • `@uiarc/metric-card`
  * `@uiarc/donut-chart` • `@uiarc/waffle-chart` • `@uiarc/sparkline` • `@uiarc/gauge`
  * `@uiarc/activity-heatmap` • `@uiarc/animated-counter` • `@uiarc/ridgeline` • `@uiarc/reorderable-list`

---

## 🏗️ Architecture Layout

```
AlumNet/
├── apps/
│   ├── api/            # Node.js + Express + Mongoose + Socket.IO REST API (/api/v1/*)
│   ├── web/            # Next.js 14 App Router + Tailwind CSS + @uiarc components
│   └── worker/         # BullMQ background job processing
├── packages/
│   ├── config/         # Typed Zod environment validation (env.ts)
│   ├── shared/         # Common utilities, error hierarchy & PrivacyFilter v2
│   ├── types/          # Central TypeScript interfaces & enums
│   └── validation/     # Domain validation schemas (Zod)
├── infrastructure/     # Docker Compose (MongoDB 7.0 replica set, Redis 7.0 & Mailpit)
├── e2e/                # Playwright end-to-end integration tests
└── scripts/            # University database seeding (30 mentors, 60 students)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20+ LTS
- **MongoDB**: v7.0+ (with replica set enabled)
- **Redis**: v7.0+

### 2. Infrastructure Setup (Docker)
```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### 3. Installation & Seeding
```bash
# Install dependencies across all monorepo packages
npm install

# Seed 30 verified alumni across top companies and 60 students
npm run seed
```

### 4. Running the Development Servers
```bash
# In Terminal 1: Backend API
npm run dev:api

# In Terminal 2: Frontend Web App
npm run dev:web

# In Terminal 3: Background Worker Daemon
npm run dev:worker
```

* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **Backend REST API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
* **Mailpit Web UI**: [http://localhost:8025](http://localhost:8025)

---

## 👥 Seed Demo Credentials

All accounts share the password: **`DemoPassword123!`**

| Role | Email | Direct Portal Link |
|---|---|---|
| **Student** | `student.demo@university.edu` | [http://localhost:3000/student](http://localhost:3000/student) |
| **Verified Mentor (AWS)** | `sarah.connor@alumni.edu` | [http://localhost:3000/mentor](http://localhost:3000/mentor) |
| **Verified Mentor (Google)** | `kevin.gao@alumni.edu` | [http://localhost:3000/mentor](http://localhost:3000/mentor) |
| **Alumni Relations Officer** | `officer@university.edu` | [http://localhost:3000/officer](http://localhost:3000/officer) |
| **Super Admin** | `admin@university.edu` | [http://localhost:3000/officer/policy](http://localhost:3000/officer/policy) |

---

## 🧪 Testing & Quality Gates

The platform features an automated test suite with **169 passing tests across 18 test files**:

```powershell
# Run full unit and integration test suite (169/169 passed)
npm test

# Run tests with code coverage analysis (achieves 80.98% coverage)
npm run test:coverage

# Run zero-PII leak and DTO privacy scanner
npm run test:privacy

# Run Playwright E2E integration tests
npx playwright test
```

---

## 📄 License

Developed for institutional university deployment. All rights reserved.
