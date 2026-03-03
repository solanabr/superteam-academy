# Backend Service Architecture

**Version:** 1.0  
**Scope:** Backend services for Superteam Academy on-chain learning platform  
**Related Docs:** [SPEC.md](../../docs/SPEC.md), [INTEGRATION.md](../../docs/INTEGRATION.md), [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)

---

## Overview

The backend service layer is a Next.js API implementation that bridges the frontend to the Solana on-chain program. It handles hybrid authentication (wallet + OAuth), transaction co-signing, lesson validation, and integration with external services.

This architecture follows the monorepo structure defined in the project root, with the backend residing as API routes within the `app/` directory.

---

## Monorepo Alignment

```
superteam-academy/
├── onchain-academy/        ← Anchor workspace (program IDL)
├── app/                    ← Next.js App Router (backend + frontend)
│   ├── api/               ← Backend API routes
│   │   ├── auth/          ← Auth endpoints
│   │   ├── courses/       ← Course management
│   │   ├── internal/      ← Backend-signed operations
│   │   └── ...
│   ├── (routes)/          ← Frontend pages
│   └── layout.tsx
├── lib/                   ← Shared libraries
│   ├── auth/             ← Auth utilities
│   ├── solana/           ← Anchor client, TX builders
│   ├── supabase/         ← Database client
│   └── validation/       ← Lesson validation
├── types/                 ← TypeScript types (program IDL)
└── plan/backend/         ← This documentation
```

**Key Principle:** The backend is not a separate service but Next.js API routes within the monorepo. This enables:
- Shared types between frontend and backend
- Direct access to program IDL
- Unified deployment on Vercel
- Simplified local development

---

## Service Modules

| Module | Location | Purpose | Program Integration |
|--------|----------|---------|---------------------|
| **Auth Service** | `app/api/auth/*` | Wallet + OAuth + account linking | Uses `backend_signer` from Config PDA |
| **Transaction Builder** | `lib/solana/tx-builder.ts` | Co-sign on-chain transactions | Signs `complete_lesson`, `finalize_course`, `issue_credential` |
| **Course Management** | `app/api/courses/*` | Course CRUD, content delivery | Reads Course PDA, caches in Supabase |
| **Lesson Validation** | `lib/validation/*` | Anti-cheat validation | Gates `complete_lesson` calls |
| **XP Token Service** | `lib/solana/xp.ts` | Token-2022 ATA management | Creates ATAs before XP minting |
| **Credential Service** | `lib/solana/credentials.ts` | Metaplex Core NFT operations | Issues/upgrades credentials via CPI |
| **Achievement Service** | `app/api/internal/achievements/*` | Achievement awards | Calls `award_achievement` |
| **Leaderboard Service** | `app/api/leaderboard/*` | XP rankings | Queries Helius DAS API |
| **Event Listener** | `lib/solana/events.ts` | On-chain event indexing | Listens to program events |
| **Queue & Webhooks** | `lib/queue/*` | Async processing | Handles retries, notifications |

---

## Authentication Architecture

### Two-Layer Auth System

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYERS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LAYER 1: User Authentication (Who is using the app?)           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │ Wallet  │  │ Google  │  │ GitHub  │                         │
│  │  Auth   │  │  OAuth  │  │  OAuth  │                         │
│  └────┬────┘  └────┬────┘  └────┬────┘                         │
│       │            │            │                               │
│       └────────────┴────────────┘                               │
│                    │                                             │
│                    ▼                                             │
│           ┌──────────────┐                                      │
│           │  NextAuth.js │ ← Session management (JWT)           │
│           │              │   Supabase stores user data          │
│           └──────────────┘                                      │
│                                                                  │
│  LAYER 2: Transaction Signing (Who signs on-chain TXs?)         │
│  ┌─────────────────────────────────────────┐                    │
│  │        Backend Signer Keypair           │                    │
│  │   (Stored securely, rotates via         │                    │
│  │    update_config instruction)           │                    │
│  │                                         │                    │
│  │  Signs: complete_lesson                 │                    │
│  │         finalize_course                 │                    │
│  │         issue_credential                │                    │
│  │         upgrade_credential              │                    │
│  │         award_achievement               │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Auth Flow

See [01-auth.md](./01-auth.md) for detailed implementation of:
- Wallet signature verification
- Google/GitHub OAuth
- Account linking/unlinking
- Session management

### Backend Signer

The backend signer is a Solana keypair stored in environment variables (`BACKEND_SIGNER_PRIVATE_KEY`). It:
- Is registered as a `MinterRole` during program `initialize`
- Can be rotated via `update_config` without program redeployment
- Co-signs all lesson completions and credential operations
- Should be stored in AWS KMS or similar in production

