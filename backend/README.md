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

## Test

```bash
pnpm test        # Unit + route tests (vitest)
pnpm test:watch  # Watch mode
pnpm smoke       # Smoke test (requires backend running, BACKEND_API_TOKEN)
```

Smoke test runs create-course → complete-lesson → finalize-course → issue-credential. Set `SMOKE_LEARNER_PUBKEY` and `SMOKE_TRACK_COLLECTION` for full flow.

Default port: 3001. Override with `PORT`.

## Reliability

- **Structured logging**: JSON logs with `requestId`, `method`, `path`, `status`, `durationMs`. Response header `X-Request-Id` for tracing.
- **RPC timeout + retry**: Non-transaction reads (fetchConfig, fetchCourse, fetchAchievementType, getAccountInfo) use `RPC_TIMEOUT_MS` (default 15s) and `RPC_MAX_RETRIES` (default 2). Retries only on network/timeout errors.
- **Retriable vs non-retriable**: Error responses include `retriable: boolean` (4xx=false, 5xx/429=true). RPC layer retries only retriable failures.
- **Health vs readiness**:
  - `GET /health`, `GET /v1/health` — liveness (process alive)
  - `GET /ready`, `GET /v1/ready` — readiness (keypairs + RPC reachable). Returns 503 when not ready.

## Admin (API Key Generation)

Set `ADMIN_SECRET` and `ADMIN_PASSWORD` to enable admin endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | /v1/admin/login | Exchange password for JWT |
| POST | /v1/admin/generate-api-key | Generate API key (requires Bearer JWT) |

**Flow**: POST `/v1/admin/login` with `{ "password": "<ADMIN_PASSWORD>" }` → returns `{ "token": "<JWT>" }`. Use JWT as `Authorization: Bearer <token>` to call `generate-api-key` with `{ "role": "admin" | "client", "label": "optional" }`. Generated keys work for academy endpoints.

## Security Middleware

- **API auth**: Bootstrap token (BACKEND_API_TOKEN) or generated keys via `Authorization: Bearer <token>` or `X-API-Key`.
- **Rate limiting**: Per-IP in-memory (120/min public, 100/min academy). Returns 429 when exceeded.
- **Body guard**: Max body size (default 64KB), `Content-Length` required, `Content-Type: application/json` required for POST. Returns 411/413/415 on violation.
- **Malformed body**: JSON parse errors and non-object bodies return 400 (handled in validation layer).

## API

- **Versioning**: All academy endpoints use `/v1/academy/*`. Contract: `GET /v1/contract` (OpenAPI 3.0).
- All `/v1/academy/*` endpoints require API auth:

- `Authorization: Bearer <token>` or `X-API-Key: <token>`
- Token: `BACKEND_API_TOKEN` (bootstrap) or any key from `generate-api-key`

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Liveness (unversioned) |
| GET | /v1/health | Liveness (versioned) |
| GET | /ready | Readiness (keypairs + RPC) |
| GET | /v1/ready | Readiness (versioned) |
| GET | /v1/contract | OpenAPI contract (no auth) |
| POST | /v1/admin/login | Admin login (no auth; requires ADMIN_* env) |
| POST | /v1/admin/generate-api-key | Generate API key (Bearer JWT) |
| POST | /v1/academy/create-course | Create course (authority) |
| POST | /v1/academy/update-config | Rotate backend signer (authority) |
| POST | /v1/academy/update-course | Update course (authority) |
| POST | /v1/academy/complete-lesson | Complete lesson (backend signer) |
| POST | /v1/academy/finalize-course | Finalize course (backend signer) |
| POST | /v1/academy/issue-credential | Issue credential NFT (backend signer) |
| POST | /v1/academy/upgrade-credential | Upgrade credential (backend signer) |
| POST | /v1/academy/register-minter | Register minter (authority) |
| POST | /v1/academy/revoke-minter | Revoke minter (authority) |
| POST | /v1/academy/reward-xp | Reward XP (backend signer as minter) |
| POST | /v1/academy/create-achievement-type | Create achievement type (authority) |
| POST | /v1/academy/award-achievement | Award achievement (backend signer) |
| POST | /v1/academy/deactivate-achievement-type | Deactivate achievement type (authority) |

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
