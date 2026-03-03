# Backend Services Overview

**Status**: Backend API routes for Next.js full-stack implementation. On-chain program already deployed on devnet.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |
| **Authority** | `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn` |

**Docs**: [SPEC.md](../../docs/SPEC.md) | [INTEGRATION.md](../../docs/INTEGRATION.md) | [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)

---

## Module Structure

The backend consists of the following service modules:

| # | Module | File | Priority | Description |
|---|--------|------|----------|-------------|
| 00 | **Backend Architecture** | **`00-architecture.md`** | **P0** | **Monorepo structure, auth layers, program integration** |
| 01 | Auth & Account Linking | `01-auth.md` | P0 | Hybrid auth (Wallet + Google + GitHub) |
| 01 | Transaction Builder | `01-transaction-builder.md` | P0 | Builds and signs co-signed transactions |
| 02 | Lesson Validation | `02-lesson-validation.md` | P1 | Validates content completion (anti-cheat) |
| 03 | Course Management | `03-course-management.md` | P0 | Course CRUD, content management |
| 04 | XP Token Service | `04-xp-token.md` | P0 | Token-2022 XP minting and ATAs |
| 05 | Credential Service | `05-credential.md` | P0 | Metaplex Core NFT issuance/upgrades |
| 06 | Achievement Service | `06-achievement.md` | P1 | Achievement awards |
| 07 | Event Listener | `07-event-listener.md` | P1 | On-chain event monitoring |
| 08 | Leaderboard Service | `08-leaderboard.md` | P1 | XP rankings via Helius DAS API |
| 09 | Webhook & Queue | `09-webhook-queue.md` | P2 | Async processing and notifications |
| 10 | Services Index | `10-index.md` | - | Index of all backend services |

**Start here:** [00-architecture.md](./00-architecture.md) for backend overview and monorepo structure.

## Dependencies

```json
{
  "next": "^16.1",
  "react": "^19",
  "@solana/web3.js": "^1.98",
  "@solana/spl-token": "^0.4",
  "@metaplex-foundation/mpl-core": "^1.0",
  "next-auth": "^4.24",
  "@supabase/supabase-js": "^2.96",
  "@supabase/ssr": "^0.8",
  "@upstash/redis": "^1.36",
  "@upstash/ratelimit": "^2.0",
  "bs58": "^6.0",
  "tweetnacl": "^1.0",
  "zod": "^3"
}
```

