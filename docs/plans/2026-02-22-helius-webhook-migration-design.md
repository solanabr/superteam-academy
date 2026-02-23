# Helius Webhook Migration Design

> Replace dual-write (on-chain + Supabase) architecture with event-driven Helius webhooks.

**Date**: 2026-02-22
**Status**: Draft

---

## Problem

The current architecture dual-writes every operation: API routes call on-chain instructions, then inline-write to 5-7 Supabase tables. This creates:

- **~743-line orchestrator** in `/api/lessons/complete` that must write to both layers
- **Sync drift** when on-chain succeeds but Supabase fails
- **Double idempotency** logic in both layers
- **Dedicated sync routes** (`/api/enrollment/sync`) just to mirror state
- **Retry queue** (`pending_onchain_actions`) to recover from failed DB writes

## Solution

**Write on-chain only. Let Helius webhooks populate Supabase.**

```
WRITE PATH (thin API routes)
  User → API Route → On-Chain TX → return signature
  (~80 lines each, no Supabase writes)

SYNC PATH (Helius webhook)
  Helius detects TX → POST /api/webhooks/helius
    → Decode Anchor events from raw TX logs
    → Route by event type → Supabase writes

READ PATH (unchanged)
  Dashboard/Profile → Supabase queries (fast)
  Leaderboard → Supabase get_leaderboard() RPC
```

## Decisions

| Decision               | Choice                             | Rationale                                                         |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Webhook type           | Raw (not enhanced)                 | Enhanced doesn't parse custom Anchor events                       |
| Achievement detection  | Webhook handler                    | Fully event-driven; webhook has backend signer                    |
| Streak computation     | Existing `award_xp()` SQL function | Webhook calls it; streak logic stays in SQL                       |
| Webhook deployment     | Next.js API route                  | Shares env vars, Supabase client, Vercel deployment               |
| Frontend notifications | Supabase Realtime                  | Subscribe to table changes via WebSocket                          |
| DAS API scope          | Resync endpoint only               | Migration + disaster recovery; page verification later            |
| Backend signer access  | Webhook handler has signer         | Required for finalize_course, issue_credential, award_achievement |

## Architecture

### Helius Webhook Configuration

```json
{
  "webhookURL": "https://<app-url>/api/webhooks/helius",
  "transactionTypes": ["ANY"],
  "accountAddresses": ["<ACADEMY_PROGRAM_ID>"],
  "webhookType": "raw",
  "authHeader": "Bearer <HELIUS_WEBHOOK_SECRET>",
  "txnStatus": "success"
}
```

