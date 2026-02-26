# Superteam Academy — Backend

Backend services for the Superteam Academy platform.
when running local --> localhost 3000 has the permissions to hit login flow.

## Overview

The backend handles operations that require server-side signing, such as:

- **Lesson completion** — Backend validates completion criteria and signs the `complete_lesson` instruction
- **Course finalization** — Backend signs `finalize_course` after verifying all lessons are completed
- **Credential issuance** — Backend signs `issue_credential` to mint Metaplex Core NFTs
- **Achievement awarding** — Backend signs `award_achievement` after condition verification
- **XP rewards** — Backend signs `reward_xp` for daily bonuses and streak rewards

## Architecture

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (on-chain interaction)
│   ├── middleware/       # Auth, rate limiting, validation
│   └── config/          # Environment and program configuration
├── package.json
└── README.md
```

## Integration Points

The backend acts as the **backend signer** referenced in the on-chain program's `Config` account. It holds the private key that matches `Config.backend_signer` and co-signs instructions that require platform authority.

### Key Endpoints (planned)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/lessons/:id/complete` | POST | Validate + sign lesson completion tx |
| `POST /api/courses/:id/finalize` | POST | Validate + sign course finalization tx |
| `POST /api/credentials/issue` | POST | Sign credential issuance tx |
| `POST /api/achievements/award` | POST | Sign achievement award tx |
| `POST /api/xp/reward` | POST | Sign XP reward tx (daily bonus, streaks) |
| `GET /api/leaderboard` | GET | Indexed XP leaderboard (cached) |

### Transaction Flow

1. Frontend prepares the unsigned transaction with all accounts
2. Frontend sends the transaction to the backend
3. Backend validates the request (auth, business rules)
4. Backend partially signs with the backend signer keypair
5. Backend returns the partially signed transaction
6. Frontend adds the learner's signature (wallet)
7. Frontend submits the fully signed transaction to Solana

See [docs/INTEGRATION.md](../docs/INTEGRATION.md) for full instruction parameters, PDA derivation, and event signatures.

## Status

> **Not yet implemented.** The frontend currently stubs backend-signed operations with clean service interfaces. When this backend is built, swap the stub implementations in `app/src/services/` to call these API endpoints.

## Getting Started

```bash
# Future setup
cd backend
npm install
cp .env.example .env  # Configure backend signer keypair, RPC URL, etc.
npm run dev
```

## Environment Variables (planned)

| Variable | Description |
|----------|-------------|
| `BACKEND_SIGNER_KEYPAIR` | Base58 or path to the backend signer keypair |
| `SOLANA_RPC_URL` | Solana RPC endpoint (Helius recommended) |
| `PROGRAM_ID` | Superteam Academy program ID |
| `XP_MINT` | XP Token-2022 mint address |
| `DATABASE_URL` | PostgreSQL connection string (for caching/indexing) |
| `JWT_SECRET` | Secret for auth token validation |

## Tech Stack (planned)

- **Runtime**: Node.js or Bun
- **Framework**: Express, Fastify, or Hono
- **Solana**: `@solana/web3.js`, `@coral-xyz/anchor`
- **Database**: PostgreSQL (via Supabase or standalone)
- **Caching**: Redis (leaderboard, rate limiting)