**Auth Flow**: NextAuth.js manages sessions (Google/GitHub OAuth + Wallet Credentials), Supabase stores user data.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                        │
│  /api/auth/*  /api/courses/*  /api/leaderboard/*  /api/*    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                     SERVICE LAYER                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │ Course  │ │   XP    │ │Credential│           │
│  │Service  │ │Service  │ │ Service │ │ Service  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │          │          │          │                    │
│  ┌────┴──────────┴──────────┴──────────┴────┐              │
│  │              SUPABASE CLIENT              │              │
│  │        (Database + Auth + Storage)        │              │
│  └───────────────────┬───────────────────────┘              │
└──────────────────────┼──────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────┐
│                 EXTERNAL SERVICES                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Solana  │ │ Helius  │ │ Arweave │ │   CMS   │           │
│  │ Devnet  │ │   DAS   │ │ Content │ │ Sanity  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Supabase Configuration

### Why Supabase?

- **PostgreSQL Database** - Full SQL support with Row Level Security
- **Built-in Auth** - Google, GitHub, Email providers
- **Real-time** - WebSocket subscriptions for live updates
- **Storage** - File storage for avatars, content
- **Edge Functions** - Serverless functions for webhooks
- **Dashboard** - Easy data management

### Supabase Client Setup

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Middleware cookie handling
          }
        },
      },
    }
  )
}

// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

## Database Schema (Supabase)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE,
  username VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{"twitter": null, "github": null, "linkedin": null, "website": null}',
  preferences JSONB DEFAULT '{"language": "en", "theme": "dark", "notifications": true}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Linked Accounts (for hybrid auth)
CREATE TABLE linked_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'wallet', 'google', 'github', 'email'
  provider_id VARCHAR(255) NOT NULL,
  provider_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

-- Courses (cached from on-chain)
CREATE TABLE courses (
  id VARCHAR(50) PRIMARY KEY,
  course_pda VARCHAR(44) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  difficulty VARCHAR(20) NOT NULL,
  track_id INT,
  track_name VARCHAR(100),
  instructor_id UUID REFERENCES profiles(id),
  lesson_count INT DEFAULT 0,
  xp_per_lesson INT DEFAULT 25,
  estimated_duration INT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments
CREATE TABLE enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id VARCHAR(50) REFERENCES courses(id) NOT NULL,
  enrollment_pda VARCHAR(44) UNIQUE NOT NULL,
  lesson_flags BIGINT[] DEFAULT ARRAY[0, 0, 0, 0],
  completed_at TIMESTAMPTZ,
  credential_asset VARCHAR(44),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Streaks
CREATE TABLE streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  streak_history JSONB DEFAULT '[]',
  freeze_count INT DEFAULT 3,
  max_freezes INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- XP History
CREATE TABLE xp_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,
  source VARCHAR(50) NOT NULL,
  source_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for leaderboard queries
CREATE INDEX idx_xp_history_user ON xp_history(user_id, created_at DESC);

-- Achievement Receipts
CREATE TABLE achievement_receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  achievement_id VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asset VARCHAR(44) NOT NULL,
  xp_rewarded INT DEFAULT 0,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(achievement_id, user_id)
);

-- Event Logs
CREATE TABLE event_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  tx_hash VARCHAR(88),
  wallet_address VARCHAR(44),
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard Snapshots
CREATE TABLE leaderboard_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  snapshot_type VARCHAR(20) NOT NULL,
  snapshot_date DATE NOT NULL,
  rankings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_type, snapshot_date)
);

-- Community Threads
CREATE TABLE threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  category VARCHAR(50) NOT NULL,
  course_id VARCHAR(50),
  lesson_id VARCHAR(50),
  tags TEXT[],
  upvotes INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread Replies
CREATE TABLE replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  upvotes INT DEFAULT 0,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread Upvotes
CREATE TABLE thread_upvotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- Reply Upvotes
CREATE TABLE reply_upvotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reply_id UUID REFERENCES replies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_threads_category ON threads(category, created_at DESC);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read public profiles, update own
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Enrollments: Users can only see own enrollments
CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Streaks: Users can only access own streak
CREATE POLICY "Users can access own streak"
  ON streaks FOR ALL
  USING (auth.uid() = user_id);

-- XP History: Users can view own history
CREATE POLICY "Users can view own XP history"
  ON xp_history FOR SELECT
  USING (auth.uid() = user_id);

-- Notifications: Users can only access own notifications
CREATE POLICY "Users can access own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id);
```

### Database Types Generation

```bash
# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

## API Endpoints

### Auth Endpoints (Hybrid: Wallet + Social)
```
POST   /api/auth/wallet/sign-message    # Get message to sign
POST   /api/auth/wallet/verify          # Verify wallet signature
POST   /api/auth/google/callback        # Google OAuth callback
POST   /api/auth/github/callback        # GitHub OAuth callback
POST   /api/auth/link/wallet            # Link wallet to existing account
POST   /api/auth/link/google            # Link Google to existing account
POST   /api/auth/link/github            # Link GitHub to existing account
DELETE /api/auth/unlink/:provider       # Unlink auth method
GET    /api/auth/session                # Get current session
POST   /api/auth/logout                 # Logout
GET    /api/auth/linked-accounts        # Get linked accounts
```

### Public Endpoints
```
GET    /api/courses                     # List all courses
GET    /api/courses/:id                 # Get course details
GET    /api/courses/:id/content         # Get course content (from CMS)
GET    /api/leaderboard                 # Get XP leaderboard
GET    /api/leaderboard/:courseId       # Course-specific leaderboard
GET    /api/credentials/:wallet         # Get user credentials
GET    /api/xp/:wallet                  # Get XP balance
GET    /api/achievements/:wallet        # Get user achievements
```

### Authenticated Endpoints
```
POST   /api/enrollment/:courseId        # Enroll in course
DELETE /api/enrollment/:courseId        # Close enrollment
GET    /api/enrollment/:courseId        # Get enrollment status
GET    /api/enrollments                 # Get user enrollments
GET    /api/profile                     # Get own profile
PUT    /api/profile                     # Update profile
GET    /api/streak                      # Get streak data
POST   /api/streak/activity             # Record activity
GET    /api/notifications               # Get notifications
PUT    /api/notifications/:id/read      # Mark as read
```

### Backend-Signed Endpoints (Internal)
```
POST   /api/internal/complete-lesson    # Complete lesson
POST   /api/internal/finalize-course    # Finalize course
POST   /api/internal/issue-credential   # Issue credential
POST   /api/internal/award-achievement  # Award achievement
```

### Admin Endpoints
```
POST   /api/admin/courses               # Create course
PUT    /api/admin/courses/:id           # Update course
DELETE /api/admin/courses/:id           # Deactivate course
GET    /api/admin/stats                 # Platform statistics
GET    /api/admin/users                 # User list
```

## Environment Variables

```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# GitHub OAuth
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Auth
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000

# Helius
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx
HELIUS_API_KEY=xxx

# CMS
SANITY_PROJECT_ID=xxx
SANITY_DATASET=production
SANITY_API_TOKEN=xxx

# Backend Signer
BACKEND_SIGNER_PRIVATE_KEY=xxx

# Analytics
NEXT_PUBLIC_GA_ID=G-xxx
NEXT_PUBLIC_POSTHOG_KEY=xxx
SENTRY_DSN=xxx
```

## Security Considerations

1. **Hybrid Auth Security**
   - Wallet signature verification on server
   - OAuth state parameter validation
   - Session binding to all linked providers
   - Rate limiting on auth endpoints

2. **Supabase Security**
   - RLS policies on all tables
   - Service role key only for admin operations
   - Anon key for client-side operations
   - API gateway rate limiting

3. **Wallet Security**
   - Never store private keys in DB
   - Backend signer in secure env
   - Transaction simulation before signing

4. **Data Security**
   - Input validation with Zod
   - SQL injection prevention (parameterized queries)
   - XSS protection
   - Audit logs
