# Frontend Architecture

System design, data flow, service patterns, on-chain integration.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │   Pages    │  │  Components│  │   Hooks    │  │  Services  │ │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘ │
│         │                │                │                │       │
│         └────────────────┴────────────────┴────────────────┘       │
│                              │                                     │
└──────────────────────────────┼─────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Sanity CMS     │  │   Supabase      │  │  Solana Devnet  │
│  (Content)      │  │   (User Data)   │  │  (XP, Creds)    │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ - Courses       │  │ - Progress      │  │ - Enrollments   │
│ - Tracks        │  │ - Achievements  │  │ - XP Tokens     │
│ - Modules       │  │ - Leaderboard   │  │ - Credentials   │
│ - Lessons       │  │ - Daily tasks   │  │ - Config PDA    │
│ - Instructors   │  │ - Settings      │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                               │
                               ▼
                     ┌─────────────────┐
                     │ Backend Service │
                     │ (Hono Server)   │
                     ├─────────────────┤
                     │ - Holds keypair │
                     │ - Signs txs     │
                     │ - Validates     │
                     └─────────────────┘
```

## Data Flow

### Content Delivery
```
Sanity CMS → Next.js SSG/ISR → User
```
- Course catalog, lesson content fetched at build time
- Revalidated on Sanity webhook
- Markdown rendered client-side
- Video streaming via embedded URLs

### User Progress
```
User action → Service Interface → Supabase → UI update
```
- Lesson completion tracked off-chain
- XP balance synced from on-chain (Token-2022 ATA)
- Achievements stored in Supabase (bitmask)
- Real-time updates via Supabase subscriptions

### On-Chain Flow
```
User wallet → Frontend TX build → Backend signature → Solana
```

**Enrollment (user-signed):**
1. User clicks "Enroll"
2. Frontend derives Enrollment PDA
3. Wallet signs `enroll_course` transaction
4. Program creates Enrollment PDA

**Lesson Completion (backend-signed):**
1. User completes lesson
2. Frontend sends completion proof to backend service
3. Backend validates, signs `complete_lesson` transaction
4. Frontend submits signed transaction
5. Program updates Enrollment.lessons_completed bitmap
6. XP minted to user's Token-2022 ATA

**Course Finalization (backend-signed):**
1. Backend detects all lessons completed
2. Backend calls `finalize_course`
3. Bonus XP awarded

**Credential Issuance (backend-signed):**
1. Backend calls `issue_credential`
2. Metaplex Core NFT minted to user
3. PermanentFreezeDelegate applied (soulbound)

## Service Layer Pattern

All external integrations use interface + dual implementations:

```typescript
// Service interface
interface LearningProgressService {
  trackLessonCompletion(userId: string, lessonId: string): Promise<void>;
  getUserProgress(userId: string, courseId: string): Promise<Progress>;
}

// Mock implementation (development, testing)
class MockLearningProgressService implements LearningProgressService {
  // In-memory storage
}

// Real implementation (production)
class SupabaseLearningProgressService implements LearningProgressService {
  // Supabase client
}

// Factory with runtime fallback
export const learningProgressService: LearningProgressService =
  process.env.USE_MOCKS === 'true'
    ? new MockLearningProgressService()
    : new SupabaseLearningProgressService();
```

### Services

| Service | Interface | Mock | Real | Purpose |
|---------|-----------|------|------|---------|
| **LearningProgress** | trackCompletion, getProgress | In-memory | Supabase | Lesson completion tracking |
| **Gamification** | awardXP, unlockAchievement | In-memory | Supabase | XP, achievements, daily tasks |
| **Leaderboard** | getRankings, getUserRank | Random data | Helius DAS | XP leaderboard queries |
| **Credential** | getCredentials, getCredential | Mock NFTs | Helius DAS | Metaplex Core NFT queries |
| **CodeExecution** | executeCode, validateSolution | Mock validation | Future sandbox | Code challenge execution |

### Benefits

- **Development**: Work without Supabase/Helius setup
- **Testing**: Deterministic mock data
- **Resilience**: Fallback if services unavailable
- **Cost**: Reduce API calls during dev

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | * | NextAuth v5 handler (Google, GitHub, Solana SIWS) |
| `/api/webhooks/sanity` | POST | Revalidate on content changes |
| `/api/progress/[userId]` | GET | Fetch user progress (Supabase) |
| `/api/leaderboard` | GET | Fetch XP rankings (Helius DAS API) |
| `/api/credentials/[userId]` | GET | Fetch user credentials (Helius DAS API) |

Backend service (separate Hono app at `/backend/`):
- `POST /complete-lesson` - Sign lesson completion transaction
- `POST /finalize-course` - Sign course finalization transaction
- `POST /issue-credential` - Sign credential issuance transaction

## On-Chain Integration

### PDA Derivation

```typescript
import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);

