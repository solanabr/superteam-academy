# Superteam Academy Backend

Transaction signing service for the Superteam Academy on-chain program. Holds the `backend_signer` keypair and signs transactions that require backend authorization (lesson completion, course finalization, credential issuance, XP rewards).

## Why a Separate Backend?

The on-chain program requires a `backend_signer` for anti-cheat operations. This keypair must never be exposed to the frontend. The backend validates requests via JWT, then signs and submits transactions to Solana.

```
Frontend (Next.js)  →  Backend (Hono)  →  Solana Program
   learner action       validate JWT       sign + submit tx
                         build tx
```

## Tech Stack

- **Hono** — lightweight HTTP framework
- **@coral-xyz/anchor** — Solana program client
- **jose** — JWT verification (validates NextAuth tokens)
- **tsx** — TypeScript execution for development

## Quick Start

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

The server starts on `http://localhost:3001` by default.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SOLANA_RPC_URL` | Yes | Solana RPC endpoint (Helius devnet recommended) |
| `BACKEND_SIGNER_KEYPAIR` | Yes | Path to keypair file, JSON array, or base58 private key |
| `AUTH_SECRET` | Yes | Must match `AUTH_SECRET` in the Next.js app (NextAuth) |
| `PORT` | No | Server port (default: 3001) |
| `APP_ORIGIN` | No | Allowed CORS origin (default: http://localhost:3000) |

### Keypair Formats

The `BACKEND_SIGNER_KEYPAIR` env var accepts three formats:

```bash
# File path
BACKEND_SIGNER_KEYPAIR=../wallets/backend-signer.json

# JSON array
BACKEND_SIGNER_KEYPAIR=[123,45,67,...]

# Base58 private key
BACKEND_SIGNER_KEYPAIR=5Jx3...base58key
```

## API Routes

All routes require `Authorization: Bearer <jwt>` header. The JWT is the NextAuth session token.

### POST /complete-lesson

Marks a lesson as complete and mints XP to the learner.

```json
{
  "courseId": "introduction-to-solana",
  "lessonIndex": 3,
  "learnerWallet": "HN7c...YWrH"
}
```

Response:
```json
{
  "success": true,
  "signature": "5Tx...",
  "xpEarned": 100
}
```

### POST /finalize-course

Verifies all lessons complete, awards bonus XP to learner and creator reward XP.

```json
{
  "courseId": "introduction-to-solana",
  "learnerWallet": "HN7c...YWrH"
}
```

Response:
```json
{
  "success": true,
  "signature": "5Tx..."
}
```

### POST /issue-credential

Creates a soulbound Metaplex Core NFT credential. Requires `finalize-course` first.

```json
{
  "courseId": "introduction-to-solana",
  "learnerWallet": "HN7c...YWrH",
  "credentialName": "Solana Core - Silver",
  "metadataUri": "https://arweave.net/...",
  "coursesCompleted": 3,
  "totalXp": 1500
}
```

Response:
```json
{
  "success": true,
  "signature": "5Tx...",
  "credentialAsset": "9xKp...mint"
}
```

### POST /reward-xp

Mints XP tokens to any recipient (requires backend to be registered as a MinterRole).

```json
{
  "recipientWallet": "HN7c...YWrH",
  "amount": 500,
  "memo": "community event reward"
}
```

Response:
```json
{
  "success": true,
  "signature": "5Tx..."
}
```

### GET /health

Health check endpoint. No auth required.

```json
{ "status": "ok" }
```

## Architecture

```
backend/
├── src/
│   ├── index.ts              ← Hono server, routes, CORS, error handler
│   ├── middleware/
│   │   └── auth.ts           ← JWT verification (NextAuth compatible)
│   ├── routes/
│   │   ├── complete-lesson.ts
│   │   ├── finalize-course.ts
│   │   ├── issue-credential.ts
│   │   └── reward-xp.ts
│   ├── lib/
│   │   ├── program.ts        ← Anchor client + signer setup
│   │   ├── pda.ts            ← PDA derivation helpers
│   │   ├── ata.ts            ← Token-2022 ATA creation
│   │   ├── config.ts         ← Env var loading + keypair parsing
│   │   └── idl-types.ts      ← Program IDL types
│   └── types.ts              ← Request body types
├── .env.example
├── package.json
└── tsconfig.json
```

### Request Flow

1. Frontend sends POST with JWT + request body
2. `auth.ts` middleware verifies JWT against `AUTH_SECRET`
3. Route handler builds Anchor transaction
4. `backend_signer` keypair signs the transaction
5. Transaction submitted to Solana RPC
6. Signature returned to frontend

### Token Account Handling

Routes automatically create Token-2022 ATAs if they don't exist (via `getOrCreateATA`). The backend pays for ATA creation as a `preInstruction`.

## Security

- **Never expose `BACKEND_SIGNER_KEYPAIR`** — this key has MinterRole authority
- **JWT validation** — every request is authenticated against the same secret as NextAuth
- **CORS** — restricted to `APP_ORIGIN` only
- **No direct wallet access** — backend only signs specific program instructions, not arbitrary transactions

## On-Chain Program

Program ID: `GuBhF6hk5yKhnvU5712LZwUPaoAmoxtJf9GTh4CHTxsF` (devnet)

The backend signer must be registered in the program's Config PDA as `backend_signer`. Run `scripts/setup-backend-signer.ts` from the `onchain-academy/` directory to set this up.

## Deployment

### Docker

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

### Railway / Fly.io / Render

Set environment variables in the dashboard and deploy. Build command: `npm run build`, start command: `npm start`.

### Vercel (not recommended)

This is a long-running server, not a serverless function. Use a traditional hosting provider.
