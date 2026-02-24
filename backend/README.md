# Backend Signer Service

Standalone Express backend for Superteam Academy. Handles lesson completion, course finalization, and credential issuance by holding a rotatable backend signer keypair.

## Architecture

The backend signer validates off-chain quiz answers before signing on-chain transactions. This prevents learners from completing lessons without actually engaging with the content.

```
Frontend → Backend Signer → Anchor Program (Solana)
           ├── Validate quiz answers (Sanity CMS → fallback to hardcoded)
           ├── Rate limit (1 req per lesson per 5s)
           ├── Sign complete_lesson tx
           ├── Sign finalize_course tx
           └── Sign issue_credential / upgrade_credential tx
```

## Deployment Options

### Option A: Standalone Express (this directory)

```bash
cd backend
npm install
cp .env.example .env  # configure your keys
npm run dev            # development with hot reload
npm run build && npm start  # production
```

### Option B: Next.js API Routes (app/ directory)

The same backend logic is also available as Next.js API routes under `app/app/api/`. This is the default deployment mode — deploying the Next.js app to Vercel includes the backend automatically.

| Route | Express Endpoint | Next.js API Route |
|---|---|---|
| Complete lesson | `POST /api/complete-lesson` | `POST /api/complete-lesson` |
| Finalize course | `POST /api/finalize-course` | `POST /api/finalize-course` |
| Issue credential | `POST /api/issue-credential` | `POST /api/issue-credential` |
| Leaderboard | `GET /api/leaderboard` | `GET /api/leaderboard` |

## API Endpoints

### POST /api/complete-lesson

Validates quiz answers and signs the `complete_lesson` instruction.

```json
{
  "courseId": "solana-101",
  "lessonIndex": 0,
  "answers": [2],
  "learnerPubkey": "..."
}
```

### POST /api/finalize-course

Signs `finalize_course` after all lessons are completed. Awards bonus XP and creator rewards.

```json
{
  "courseId": "solana-101",
  "learnerPubkey": "..."
}
```

### POST /api/issue-credential

Issues or upgrades a soulbound Metaplex Core NFT credential.

```json
{
  "courseId": "solana-101",
  "learnerPubkey": "..."
}
```

### GET /api/leaderboard

Returns XP leaderboard sorted by balance. Cached for 5 minutes.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `BACKEND_SIGNER_KEY` | Yes | JSON array of the backend signer keypair bytes |
| `HELIUS_URL` | Yes | Helius RPC endpoint with API key |
| `PROGRAM_ID` | No | Program address (defaults to devnet) |
| `XP_MINT` | No | XP token mint (defaults to devnet) |
| `TRACK_COLLECTION` | No | Metaplex collection for credentials |
| `SANITY_PROJECT_ID` | No | Sanity CMS project ID for quiz content |
| `SANITY_DATASET` | No | Sanity dataset (default: production) |
| `PORT` | No | Server port (default: 3001) |
| `ALLOWED_ORIGINS` | No | CORS origins (default: localhost:3000) |