// Config PDA
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('config')],
  PROGRAM_ID
);

// Enrollment PDA
const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('enrollment'),
    learner.toBuffer(),
    Buffer.from(courseId),
    Buffer.from(trackId),
  ],
  PROGRAM_ID
);

// UserStats PDA
const [userStatsPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('user_stats'), learner.toBuffer()],
  PROGRAM_ID
);

// Course PDA
const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from('course'), Buffer.from(courseId), Buffer.from(trackId)],
  PROGRAM_ID
);

// Credential PDA
const [credentialPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('credential'),
    learner.toBuffer(),
    Buffer.from(courseId),
    Buffer.from(trackId),
  ],
  PROGRAM_ID
);
```

### Wallet-Signed Transactions

User signs directly:

```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';

const { publicKey, signTransaction } = useWallet();
const program = useAnchorProgram();

// Enroll in course
const tx = await program.methods
  .enrollCourse(courseId, trackId)
  .accounts({
    learner: publicKey,
    enrollment: enrollmentPda,
    userStats: userStatsPda,
    systemProgram: SystemProgram.programId,
  })
  .transaction();

const signed = await signTransaction(tx);
const signature = await connection.sendRawTransaction(signed.serialize());
```

### Backend-Signed Transactions

Backend holds `backend_signer` keypair:

```typescript
// Frontend: Request backend signature
const response = await fetch('/backend/complete-lesson', {
  method: 'POST',
  body: JSON.stringify({
    learner: publicKey.toString(),
    courseId,
    trackId,
    lessonIndex,
    proof: completionProof, // Quiz score, time spent, etc.
  }),
});

const { transaction } = await response.json();

// Frontend: Deserialize and submit
const tx = Transaction.from(Buffer.from(transaction, 'base64'));
const signature = await connection.sendRawTransaction(tx.serialize());
```

Backend validates proof, builds transaction, signs with `backend_signer`, returns serialized transaction.

### XP Balance Queries

XP stored in Token-2022 ATA (Associated Token Account):

```typescript
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

const xpMint = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT);

const userXpAta = getAssociatedTokenAddressSync(
  xpMint,
  publicKey,
  false,
  TOKEN_2022_PROGRAM_ID
);

const account = await connection.getTokenAccountBalance(userXpAta);
const xpBalance = Number(account.value.amount);
```

### Credential Queries

Metaplex Core NFTs queried via Helius DAS API:

```typescript
const response = await fetch(process.env.NEXT_PUBLIC_SOLANA_RPC_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 'credentials',
    method: 'getAssetsByOwner',
    params: {
      ownerAddress: publicKey.toString(),
      page: 1,
      limit: 100,
    },
  }),
});

const { result } = await response.json();
const credentials = result.items.filter(
  (asset) => asset.grouping?.some((g) => g.group_key === 'collection')
);
```

## Authentication Flow

NextAuth v5 beta with custom Solana SIWS provider:

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Choose auth method:                 │
│ - Google OAuth                      │
│ - GitHub OAuth                      │
│ - Solana wallet (SIWS)              │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ NextAuth v5 handler                 │
│ /api/auth/[...nextauth]             │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Session created                     │
│ - User ID                           │
│ - Email (OAuth) or wallet (SIWS)    │
│ - Linked wallet (optional)          │
└─────────────────────────────────────┘
```

### Solana SIWS (Sign-In With Solana)

