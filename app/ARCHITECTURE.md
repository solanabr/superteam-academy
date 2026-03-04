## Superteam Academy Architecture

This document describes the current architecture of the `app/` Next.js application and how it connects to the on-chain Anchor program, database, and CMS. It is aligned with the PRD and the production implementation directives.

---

## 1. High-Level Layers and Data Flow

### Layers

- **UI layer**  
  - Next.js App Router (`src/app`), React server and client components.
  - Tailwind CSS + shadcn UI.
  - `next-intl` for localization.

- **Client data layer**  
  - `useAPI` hooks + TanStack Query for data fetching and caching.
  - Zustand stores for global client state (auth, wallet, editor, UI).

- **API layer**  
  - Next.js route handlers under `src/app/api/**`.
  - Auth and role guards, Zod validation, rate-limit hooks (to be added).

- **Service layer**  
  - Pure TypeScript modules under `src/lib/services/**` encapsulating business logic:
    - Blockchain, streaks, challenges, achievements, leaderboard, transactions, courses.

- **Persistence layer**  
  - Drizzle ORM + Neon Postgres (`src/lib/db/**`).

- **On-chain layer**  
  - Anchor program in `onchain-academy/` (separate workspace), deployed on Solana devnet.

### Data Flow (Non-Negotiable)

All privileged data and mutations follow this path:

`React UI → useAPI (TanStack Query) → fetch config → /api routes → service layer → DB / blockchain / Sanity`

Never:

- UI → blockchain directly
- UI importing `blockchain-service.ts`
- Client trusting XP or challenge results without server verification

All JSON responses from the API conform to:

```jsonc
{
  "success": true | false,
  "status": "ok" | "created" | "error" | "unauthorized" | "forbidden" | "not_found" | "validation_error",
  "message": "human-readable string",
  "data": any | null
}
```

The frontend reads only the `data` field (plus errors when needed).

---

## 2. Core Foundation

### 2.1 API Contract & Fetch

- **`src/lib/types/api-contract.ts`**
  - Defines `ApiStatus`, `ApiResponse<T>` and `status_from_http(status_code)`.

- **`src/lib/api/response.ts`**
  - `api_success<T>(data, message, status_code?)` – wraps `NextResponse.json` with contract.
  - `api_error(message, status_code?)` – standardized error shape.
  - Deprecated `json_ok/json_error` delegate to the new helpers.

- **`src/lib/api/config.ts`**
  - Centralized fetch helpers for the client:
    - `getData`, `postData`, `patchData`, `updateData`, `deleteData`, `multipartData`.
  - Handles base URL, credentials, and contract parsing.

- **`src/lib/api/useAPI.ts`**
  - `useAPIQuery<T>({ queryKey, path, ... })` – wraps `getData` with TanStack Query.
  - `useAPIMutation<T>(method, path)` – wraps POST/PATCH/DELETE with unified error handling.

- **`src/lib/api/guard.ts`**
  - `require_auth()` – fetches session from cookies, returns `{ session, response }`.
  - `require_admin_role()` – enforces `admin | super_admin` via role guard.

### 2.2 Auth & Session

- **`src/lib/types/auth.ts`**
  - `UserRole = "user" | "admin" | "super_admin"`.
  - `SessionPayload` (`sub`, `email`, `role`, `iat`, `exp`).

- **`src/lib/auth/jwt.ts`**
  - JWT creation and verification (`jose`), server-only.

- **`src/lib/auth/session.ts`**
  - Reads HTTP-only JWT cookie.
  - Returns `SessionPayload` or `null` for guards.

- **`src/lib/auth/role-guard.ts`**
  - `has_role`, `require_admin` helpers.

Auth-related APIs live under `src/app/api/auth/*` and use Zod + guards (stubs for some routes, but structurally correct).

---

## 3. Database Layer (Drizzle + Neon)

- **`src/lib/db/index.ts`**
  - Lazy Drizzle client over Neon HTTP (`@neondatabase/serverless` + `drizzle-orm/neon-http`).
  - No DB connection at build; throws on first runtime use if `DATABASE_URL` is missing.

- **`src/lib/db/schema/*.ts`**
  - Tables matching PRD:
    - Auth & identity: `users`, `oauth_accounts`, `wallets`, `sessions`.
    - Streaks: `user_streaks`, `streak_events`.
    - Progress: `lesson_progress`, `course_enrollments` (mirror of on-chain enrollment).
    - Challenges: `challenges`, `user_challenge_attempts`.
    - XP & logs: `xp_snapshots`, `admin_logs`.
    - Achievements: `achievements`, `achievement_awards`.
  - All tables have:
    - Foreign keys with proper `onDelete` behavior.
    - Indexes for query patterns.
    - Timestamps and unique constraints per PRD.

- **`src/lib/db/schema/index.ts`**
  - Barrel: exports all tables for use in services and APIs.

---

## 4. Blockchain Integration

### 4.1 Environment & Connection

