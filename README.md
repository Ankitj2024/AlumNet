# AlumNet — Verified Alumni Mentorship Matching & Engagement Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-17%2F17%20Passed-brightgreen.svg)](#testing)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#)

A university-grade software system connecting enrolled students with verified alumni mentors while guaranteeing **zero PII leakage**, **atomic mentor capacity protection**, **explainable multi-factor matching**, and a **minimalist Apple-grade UI** styled with the **Apple San Francisco (`SF-Pro`)** font and 20 motion-driven `@uiarc` components.

---

## 🌟 Key Features

* **Verified Identity & Registrar Sync (M1)**:
  * Automatic ERP registrar cross-referencing.
  * Batch CSV registrar import for Alumni Relations Officers.
  * Authoritative document audit queue with strict rejection/approval workflows.
  * Unverified alumni are strictly prohibited from appearing in mentor searches or recommendations.
* **Mentor Capacity & Invariant Protection (M2)**:
  * Atomic capacity protection ($1 \le N \le 10$ active mentees) backed by MongoDB atomic updates.
  * Guaranteed protection against over-allocation under concurrent simultaneous acceptance attempts.
  * Instant mentor availability toggle (pause/resume mentoring).
* **Intelligent Explainable Matching Engine (M3)**:
  * Weighted multi-factor algorithm:
    $$\text{Score} = 0.35 \times S_{\text{skills}} + 0.25 \times S_{\text{role}} + 0.20 \times S_{\text{industry}} + 0.10 \times S_{\text{interest}} + 0.10 \times S_{\text{avail}}$$
  * Explainable match cards showing exact rationale (matching skills, shared industries, background alignment).
  * Anti-spam rolling 7-day request limits and max pending request thresholds.
* **Privacy-First In-Platform Messaging & PII Shield (M4)**:
  * Real-time automated regex masking of email addresses and phone numbers.
  * Zero direct alumni contact details exposed to student-facing payloads (strict DTO allowlists).
  * Video session scheduling with calendar synchronization and Google Meet support.
* **Goals, Action Items & Mentorship Health Tracking (M5)**:
  * Milestone goal setting and interactive reorderable action item lists.
  * Automated relationship health categorization:
    * **Healthy**: Active within $\le 14$ days.
    * **At-Risk**: No activity between $15 - 28$ days.
    * **Dormant**: Inactive for $> 28$ days.
  * Placement Officer read-only analytics portal.

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

## 🏗️ Architecture

Modular TypeScript Monorepo:

```
AlumNet/
├── apps/
│   ├── api/            # Node.js + Express + Mongoose + Socket.IO REST API (/api/v1/*)
│   ├── web/            # Next.js 14 App Router + Tailwind CSS + @uiarc components
│   └── worker/         # BullMQ background job processing
├── packages/
│   ├── config/         # Shared configuration schemas
│   ├── shared/         # Common utilities & constants
│   ├── types/          # Central TypeScript interfaces & enums
│   └── validation/     # Domain validation schemas (Zod)
├── infrastructure/     # Docker Compose (MongoDB 7.0 replica set & Redis)
├── docs/               # 15 Architecture Decision Records (ADRs) & specs
└── scripts/            # Database seeding and migration utilities
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20+ LTS
- **MongoDB**: v7.0+ (local instance or Docker)
- **Redis**: v7.0+ (for background queues)

### 2. Installation & Seed Data

```powershell
# Install dependencies
npm install

# Seed registrar master records & demo accounts
npm run seed
```

### 3. Launching Development Servers

Run backend and frontend concurrently in PowerShell:

```powershell
npm run seed; Start-Process powershell -ArgumentList '-NoExit', '-Command', 'npm run dev:api'; Start-Process powershell -ArgumentList '-NoExit', '-Command', 'npm run dev:web'; Start-Sleep -Seconds 4; Start-Process "http://localhost:3000"
```

* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **Backend REST API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

---

## 👥 Seed Demo Credentials

All accounts share the password: **`DemoPassword123!`**

| Role | Email | Direct Portal Link |
|---|---|---|
| **Student** | `student.demo@university.edu` | [http://localhost:3000/student](http://localhost:3000/student) |
| **Verified Mentor 1** | `mentor.demo@alumni.edu` | [http://localhost:3000/mentor](http://localhost:3000/mentor) |
| **Verified Mentor 2** | `kevin.gao@alumni.edu` | [http://localhost:3000/mentor](http://localhost:3000/mentor) |
| **Alumni Relations Officer** | `officer.demo@university.edu` | [http://localhost:3000/officer](http://localhost:3000/officer) |
| **Super Admin** | `admin.demo@university.edu` | [http://localhost:3000/auth/login](http://localhost:3000/auth/login) |

---

## 🧪 Testing

The platform includes a comprehensive test suite covering unit logic, integration endpoints, concurrency race conditions, and zero-PII leak scanners.

```powershell
# Run full test suite (17/17 tests passing)
npm test

# Run privacy & zero-PII leak release gate
npm run test:privacy
```

---

## 📄 License

This software is developed for institutional university deployment. Proprietary and confidential.