```typescript
import { SigninMessage } from '@solana/wallet-standard-util';

// 1. Frontend: Generate message
const message = new SigninMessage({
  domain: window.location.host,
  address: publicKey.toString(),
  statement: 'Sign in to Superteam Academy',
  uri: window.location.origin,
  version: '1',
  chainId: 'devnet',
  nonce: nonce, // From backend
});

// 2. User signs message
const signature = await signMessage(message.prepareMessage());

// 3. Backend: Verify signature
import { verifySignIn } from '@solana/wallet-standard-util';
const verified = verifySignIn(message, signature);

// 4. Create session
if (verified) {
  session.user.wallet = publicKey.toString();
}
```

## Internationalization (i18n)

next-intl with 3 locales:

```
src/
├── messages/
│   ├── en.json          # English
│   ├── pt-BR.json       # Brazilian Portuguese
│   ├── es.json          # Spanish
│   └── index.ts         # Message loader
└── app/
    └── [locale]/        # Locale-based routes
        ├── page.tsx
        └── courses/
            └── page.tsx
```

### Usage

```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('courses');

<h1>{t('title')}</h1>
<p>{t('description', { count: 5 })}</p>
```

Messages file (`en.json`):
```json
{
  "courses": {
    "title": "Explore Courses",
    "description": "{count, plural, =1 {1 course} other {# courses}} available"
  }
}
```

## State Management

**Global state**: React Context + hooks (minimal)
**Server state**: TanStack Query (React Query)
**Form state**: React Hook Form + Zod validation
**Wallet state**: @solana/wallet-adapter-react

### Example: Course Data

```typescript
import { useQuery } from '@tanstack/react-query';
import { getCourse } from '@/lib/sanity/queries';

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

## Performance Optimizations

**Next.js:**
- Static generation for course catalog
- Incremental Static Regeneration (ISR) for course detail pages
- Dynamic imports for heavy components (Monaco Editor)
- Image optimization via next/image

**Sanity:**
- GROQ queries with field projection (fetch only needed fields)
- CDN caching for images/videos

**Supabase:**
- Row-level security policies
- Indexed queries (userId, courseId)
- Connection pooling

**Solana:**
- Batch RPC requests with `getMultipleAccounts`
- Cache PDA derivations
- Prefetch on-chain data in `getStaticProps`

## Error Handling

**On-chain errors:**
```typescript
import { AnchorError } from '@coral-xyz/anchor';

try {
  await program.methods.enrollCourse(...).rpc();
} catch (err) {
  if (err instanceof AnchorError) {
    // Program error code
    console.error('Program error:', err.error.errorCode.code);
  }
  // Handle network errors, wallet rejection, etc.
}
```

**Service errors:**
All services throw typed errors:
```typescript
class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
  }
}
```

**Sentry integration:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error, {
  tags: { service: 'supabase', method: 'trackProgress' },
  extra: { userId, courseId },
});
```

## On-Chain Event Listeners

The frontend subscribes to Anchor program events via WebSocket for real-time UI updates. Events supplement API polling — initial data loads from REST APIs, events update the UI as new transactions confirm.

### Architecture

Event types are derived from the IDL via `IdlEvents<OnchainAcademy>` — zero manual type definitions. The service layer (`lib/solana/events.ts`) provides `subscribeToEvent` / `unsubscribeFromEvent`, and the hooks (`hooks/use-program-events.ts`) wrap these with React lifecycle management.

### Hook API

```typescript
import { useProgramEvent, useProgramEvents } from '@/hooks/use-program-events';

// Single event (camelCase names from IDL)
useProgramEvent('lessonCompleted', (event, slot, signature) => {
  console.log(event.xpEarned);
});

// Multiple events
useProgramEvents({
  lessonCompleted: (event) => { /* ... */ },
  courseFinalized: (event) => { /* ... */ },
  xpRewarded: (event) => { /* ... */ },
});
```

### Event Types

15 on-chain events, all IDL-derived via `ProgramEvents` from `lib/solana/events.ts`:

| Event | Payload (IDL fields) | Used In |
|-------|---------|---------|
| `enrolled` | learner (PublicKey), course (PublicKey), courseVersion (u16), timestamp (i64) | Course detail (enrollment confirmation) |
| `lessonCompleted` | learner (PublicKey), course (PublicKey), lessonIndex (u8), xpEarned (u32), timestamp (i64) | Lesson page (auto-complete), Dashboard (refresh stats) |
| `courseFinalized` | learner (PublicKey), course (PublicKey), totalXp (u32), bonusXp (BN), creator (PublicKey), creatorXp (u32), timestamp (i64) | Dashboard (refresh stats) |
| `credentialIssued` | learner (PublicKey), trackId (u16), credentialAsset (PublicKey), currentLevel (u8), timestamp (i64) | Admin live feed |
| `credentialUpgraded` | learner (PublicKey), trackId (u16), credentialAsset (PublicKey), currentLevel (u8), timestamp (i64) | — |
| `xpRewarded` | minter (PublicKey), recipient (PublicKey), amount (BN), memo (string), timestamp (i64) | Dashboard (refresh stats) |
| `courseCreated` | course (PublicKey), courseId (string), creator (PublicKey), trackId (u16), trackLevel (u8), timestamp (i64) | Admin live feed |
| `courseUpdated` | course (PublicKey), version (u16), timestamp (i64) | Admin live feed |
| `minterRegistered` | minter (PublicKey), label (string), maxXpPerCall (BN), timestamp (i64) | Admin live feed |
| `minterRevoked` | minter (PublicKey), totalXpMinted (BN), timestamp (i64) | Admin live feed |
| `achievementAwarded` | achievementId (string), recipient (PublicKey), asset (PublicKey), xpReward (u32), timestamp (i64) | Admin live feed |
| `achievementTypeCreated` | achievementId (string), collection (PublicKey), creator (PublicKey), maxSupply (u32), xpReward (u32), timestamp (i64) | — |
| `achievementTypeDeactivated` | achievementId (string), timestamp (i64) | — |
| `configUpdated` | field (string), timestamp (i64) | — |
| `enrollmentClosed` | learner (PublicKey), course (PublicKey), completed (bool), rentReclaimed (BN), timestamp (i64) | — |

### Page Subscriptions

| Page | Events | Behavior |
|------|--------|----------|
| **Dashboard** | lessonCompleted, courseFinalized, xpRewarded | Refreshes stats via API re-fetch |
| **Lesson** | lessonCompleted | Sets lesson as complete (green badge) |
| **Course Detail** | enrolled | Sets enrolled state |
| **Admin** | 9 events (enrolled, lessonCompleted, courseFinalized, credentialIssued, xpRewarded, courseCreated, minterRegistered, minterRevoked, achievementAwarded) | Appends to real-time activity feed |

### Requirements

- **WebSocket RPC** — Events require a WebSocket-capable RPC endpoint (e.g., Helius `wss://`)
- **Graceful degradation** — If WebSocket connection fails, the UI still works via API polling; events are a progressive enhancement
- **Cleanup** — All listeners are removed on component unmount via `useEffect` cleanup

## Security

**Environment variables:**
- Public vars prefixed with `NEXT_PUBLIC_`
- Secrets server-side only
- Validation on startup

**API routes:**
- NextAuth session verification
- CORS headers configured
- Rate limiting (Vercel built-in)

**Supabase:**
- Row-level security (RLS) policies
- Service role key server-side only
- Anon key for client

**Solana:**
- Wallet signatures verified on-chain
- Backend signer rotatable via Config PDA
- Transaction size limits enforced

## Monitoring

**PostHog:**
- User analytics
- Feature flags
- Session recordings

**Google Analytics:**
- Page views
- Course enrollments
- Lesson completions

**Sentry:**
- Error tracking
- Performance monitoring
- Transaction traces

## Build & Deploy

**Vercel (recommended):**
1. Connect GitHub repo
2. Set environment variables
3. Deploy (automatic on push to main)

**Environment variables** set in Vercel dashboard, not committed to repo.

**Build command:** `pnpm build`
**Output directory:** `.next`

**ISR revalidation:**
- Course pages: 60 seconds
- Lesson pages: 5 minutes
- Catalog: On-demand via Sanity webhook

---

See [CUSTOMIZATION.md](./CUSTOMIZATION.md) for theming and extensions.