```typescript
// lib/solana/backend-signer.ts
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export const backendSigner = Keypair.fromSecretKey(
  bs58.decode(process.env.BACKEND_SIGNER_PRIVATE_KEY!)
);

// Verify signer matches Config.backend_signer
export async function verifyBackendSigner(program: Program, configPda: PublicKey) {
  const config = await program.account.config.fetch(configPda);
  if (!config.backendSigner.equals(backendSigner.publicKey)) {
    throw new Error('Backend signer mismatch - may need rotation');
  }
}
```

---

## Database Schema (Supabase)

### Core Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE,
  username VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Linked Accounts (hybrid auth)
CREATE TABLE linked_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'wallet', 'google', 'github'
  provider_id VARCHAR(255) NOT NULL,
  UNIQUE(provider, provider_id)
);

-- Cached Course Data
CREATE TABLE courses (
  id VARCHAR(50) PRIMARY KEY,
  course_pda VARCHAR(44) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  difficulty VARCHAR(20),
  track_id INT,
  lesson_count INT DEFAULT 0,
  xp_per_lesson INT DEFAULT 25,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollment Cache (synced from on-chain)
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id VARCHAR(50) REFERENCES courses(id),
  enrollment_pda VARCHAR(44) UNIQUE NOT NULL,
  lesson_flags BIGINT[] DEFAULT ARRAY[0, 0, 0, 0],
  completed_at TIMESTAMPTZ,
  credential_asset VARCHAR(44),
  UNIQUE(user_id, course_id)
);

-- XP History (denormalized for quick queries)
CREATE TABLE xp_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'lesson', 'bonus', 'creator', 'achievement'
  source_id VARCHAR(100),
  tx_hash VARCHAR(88),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks (off-chain tracking)
CREATE TABLE streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  freeze_count INT DEFAULT 3
);

-- Achievement Receipts
CREATE TABLE achievement_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  asset VARCHAR(44) NOT NULL,
  xp_rewarded INT DEFAULT 0,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(achievement_id, user_id)
);
```

### Row Level Security

```sql
-- Profiles: Public read, own write
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Enrollments: Own only
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

---

## API Route Structure

### Public Endpoints

```
GET    /api/courses              → List all active courses
GET    /api/courses/[id]         → Get course details
GET    /api/leaderboard          → XP leaderboard
GET    /api/leaderboard/[course] → Course-specific leaderboard
```

### Authenticated Endpoints

```
POST   /api/auth/wallet/sign-message    → Get nonce message
POST   /api/auth/wallet/verify          → Verify + create session
GET    /api/auth/google/callback        → OAuth callback
GET    /api/auth/github/callback        → OAuth callback
POST   /api/auth/link/[provider]        → Link account
DELETE /api/auth/unlink/[provider]      → Unlink account
GET    /api/auth/session                → Get current session
POST   /api/auth/logout                 → Sign out

POST   /api/enrollments/[courseId]      → Enroll in course
DELETE /api/enrollments/[courseId]      → Close enrollment
GET    /api/enrollments                 → List my enrollments

GET    /api/profile                     → Get own profile
PUT    /api/profile                     → Update profile
```

### Internal Endpoints (Backend-Signed)

These endpoints are called by the frontend after lesson completion validation:

```
POST   /api/internal/complete-lesson    → complete_lesson TX
POST   /api/internal/finalize-course    → finalize_course TX
POST   /api/internal/issue-credential   → issue_credential TX
POST   /api/internal/award-achievement  → award_achievement TX
```

**Security:** Internal endpoints require:
1. Valid user session
2. Lesson validation passed
3. Rate limiting (per user per course)

---

## Transaction Building

### Co-Signed Transaction Flow

```typescript
// lib/solana/tx-builder.ts
import { Program } from '@coral-xyz/anchor';
import { SuperteamAcademy } from '@/types/superteam_academy';

export class TransactionBuilder {
  constructor(
    private program: Program<SuperteamAcademy>,
    private backendSigner: Keypair
  ) {}

  async buildCompleteLessonTx(
    courseId: string,
    lessonIndex: number,
    learner: PublicKey
  ) {
    const { configPda, coursePda, enrollmentPda } = derivePdas(courseId, learner);
    
    // Ensure learner has XP ATA
    const learnerAta = await this.ensureXpAta(learner);
    
    const ix = await this.program.methods
      .completeLesson(lessonIndex)
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learner,
        learnerTokenAccount: learnerAta,
        xpMint: this.xpMint,
        backendSigner: this.backendSigner.publicKey,
      })
      .instruction();
    
    return new Transaction().add(ix);
  }

  async buildFinalizeCourseTx(courseId: string, learner: PublicKey) {
    const { configPda, coursePda, enrollmentPda } = derivePdas(courseId, learner);
    const course = await this.program.account.course.fetch(coursePda);
    
    const learnerAta = await this.ensureXpAta(learner);
    const creatorAta = await this.ensureXpAta(course.creator);
    
    const ix = await this.program.methods
      .finalizeCourse()
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learner,
        learnerTokenAccount: learnerAta,
        creator: course.creator,
        creatorTokenAccount: creatorAta,
        xpMint: this.xpMint,
        backendSigner: this.backendSigner.publicKey,
      })
      .instruction();
    
    return new Transaction().add(ix);
  }
}
```

