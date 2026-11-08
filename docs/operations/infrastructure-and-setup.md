# Infrastructure and Setup Requirements
## P11 — Verified Alumni Mentorship Platform
**Version:** 1.0.0  

---

## 1. Prerequisites and System Requirements

### 1.1 Local Development Environment
- **Node.js**: v20.x or v22.x LTS
- **Package Manager**: npm 10.x or pnpm 9.x
- **Docker & Docker Compose**: v24+ for MongoDB replica set and Redis 7
- **Git**: v2.40+

### 1.2 Development Infrastructure Configuration
To support multi-document ACID transactions locally, MongoDB must run as a single-node replica set (`rs0`).

#### Docker Compose Stack (`docker-compose.yml`)
- `mongodb`: MongoDB 7.0 container configured as replica set `rs0` on port 27017.
- `redis`: Redis 7 Alpine on port 6379 with persistent AOF enabled.
- `api`: Node.js development container with hot-reloading (`tsx` / `nodemon`).
- `worker`: BullMQ background worker container.
- `web`: Next.js 15 dev server on port 3000.

---

## 2. Environment Variables Specification

Create `.env` at monorepo root:

```env
# Application Environment
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
WEB_URL=http://localhost:3000

# Security & Secrets
JWT_SECRET=production_grade_random_jwt_secret_key_minimum_64_characters_long_entropy
COOKIE_SECRET=production_grade_cookie_signing_secret_string_32_chars
CALENDAR_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef # 32 bytes hex

# Database & Cache
MONGODB_URI=mongodb://localhost:27017/alumni_mentorship?replicaSet=rs0
REDIS_URL=redis://localhost:6379

# Storage
STORAGE_DRIVER=local # local | s3
STORAGE_LOCAL_PATH=./uploads
# AWS_S3_BUCKET=p11-verification-docs
# AWS_REGION=us-east-1

# Matching Defaults
DEFAULT_EXPERTISE_WEIGHT=40
DEFAULT_ROLE_WEIGHT=20
DEFAULT_INDUSTRY_WEIGHT=15
DEFAULT_INTEREST_WEIGHT=10
DEFAULT_AVAILABILITY_WEIGHT=15
```

