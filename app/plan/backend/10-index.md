# Backend Services Index

**Status**: Backend API modules for deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |

---

## Module Index

| Module | File | Description |
|--------|------|-------------|
| Overview | README.md | Module structure and dependencies |
| Transaction Builder | 01-transaction-builder.md | Builds and signs co-signed transactions |
| Lesson Validation | 02-lesson-validation.md | Validates content completion (anti-cheat) |
| Course Management | 03-course-management.md | Admin API for course CRUD |
| XP Token | 04-xp-token.md | Token-2022 XP management |
| Credential | 05-credential.md | Metaplex Core credential NFTs |
| Achievement | 06-achievement.md | Achievement awards |
| Event Listener | 07-event-listener.md | On-chain event monitoring |
| Leaderboard | 08-leaderboard.md | XP rankings via Helius DAS |
| Webhook & Queue | 09-webhook-queue.md | Async processing and webhooks |

## API Endpoints Summary

### Public API
```
GET    /api/courses
GET    /api/courses/:id
GET    /api/courses/:id/details
GET    /api/enrollment/:courseId/:user
GET    /api/xp/:wallet
GET    /api/credentials/:wallet
GET    /api/achievements/:wallet
GET    /api/leaderboard
GET    /api/leaderboard/user/:wallet
GET    /api/stats/global
```

### Learner API (Wallet Auth)
```
POST   /api/learner/enroll
POST   /api/learner/complete-lesson
POST   /api/learner/finalize
POST   /api/learner/close-enrollment
```

### Admin API (Authority Auth)
```
POST   /api/admin/courses/create
PUT    /api/admin/courses/:id
POST   /api/admin/config/rotate-signer
POST   /api/admin/minter/register
POST   /api/admin/minter/revoke
POST   /api/admin/achievement/create
POST   /api/admin/achievement/:id/deactivate
GET    /api/admin/stats
GET    /api/admin/courses
GET    /api/admin/minter
GET    /api/admin/achievements
```

### Internal API
```
POST   /api/internal/issue-credential
POST   /api/internal/upgrade-credential
POST   /api/internal/award-achievement
POST   /api/internal/reward-xp
POST   /api/webhooks
```

## Database Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses (cache for fast queries)
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  course_id VARCHAR(50) UNIQUE NOT NULL,
  course_pda VARCHAR(44) NOT NULL,
  creator VARCHAR(44) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  track_id INT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enrollments
CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  course_id VARCHAR(50) NOT NULL,
  enrollment_pda VARCHAR(44) UNIQUE NOT NULL,
  lesson_flags JSONB,
  completed_at TIMESTAMP,
  credential_asset VARCHAR(44),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, course_id)
);

-- Achievement Receipts
CREATE TABLE achievement_receipts (
  id SERIAL PRIMARY KEY,
  achievement_id VARCHAR(50) NOT NULL,
  recipient VARCHAR(44) NOT NULL,
  asset VARCHAR(44) NOT NULL,
  awarded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(achievement_id, recipient)
);

-- Event Logs
CREATE TABLE event_logs (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  tx_hash VARCHAR(88) NOT NULL,
  block_time INT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard Snapshots
CREATE TABLE leaderboard_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  rankings JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(snapshot_date)
);

-- Webhooks
CREATE TABLE webhooks (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| API Framework | Next.js API Routes / Express |
| Database | PostgreSQL + Prisma |
| Queue | Redis + BullMQ |
| Auth | Wallet-based (no server auth) |
| RPC | Helius |
| Storage | Redis (cache), S3 (files) |
| Monitoring | Prometheus + Grafana |