### ATA Management

Before any XP minting, ensure the recipient has a Token-2022 ATA:

```typescript
// lib/solana/xp.ts
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

export async function ensureXpAta(connection: Connection, owner: PublicKey): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(
    XP_MINT,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  
  const account = await connection.getAccountInfo(ata);
  if (!account) {
    // Create ATA transaction
    const ix = createAssociatedTokenAccountInstruction(
      payer.publicKey,
      ata,
      owner,
      XP_MINT,
      TOKEN_2022_PROGRAM_ID
    );
    // Send and confirm...
  }
  
  return ata;
}
```

---

## Lesson Validation (Anti-Cheat)

Before the backend signs `complete_lesson`, validate:

```typescript
// lib/validation/lesson.ts
import { z } from 'zod';

const LessonCompletionSchema = z.object({
  courseId: z.string(),
  lessonIndex: z.number().int().min(0),
  userId: z.string().uuid(),
  walletAddress: z.string(),
  quizAnswers: z.array(z.number()).optional(),
  codeSubmission: z.string().optional(),
  timeSpent: z.number().min(30), // Minimum 30 seconds
});

export async function validateLessonCompletion(data: unknown) {
  const parsed = LessonCompletionSchema.parse(data);
  
  // 1. Verify user is enrolled
  const enrollment = await getEnrollment(parsed.userId, parsed.courseId);
  if (!enrollment) throw new Error('Not enrolled');
  
  // 2. Check lesson not already completed
  if (isLessonComplete(enrollment.lessonFlags, parsed.lessonIndex)) {
    throw new Error('Lesson already completed');
  }
  
  // 3. Verify quiz answers (if applicable)
  if (parsed.quizAnswers) {
    const correct = await verifyQuizAnswers(parsed.courseId, parsed.lessonIndex, parsed.quizAnswers);
    if (!correct) throw new Error('Quiz answers incorrect');
  }
  
  // 4. Rate limiting
  const recentCompletions = await countRecentCompletions(parsed.userId, '1 hour');
  if (recentCompletions > 10) {
    throw new Error('Rate limit exceeded');
  }
  
  return parsed;
}
```

---

## Event Indexing

```typescript
// lib/solana/events.ts
import { Program } from '@coral-xyz/anchor';

export function startEventListener(program: Program) {
  // Listen for LessonCompleted events
  program.addEventListener('LessonCompleted', async (event) => {
    await supabase.from('xp_history').insert({
      user_id: await getUserIdByWallet(event.learner),
      amount: event.xpEarned,
      source: 'lesson',
      source_id: `${event.course}-${event.lessonIndex}`,
    });
    
    // Update enrollment cache
    await updateEnrollmentCache(event.learner, event.course, event.lessonIndex);
  });
  
  // Listen for CourseFinalized
  program.addEventListener('CourseFinalized', async (event) => {
    await notifyUser(event.learner, 'course_completed', {
      course: event.course,
      totalXp: event.totalXp,
    });
  });
}
```

---

## Environment Variables

```bash
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3

# Backend Signer (CRITICAL: Secure storage required)
BACKEND_SIGNER_PRIVATE_KEY=base58_encoded_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Helius (for DAS API)
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=xxx
HELIUS_API_KEY=xxx

# Arweave
ARWEAVE_GATEWAY=https://arweave.net

# CMS
SANITY_PROJECT_ID=xxx
SANITY_DATASET=production
SANITY_API_TOKEN=xxx
```

---

## Security Checklist

- [ ] Backend signer key stored in AWS KMS or similar
- [ ] All internal endpoints rate-limited
- [ ] Lesson validation runs before any on-chain TX
- [ ] Supabase RLS policies active on all tables
- [ ] Input validation with Zod on all API routes
- [ ] CORS configured for production domain only
- [ ] Transaction simulation before signing
- [ ] Backend signer rotation tested

---

## Testing

```bash
# Unit tests
cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml

# Integration tests
anchor test

# Backend API tests
npm run test:api

# E2E tests
npm run test:e2e
```

---

## Deployment

1. **Devnet First**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

2. **Environment Setup**
   - Configure Vercel environment variables
   - Set up Supabase project
   - Run database migrations

3. **Deploy**
   ```bash
   vercel --prod
   ```

---

*See module-specific docs for implementation details:*
- [01-auth.md](./01-auth.md) - Authentication & account linking
- [02-transaction-builder.md](./02-transaction-builder.md) - TX building
- [03-course-management.md](./03-course-management.md) - Course operations
- [04-lesson-validation.md](./04-lesson-validation.md) - Anti-cheat
- [05-xp-token.md](./05-xp-token.md) - XP token operations
- [06-credential.md](./06-credential.md) - Credential NFTs