- Raw webhook watching the Academy program address
- Only successful TXs (failed TXs didn't change state)
- Auth header validated by webhook endpoint to reject spoofed requests

### Event Decoder

Anchor events are emitted as base64-encoded data in program log messages (`Program data: <base64>`). The handler decodes them using the IDL + `BorshEventCoder`.

One transaction can emit multiple events. Each is decoded and processed independently.

### Event Router

```
POST /api/webhooks/helius
  │
  ├─ Validate authHeader
  ├─ Parse raw TX → extract program logs → decode Anchor events
  │
  ├─ LessonCompleted
  │   ├─ Resolve user_id from learner wallet
  │   ├─ Resolve lesson_id from course PDA + lesson_index (via Sanity)
  │   ├─ Upsert user_progress
  │   ├─ Call award_xp(user_id, xp_earned, reason, tx_sig)
  │   ├─ Check all lessons complete → finalize_course on-chain
  │   │   └─ Failure → queue in pending_onchain_actions
  │   └─ Check achievement eligibility → award_achievement on-chain
  │       └─ Failure → queue in pending_onchain_actions
  │
  ├─ Enrolled
  │   ├─ Resolve user_id from learner wallet
  │   └─ Upsert enrollments
  │
  ├─ CourseFinalized
  │   ├─ Update enrollments.completed_at
  │   ├─ Call award_xp() for bonus XP
  │   └─ Call issue_credential on-chain
  │       └─ Failure → queue
  │
  ├─ CredentialIssued
  │   ├─ Insert nft_metadata (Metaplex JSON)
  │   └─ Insert certificates
  │
  ├─ AchievementAwarded
  │   └─ Call unlock_achievement(user_id, achievement_id, tx_sig, asset)
  │
  ├─ EnrollmentClosed
  │   └─ Delete from enrollments
  │
  └─ Others (CourseCreated, ConfigUpdated, MinterRegistered, etc.)
      └─ Log only (admin events, no user-facing Supabase action)
```

### Program Events Reference

| Event                        | Instruction                   | Key Fields                                                            | Webhook Action                                      |
| ---------------------------- | ----------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| `LessonCompleted`            | `complete_lesson`             | learner, course, lesson_index, xp_earned, timestamp                   | Upsert progress, award XP, check achievements       |
| `Enrolled`                   | `enroll`                      | learner, course, course_version, timestamp                            | Upsert enrollment                                   |
| `CourseFinalized`            | `finalize_course`             | learner, course, total_xp, bonus_xp, creator, creator_xp, timestamp   | Update completion, award bonus XP, issue credential |
| `EnrollmentClosed`           | `close_enrollment`            | learner, course, completed, rent_reclaimed, timestamp                 | Delete enrollment                                   |
| `CredentialIssued`           | `issue_credential`            | learner, track_id, credential_asset, current_level, timestamp         | Insert certificate + metadata                       |
| `CredentialUpgraded`         | `upgrade_credential`          | learner, track_id, credential_asset, current_level, timestamp         | Update certificate                                  |
| `AchievementAwarded`         | `award_achievement`           | achievement_id, recipient, asset, xp_reward, timestamp                | Unlock achievement                                  |
| `XpRewarded`                 | `reward_xp`                   | minter, recipient, amount, memo, timestamp                            | Award XP (generic)                                  |
| `CourseCreated`              | `create_course`               | course, course_id, creator, track_id, track_level, timestamp          | Log only                                            |
| `CourseUpdated`              | `update_course`               | course, version, timestamp                                            | Log only                                            |
| `ConfigUpdated`              | `update_config`               | field, timestamp                                                      | Log only                                            |
| `MinterRegistered`           | `register_minter`             | minter, label, max_xp_per_call, timestamp                             | Log only                                            |
| `MinterRevoked`              | `revoke_minter`               | minter, total_xp_minted, timestamp                                    | Log only                                            |
| `AchievementTypeCreated`     | `create_achievement_type`     | achievement_id, collection, creator, max_supply, xp_reward, timestamp | Log only                                            |
| `AchievementTypeDeactivated` | `deactivate_achievement_type` | achievement_id, timestamp                                             | Log only                                            |

### Wallet → user_id Resolution

Events contain wallet Pubkeys. Supabase uses UUIDs. Resolution:

```sql
SELECT id FROM profiles WHERE wallet_address = $1
```

Always finds a match because users must link a wallet before any on-chain interaction. If no match (someone called the program manually), log warning and skip.

### Course PDA → course_id Resolution

Events contain course PDA Pubkeys, not string `course_id`. Resolved by fetching the on-chain Course account and reading its `course_id` field. Cached per webhook invocation.

### Idempotency

Helius may retry delivery. All writes are safe to repeat:

| Table               | Mechanism                                                                       |
| ------------------- | ------------------------------------------------------------------------------- |
| `user_progress`     | `UPSERT ON CONFLICT (user_id, lesson_id)`                                       |
| `enrollments`       | `UPSERT ON CONFLICT (user_id, course_id)`                                       |
| `xp_transactions`   | `ON CONFLICT (user_id, idempotency_key) DO NOTHING` — key = `tx_sig:event_name` |
| `user_achievements` | `ON CONFLICT (user_id, achievement_id) DO NOTHING`                              |
| `certificates`      | `ON CONFLICT (user_id, course_id) DO NOTHING`                                   |

No schema changes needed — existing constraints already support this.

## Failure Model

### On-Chain TX Fails (API Route)

User sees error, retries manually. Nothing to queue — nothing happened on-chain.

### Webhook Handler Fails (Supabase Write)

Helius retries delivery automatically. Handler is idempotent — retries are safe. No queue needed.

### Backend-Signed On-Chain TX Fails (Inside Webhook)

Queue in `pending_onchain_actions` for retry on next login or via cron. Applies to:

- `finalize_course` — triggered by `LessonCompleted` when all lessons done
- `issue_credential` — triggered by `CourseFinalized`
- `award_achievement` — triggered by eligibility check after `LessonCompleted`

These are "things the system owes the user" — backend-signed TXs that should have happened but failed (RPC down, signer issues, etc.).

### Webhook Chain

Some events trigger on-chain calls that emit new events:

```
LessonCompleted (webhook #1)
  → finalize_course on-chain
    → CourseFinalized (webhook #2)
      → issue_credential on-chain
        → CredentialIssued (webhook #3)
          → mirror to Supabase
```

Each hop is independent and self-healing. If webhook #2 fails, Helius retries it. If `issue_credential` fails, it's queued.

## Frontend Notifications

### Supabase Realtime

Replace synchronous API response data with WebSocket subscriptions:

```
useGamificationEvents(userId)
  ├─ Subscribe to user_xp (UPDATE)
  │   → old.level !== new.level → level-up overlay
  │   → xp diff → XP popup
  │
  ├─ Subscribe to user_achievements (INSERT)
  │   → achievement popup
  │
  ├─ Subscribe to certificates (INSERT)
  │   → certificate popup
  │
  └─ Subscribe to xp_transactions (INSERT)
      → XP toast with amount + reason
```

### UX Change

Before: Click "Complete" → wait 3-8s → all popups fire at once.
After: Click "Complete" → 1s "TX confirmed" → 2s XP popup → 3s level-up → 4s achievement.

Progressive reveal. Each reward cascades naturally.

### Navigate-Away Handling

If user leaves before webhook processes: on next page load, query for events since `last_seen_at` and show missed popups.

### Supabase Realtime Prerequisites

Enable Realtime on these tables (off by default):

- `user_xp`
- `xp_transactions`
- `user_achievements`
- `certificates`

RLS policies already gate subscriptions to the user's own rows.

## DAS API — Resync Endpoint

Admin endpoint to rebuild Supabase from on-chain state:

```
POST /api/admin/resync
  ├─ Input: wallet_address (or "all" for full rebuild)
  ├─ DAS: getAssetsByOwner(wallet)
  │   → Filter by achievement collections → rebuild user_achievements
  │   → Filter by track collections → rebuild certificates
  ├─ RPC: getTokenAccountsByOwner(wallet, xpMint)
  │   → Read Token-2022 ATA balance → update user_xp.total_xp
  ├─ RPC: getProgramAccounts (Enrollment filter)
  │   → Rebuild enrollments + user_progress from bitmaps
  └─ Output: { synced: true, achievements: N, certificates: N, xp: N }
```

Used for:

1. **Migration**: Bootstrap Supabase from current on-chain state when switching from dual-write to webhooks
2. **Disaster recovery**: If Supabase data is lost or corrupted
3. **Audit**: Verify Supabase matches on-chain truth

## Environment Variables

New variables needed:

```bash
# Helius
HELIUS_API_KEY=               # For RPC, DAS API, webhook management
HELIUS_WEBHOOK_SECRET=        # Validates webhook auth header
NEXT_PUBLIC_SOLANA_RPC_URL=   # Switch to Helius RPC URL
```

## File Changes

### New Files

| File                               | Purpose                                      |
| ---------------------------------- | -------------------------------------------- |
| `app/api/webhooks/helius/route.ts` | Webhook endpoint — auth, decode, route       |
| `lib/helius/event-decoder.ts`      | Anchor event decoder (IDL + BorshEventCoder) |
| `lib/helius/event-handlers.ts`     | Per-event handler functions                  |
| `lib/helius/types.ts`              | TypeScript types for webhook payloads        |
| `lib/helius/webhook-config.ts`     | Setup helper (register/update webhook)       |
| `hooks/use-gamification-events.ts` | Supabase Realtime subscription hook          |
| `app/api/admin/resync/route.ts`    | DAS-powered resync endpoint                  |

### Modified Files

| File                                                | Change                                                 |
| --------------------------------------------------- | ------------------------------------------------------ |
| `app/api/lessons/complete/route.ts`                 | Strip to ~80 lines (on-chain only, no Supabase writes) |
| `hooks/use-on-chain-enroll.ts`                      | Remove `/api/enrollment/sync` call                     |
| `hooks/use-on-chain-unenroll.ts`                    | Remove sync call                                       |
| `components/gamification/gamification-overlays.tsx` | Switch from API response to Supabase Realtime triggers |
| `components/gamification/xp-popup.tsx`              | Trigger from Realtime event                            |
| `components/gamification/achievement-popup.tsx`     | Trigger from Realtime event                            |
| `components/gamification/certificate-popup.tsx`     | Trigger from Realtime event                            |
| `components/gamification/level-up-overlay.tsx`      | Trigger from Realtime event                            |
| `.env.example`                                      | Add HELIUS_API_KEY, HELIUS_WEBHOOK_SECRET              |

### Deleted Files

| File                                           | Reason                                                       |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `app/api/enrollment/sync/route.ts`             | Replaced by webhook Enrolled/EnrollmentClosed handlers       |
| `app/api/credentials/issue/route.ts`           | Replaced by webhook CourseFinalized → CredentialIssued chain |
| `app/api/courses/[courseId]/finalize/route.ts` | Replaced by webhook auto-finalization                        |

### No Schema Changes

All Supabase tables, constraints, RLS policies, and SECURITY DEFINER functions remain unchanged. The webhook handler calls the same `award_xp()` and `unlock_achievement()` functions via `createAdminClient()`.

## Migration Strategy

1. Deploy webhook handler alongside existing dual-write routes (both active)
2. Run resync endpoint to verify webhook produces same Supabase state as dual-writes
3. Once verified, strip Supabase writes from API routes (switch to on-chain only)
4. Delete dead sync routes
5. Switch frontend to Supabase Realtime for gamification popups

## Out of Scope

- DAS API verification on certificates/achievements pages (fast follow)
- Helius gRPC streaming (overkill for current scale)
- Historical backfill of xp_transactions from on-chain TX history
- Webhook dashboard/monitoring UI
