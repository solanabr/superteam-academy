# Superteam Academy Backend

Standalone server for backend-signed on-chain transactions (lesson completion, course finalization, credential issuance).

## Code Structure

The backend is split by concern:

- `src/index.ts` — Hono server bootstrap, middleware, route mounting
- `src/routes/academy.ts` — route composition
- `src/academy/routes/*.ts` — domain handlers (`course`, `credential`, `minter`, `achievement`, `config`)
- `src/academy/shared.ts` — shared Solana helpers (program access, config/account fetchers, ATA setup, tx sending)
- `src/lib/errors.ts` — consistent API error mapping
- `src/lib/validation.ts` — request body/public key validation
- `src/program.ts` — keypair parsing + cached Anchor program clients

## Setup

```bash
pnpm install
pnpm copy-idl   # Copy IDL from onchain-academy
```

Create `.env` from `.env.example`:

```env
SOLANA_RPC=https://api.devnet.solana.com
BACKEND_API_TOKEN=change-me
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ACADEMY_AUTHORITY_KEYPAIR=[64 numbers]   # For create-course
ACADEMY_BACKEND_SIGNER_KEYPAIR=[64 numbers]  # For complete-lesson, finalize-course
```

Use the same keypairs as the on-chain program (wallets/signer.json for devnet).

## Run

```bash
pnpm dev   # Development (tsx watch)
pnpm build && pnpm start   # Production
```

Default port: 3001. Override with `PORT`.

## API

All `/academy/*` endpoints require API auth:

- `Authorization: Bearer <BACKEND_API_TOKEN>` or
- `X-API-Key: <BACKEND_API_TOKEN>`

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /academy/create-course | Create course (authority) |
| POST | /academy/update-config | Rotate backend signer (authority) |
| POST | /academy/update-course | Update course (authority) |
| POST | /academy/complete-lesson | Complete lesson (backend signer) |
| POST | /academy/finalize-course | Finalize course (backend signer) |
| POST | /academy/issue-credential | Issue credential NFT (backend signer) |
| POST | /academy/upgrade-credential | Upgrade credential (backend signer) |
| POST | /academy/register-minter | Register minter (authority) |
| POST | /academy/revoke-minter | Revoke minter (authority) |
| POST | /academy/reward-xp | Reward XP (backend signer as minter) |
| POST | /academy/create-achievement-type | Create achievement type (authority) |
| POST | /academy/award-achievement | Award achievement (backend signer) |
| POST | /academy/deactivate-achievement-type | Deactivate achievement type (authority) |

### Request bodies

**create-course**
```json
{ "courseId": "test-course-1", "lessonCount": 3, "xpPerLesson": 100, "creator": "..." }
```

**complete-lesson**
```json
{ "courseId": "test-course-1", "learner": "<pubkey>", "lessonIndex": 0 }
```

**finalize-course**
```json
{ "courseId": "test-course-1", "learner": "<pubkey>" }
```