- `NEXT_PUBLIC_PROGRAM_ID` – Anchor program ID (`onchain_academy`).
- `NEXT_PUBLIC_XP_MINT` – Token‑2022 XP mint.
- `NEXT_PUBLIC_SOLANA_RPC` – devnet RPC URL (Helius or Solana devnet).
- `BACKEND_SIGNER_PRIVATE_KEY` – JSON array private key for backend signer.

### 4.2 `src/lib/services/blockchain-service.ts`

- Maintains a shared `Connection` (`confirmed` commitment).
- **Read helpers**:
  - `get_xp_balance(wallet_public_key)`:
    - Derives Token‑2022 ATA for XP mint via `getAssociatedTokenAddress` + `TOKEN_2022_PROGRAM_ID`.
    - Reads integer balance and returns `{ total_xp, level }` via `level_from_xp`.
  - `get_enrollment_status(wallet_public_key, course_id)`:
    - Derives Enrollment PDA `[ "enrollment", course_id, wallet ]` and checks if account exists.
  - `fetch_credential_nfts`, `fetch_achievement_nfts`:
    - Stubs for Helius DAS NFT lookups.
- **Write helper stub**:
  - `reward_xp_onchain({ wallet_public_key, amount, reason, challenge_id? })`:
    - To be implemented with Anchor client calling `reward_xp` on the on-chain program.

Backend signer is derived from `BACKEND_SIGNER_PRIVATE_KEY` via `get_backend_signer_keypair()`.

---

## 5. Service Layer

### 5.1 Streaks

- **`src/lib/services/streak-service.ts`**
  - `record_streak_event(user_id, event_type, occurred_at)`:
    - Maintains `user_streaks`:
      - UTC-day aware `current_streak_days`, `longest_streak_days`, `last_activity_at`.
    - Inserts `streak_events` (`lesson_complete` or `challenge_complete`).

### 5.2 Challenges

- **Schema**: `challenges`, `user_challenge_attempts`.

- **`src/lib/services/challenge-runner.ts`**
  - For JS/TS challenges:
    - Expects `solution_code` defining a `solve` function.
    - For each test case (`input`, `expected` JSON strings):
      - Parses input, calls `solve`, compares JSON‑stringified result.
  - Returns:
    - `{ passed: boolean, details: { index, input, expected, actual }[] }`.

### 5.3 Achievements

- **Schema**: `achievements`, `achievement_awards`.

- **`src/lib/services/achievement-service.ts`**
  - `award_achievement({ admin_id, user_id, achievement_id })`:
    - Validates user and wallet exist.
    - Loads `achievement` by `achievement_id` and enforces:
      - `is_active`.
      - `current_supply < supply_cap` (when cap set).
    - Checks `achievement_awards` to prevent duplicates.
    - Calls `reward_xp_onchain` for XP (stubbed Anchor integration).
    - Inserts `achievement_awards` and logs to `admin_logs` with action `award_achievement`.

### 5.4 Leaderboard

- **Schema**: `xp_snapshots`.

- **`src/lib/services/leaderboard-service.ts`**
  - `get_leaderboard(query)`:
    - Reads `xp_snapshots` joined with `users` + `wallets`, sorted by XP and `snapshot_at`.
  - `refresh_leaderboard_from_chain()`:
    - Iterates all `wallets`, calls `get_xp_balance` and writes new `xp_snapshots` rows.
    - Future: replace with Helius DAS-based snapshot.

### 5.5 Transactions

- **`src/lib/services/transaction-log-service.ts`**
  - `log_transaction({ user_id, wallet_public_key, tx_signature, instruction_type, success, error? })`:
    - Records transaction metadata into `admin_logs` with `action: "tx_log"`.

### 5.6 Courses (CMS)

- **`src/lib/services/course-service.ts`**
  - Defines types: `Course`, `Module`, `Lesson`, `ChallengeMeta`.
  - `get_courses`, `get_course_by_slug`, `get_lessons`, `get_challenges`:
    - Currently stubs; to be implemented via Sanity GROQ.

---

## 6. API Layer

All routes under `src/app/api/**` follow this pattern:

- Call `require_auth` / `require_admin_role` as needed.
- Validate input with Zod validators from `src/lib/validators/**`.
- Delegate to service layer.
- Return `ApiResponse<T>` via `api_success`/`api_error`.

### 6.1 Lessons

- **`src/app/api/lesson/complete/route.ts`** (`POST`):
  - Auth + wallet required.
  - Body validated by `lesson_complete_body_schema` (`course_slug`, `lesson_slug`).
  - Verifies on-chain enrollment via `get_enrollment_status`.
  - Upserts `lesson_progress` for `(user_id, course_slug, lesson_slug)`.
  - Calls `record_streak_event("lesson_complete")`.
  - Returns `{ completed: true }` in `data`.

### 6.2 Challenges

- **`src/app/api/challenges/[id]/submit/route.ts`** (`PATCH`):
  - Auth + wallet required.
  - Body validated by `submit_challenge_body_schema` (`solution_code`).
  - Loads challenge with soft-delete check.
  - Idempotency guard: if user already has `passed=true` attempt, returns previous XP.
  - Runs `run_challenge_tests(solution_code, challenge)` → determines `passed`.
  - If `passed` and `xp_reward > 0`, calls `reward_xp_onchain` (stub).
  - Inserts `user_challenge_attempts` row.
  - On `passed`, calls `record_streak_event("challenge_complete")`.
  - Returns `{ passed, xp_awarded }`.

