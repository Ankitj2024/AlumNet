# AlumNet (P11) — Production Deployment & Operations Guide

## 1. Deployment Topology
AlumNet follows a modern containerized micro-service architecture:

```
[ Internet / Campus WAN ]
           │
           ▼ (HTTPS / WSS - Port 443)
    [ Nginx Ingress / Cloudflare ]
           │
     ┌─────┴──────────────────┐
     ▼                        ▼
[ Next.js Web App ]     [ Express REST API & Socket.IO ]
  (Port 3000)             (Port 5000)
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
       [ MongoDB 7.0 ]  [ Redis 7.0 ]  [ BullMQ Worker Daemon ]
        (Replica Set)    (Caching/RL)
```

---

## 2. Infrastructure Prerequisites
- **Node.js**: v20.x LTS or higher
- **Docker Engine**: v24.x+ & Docker Compose v2.x+
- **MongoDB**: v7.0+ configured as a **Replica Set** (`rs0`) for ACID transactions
- **Redis**: v7.0+ for distributed rate limiting, cache layer, and BullMQ queues
- **SMTP Relay or Mailpit**: For transactional notifications

---

## 3. Local Development Quickstart

### Step 1: Start Infrastructure Containers
Start MongoDB replica set, Redis, and Mailpit:
```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```
- **MongoDB**: `mongodb://localhost:27017/alumni_mentorship?replicaSet=rs0`
- **Redis**: `redis://localhost:6379`
- **Mailpit Web UI**: `http://localhost:8025` (view emails in browser)

### Step 2: Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure `NODE_ENV=development` and `ENABLE_DEMO_LOGIN=true` for local development.

### Step 3: Seed Institutional Database
Populate 30 verified alumni across top tier companies and 60 students:
```bash
npm run seed
```

### Step 4: Run Application Servers
```bash
# Run API server (port 5000)
npm run dev:api

# In a separate terminal, run Web server (port 3000)
npm run dev:web

# In a separate terminal, run Worker daemon
npm run dev:worker
```

---

## 4. Production Deployment Checklist

### 4.1. Security Verification
1. `NODE_ENV=production` must be set in production environments.
2. `ENABLE_DEMO_LOGIN=false` (The API will reject startup with an error if both are true).
3. Generate cryptographically strong random secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Set unique values for:
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `COOKIE_SECRET`
   - `CALENDAR_ENCRYPTION_KEY` (64 hex characters)
   - `MESSAGE_ENCRYPTION_KEY` (64 hex characters)

### 4.2. MongoDB Replica Set Provisioning
Transactions require a MongoDB replica set:
```bash
mongosh "mongodb://localhost:27017" --eval 'rs.initiate()'
```
Verify status:
```bash
mongosh --eval 'rs.status().ok'
```

### 4.3. Building for Production
```bash
# Compile packages, API, Web, and Worker
npm run build

# Start production processes
node apps/api/dist/server.js
node apps/worker/dist/index.js
npm run start --workspace=apps/web
```

---

## 5. Health Checks & Monitoring
- **API Health Endpoint**: `GET /api/v1/health`
  - Returns `200 OK` with database connection state, memory usage, and uptime.
- **Worker Queues**: Monitored via BullMQ job counts and Redis health.
- **Log Aggregation**: Structured JSON logs emitted at standard log levels (`info`, `warn`, `error`).