### 6.3 Achievements

- **`src/app/api/achievement/award/route.ts`** (`POST`, admin-only):
  - Validates `achievement_id`, `user_id` via `award_achievement_body_schema`.
  - Calls `award_achievement` service.
  - Returns `{ ok: true, tx_signature }`.

- **`src/app/api/achievement/user/route.ts`** (`GET`):
  - Auth-required.
  - Joins `achievement_awards` + `achievements` for the current user.
  - Returns `achievements[]` with metadata and `awarded_at`.

### 6.4 Leaderboard

- **`src/app/api/leaderboard/route.ts`** (`GET`):
  - Validates `limit`, `offset` via `leaderboard_query_schema`.
  - Returns `{ entries }` from `get_leaderboard`.

- **`src/app/api/admin/leaderboard/refresh/route.ts`** (`POST`, admin-only):
  - Calls `refresh_leaderboard_from_chain`.
  - Returns `{ ok: true }` or error.

### 6.5 User profile

- **`src/app/api/user/profile/route.ts`** (`GET`):
  - Auth-required.
  - Finds linked wallet (if any) and calls `get_xp_balance`.
  - Reads `user_streaks` for streak summary.
  - Returns:
    - `user_id`, `email`, `role`.
    - `wallet_public_key`.
    - `xp` `{ total_xp, level }`.
    - `streak` (current/longest/last_activity_at).

### 6.6 Certificates

- **`src/app/api/certificates/[id]/generate/route.ts`** (`GET`):
  - Auth-required.
  - Currently returns `501` with TODO to:
    - Verify course completion and credential NFT.
    - Generate PNG certificate with QR code to explorer.

---

## 7. Client Stores and Hooks

### 7.1 Zustand Stores

- `src/store/auth-store.ts`
  - Holds client-side session metadata; hydrated from `/api/auth/session` + `/api/user/profile`.
- `src/store/wallet-store.ts`
  - Mirrors Solana wallet adapter state (public key, connection).
- `src/store/editor-store.ts`
  - Controls `is_open` for Monaco editor and `toggle` action.
- `src/store/challenge-store.ts`, `src/store/ui-store.ts`
  - Additional cross-page UI state (filters, open panels, etc.).

### 7.2 Hooks

- `src/lib/hooks/use-debounce.ts`
  - `useDebounce(value, delay_ms)` – used for search/filter debouncing in list UIs.

---

## 8. Frontend Pages and UI

### 8.1 Challenges UI

- **List**: `src/app/[locale]/(web)/challenges/page.tsx`
  - Uses `useAPIQuery` to fetch `/api/challenges`.
  - TanStack Table for:
    - Search.
    - Filter by difficulty.
    - Sort (+ eventual pagination support).

- **Detail**: `src/app/[locale]/(web)/challenges/[id]/challenge-detail-view.tsx`
  - Loads challenge via `useAPIQuery` from `/api/challenges/[id]`.
  - Displays title, description, difficulty, XP reward (localized).
  - Toggle Monaco editor via `useEditorStore`.
  - `CodeEditor` used for solution code with starter code preset.
  - Submit button calls `/api/challenges/[id]/submit` via `useAPIMutation`.

### 8.2 Lessons UI

- **`src/app/[locale]/(web)/courses/[slug]/lessons/[id]/lesson-view.tsx`**
  - Breadcrumb navigation, localized labels.
  - Placeholder for CMS-based lesson content.
  - “Complete lesson” button wired to `/api/lesson/complete` via `useAPIMutation`.
  - Editor section using `CodeEditor` controlled by `useEditorStore`.

### 8.3 Dashboard & Profile

- Dashboard page (under `/(user)` segment) uses `/api/user/profile` to display:
  - User identity and role.
  - XP, level.
  - Streak summary.
  - Ready to incorporate achievements and leaderboard rank.

### 8.4 Leaderboard

- `/[locale]/(user)/leaderboard`:
  - Consumes `/api/leaderboard` via `useAPIQuery`.
  - Renders a table of users and XP; filters/timeframes to be expanded.

All UI follows:

- Flat design.
- `rounded-none` for inputs/buttons.
- Localization via `next-intl` messages.

---

## 9. Remaining Integrations (Non-UI)

The following are intentionally left as integration points, not yet fully implemented:

- Anchor client write helpers in `blockchain-service.ts`:
  - `reward_xp_onchain`, `complete_lesson_onchain`, `finalize_course_onchain`, `issue_credential_onchain`, `award_achievement_onchain`.
- Helius DAS-based leaderboard refresh logic in `leaderboard-service.ts`.
- PNG certificate + QR generation in `/api/certificates/[id]/generate`.
- Central rate limiting utility, applied to high impact routes.
- Wiring `log_transaction` into all on-chain write flows.

The existing structure and abstractions are designed so these can be filled in without changing the architecture.

