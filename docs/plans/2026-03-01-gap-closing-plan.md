# Gap-Closing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all remaining competitive gaps — 100 coding challenges, Hindi locale, i18n expansion to 500+ keys.

**Architecture:** Challenges live in `app/src/lib/challenges/` as typed TypeScript files (5 category files × 20 challenges each). Hindi locale (`hi.json`) slots into next-intl's existing dynamic import pattern. i18n expansion adds ~150 new keys across new sections (admin, creator, challenges page, achievements, errors, a11y, notifications).

**Tech Stack:** TypeScript, next-intl, Vitest

---

### Task 1: Create Challenge Types and Index

**Files:**
- Create: `app/src/lib/challenges/types.ts`
- Create: `app/src/lib/challenges/index.ts`

**Step 1: Create `types.ts`**

```typescript
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ChallengeCategory = 'solana-fundamentals' | 'defi' | 'nft-metaplex' | 'security' | 'token-extensions';
export type ChallengeLanguage = 'rust' | 'typescript';

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  category: ChallengeCategory;
  language: ChallengeLanguage;
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  hints: [string, string, string];
  xpReward: number;
  estimatedMinutes: number;
}
```

**Step 2: Create `index.ts`**

```typescript
import type { CodingChallenge, ChallengeCategory, ChallengeDifficulty } from './types';
import { solanaFundamentalsChallenges } from './solana-fundamentals';
import { defiChallenges } from './defi';
import { nftMetaplexChallenges } from './nft-metaplex';
import { securityChallenges } from './security';
import { tokenExtensionsChallenges } from './token-extensions';

export type { CodingChallenge, ChallengeCategory, ChallengeDifficulty, TestCase, ChallengeLanguage } from './types';

const allChallenges: CodingChallenge[] = [
  ...solanaFundamentalsChallenges,
  ...defiChallenges,
  ...nftMetaplexChallenges,
  ...securityChallenges,
  ...tokenExtensionsChallenges,
];

export function getAllChallenges(): CodingChallenge[] {
  return allChallenges;
}

export function getChallengesByCategory(category: ChallengeCategory): CodingChallenge[] {
  return allChallenges.filter((c) => c.category === category);
}

export function getChallengesByDifficulty(difficulty: ChallengeDifficulty): CodingChallenge[] {
  return allChallenges.filter((c) => c.difficulty === difficulty);
}

export function getChallengeById(id: string): CodingChallenge | undefined {
  return allChallenges.find((c) => c.id === id);
}
```

**Step 3: Verify TypeScript compiles (will have import errors until category files exist — that's expected)**

Run: `cd app && pnpm tsc --noEmit 2>&1 | head -20`
Expected: Import errors for the 5 category files (not yet created)

**Step 4: Commit**

```bash
git add app/src/lib/challenges/types.ts app/src/lib/challenges/index.ts
git commit -m "feat: add challenge types and index module"
```

---

### Task 2: Create Solana Fundamentals Challenges (20)

**Files:**
- Create: `app/src/lib/challenges/solana-fundamentals.ts`

**Step 1: Write 20 challenges**

Export `solanaFundamentalsChallenges: CodingChallenge[]` with 20 items:
- IDs: `sf-001` through `sf-020`
- Category: `'solana-fundamentals'`
- Difficulty mix: 8 beginner, 7 intermediate, 5 advanced
- Topics: Keypair generation, PDA derivation, transaction building, account creation, SOL transfers, system program, instruction data, serialization, blockhash handling, rent exemption, account ownership, signer verification, program derived addresses, compute budget, transaction simulation, versioned transactions, address lookup tables, cross-program invocation basics, account deserialization, event parsing
- Each challenge must have: valid starterCode, solution, 3 testCases, 3 hints
- XP rewards: beginner=50, intermediate=100, advanced=200
- Estimated minutes: beginner=10-15, intermediate=20-30, advanced=30-45

**Step 2: Verify TypeScript compiles**

Run: `cd app && pnpm tsc --noEmit 2>&1 | head -20`
Expected: Import errors for 4 remaining category files (defi, nft, security, token-extensions)

**Step 3: Commit**

```bash
git add app/src/lib/challenges/solana-fundamentals.ts
git commit -m "feat: add 20 solana fundamentals challenges"
```

---

### Task 3: Create DeFi Challenges (20)

**Files:**
- Create: `app/src/lib/challenges/defi.ts`

**Step 1: Write 20 challenges**

Export `defiChallenges: CodingChallenge[]` with 20 items:
- IDs: `defi-001` through `defi-020`
- Category: `'defi'`
- Difficulty mix: 5 beginner, 8 intermediate, 7 advanced
- Topics: Token minting, token transfers, ATA creation, swap math (constant product), liquidity pool concepts, price oracles, lending pool interest calculation, collateral ratios, flash loan detection, yield farming rewards, impermanent loss calculation, order book matching, TWAP calculation, fee structures, slippage protection, multi-hop routing, vault strategies, staking rewards, governance token distribution, protocol fee accounting
- Same structure requirements as Task 2

**Step 2: Verify TypeScript compiles**

Run: `cd app && pnpm tsc --noEmit 2>&1 | head -20`
Expected: Import errors for 3 remaining category files

**Step 3: Commit**

```bash
git add app/src/lib/challenges/defi.ts
git commit -m "feat: add 20 defi challenges"
```

---

### Task 4: Create NFT & Metaplex Challenges (20)

**Files:**
- Create: `app/src/lib/challenges/nft-metaplex.ts`

**Step 1: Write 20 challenges**

Export `nftMetaplexChallenges: CodingChallenge[]` with 20 items:
- IDs: `nft-001` through `nft-020`
- Category: `'nft-metaplex'`
- Difficulty mix: 6 beginner, 8 intermediate, 6 advanced
- Topics: Metadata structure, Metaplex Core assets, collection creation, attribute parsing, royalty enforcement, creator verification, URI generation, compressed NFTs (cNFTs), Merkle tree setup, proof verification, transfer hooks for NFTs, burning mechanics, delegate authority, freeze/thaw, update authority patterns, collection verification, trait rarity calculation, candy machine config, guard groups, NFT gating logic
- Same structure requirements as Task 2

**Step 2: Verify TypeScript compiles**

Run: `cd app && pnpm tsc --noEmit 2>&1 | head -20`
Expected: Import errors for 2 remaining category files

**Step 3: Commit**

```bash
git add app/src/lib/challenges/nft-metaplex.ts
git commit -m "feat: add 20 nft and metaplex challenges"
```

---

### Task 5: Create Security Challenges (20)

**Files:**
- Create: `app/src/lib/challenges/security.ts`

**Step 1: Write 20 challenges**

Export `securityChallenges: CodingChallenge[]` with 20 items:
- IDs: `sec-001` through `sec-020`
- Category: `'security'`
- Difficulty mix: 4 beginner, 8 intermediate, 8 advanced
- Topics: Owner check validation, signer verification, PDA seed validation, arithmetic overflow detection, reinitialization guard, closing account drain, type confusion detection, CPI privilege escalation, duplicate mutable accounts, bump seed canonicalization, authority validation patterns, rent exemption check, instruction introspection, cross-program signer verification, account data matching, deserialization attack detection, time-based attack vectors, front-running prevention, sandwich attack detection, privilege escalation via remaining accounts
- Same structure requirements as Task 2

**Step 2: Verify TypeScript compiles**

Run: `cd app && pnpm tsc --noEmit 2>&1 | head -20`
Expected: Import errors for 1 remaining category file (token-extensions)

**Step 3: Commit**

```bash
git add app/src/lib/challenges/security.ts
git commit -m "feat: add 20 security challenges"
```

---

### Task 6: Create Token Extensions Challenges (20)

**Files:**
- Create: `app/src/lib/challenges/token-extensions.ts`

**Step 1: Write 20 challenges**

Export `tokenExtensionsChallenges: CodingChallenge[]` with 20 items:
- IDs: `te-001` through `te-020`
- Category: `'token-extensions'`
- Difficulty mix: 7 beginner, 7 intermediate, 6 advanced
- Topics: Token-2022 basics, NonTransferable extension, PermanentDelegate, TransferFee configuration, TransferFee harvesting, MintCloseAuthority, DefaultAccountState, ImmutableOwner, MemoTransfer requirement, InterestBearing mint, ConfidentialTransfer basics, TransferHook setup, CPI guard, MetadataPointer, TokenMetadata extension, GroupPointer, GroupMemberPointer, token wrapping, reallocating for extensions, multi-extension mint creation
- Same structure requirements as Task 2

**Step 2: Verify all challenges compile — 0 TypeScript errors**

Run: `cd app && pnpm tsc --noEmit`
Expected: PASS (0 errors)

**Step 3: Write a quick unit test to verify challenge integrity**

Create: `app/src/lib/challenges/__tests__/challenges.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getAllChallenges, getChallengesByCategory, getChallengeById } from '../index';

describe('Challenges', () => {
  const all = getAllChallenges();

  it('should have exactly 100 challenges', () => {
    expect(all).toHaveLength(100);
  });

  it('should have unique IDs', () => {
    const ids = all.map((c) => c.id);
    expect(new Set(ids).size).toBe(100);
  });

  it('should have 20 per category', () => {
    expect(getChallengesByCategory('solana-fundamentals')).toHaveLength(20);
    expect(getChallengesByCategory('defi')).toHaveLength(20);
    expect(getChallengesByCategory('nft-metaplex')).toHaveLength(20);
    expect(getChallengesByCategory('security')).toHaveLength(20);
    expect(getChallengesByCategory('token-extensions')).toHaveLength(20);
  });

  it('should have valid difficulty distribution', () => {
    const beginner = all.filter((c) => c.difficulty === 'beginner');
    const intermediate = all.filter((c) => c.difficulty === 'intermediate');
    const advanced = all.filter((c) => c.difficulty === 'advanced');
    expect(beginner.length).toBeGreaterThanOrEqual(25);
    expect(intermediate.length).toBeGreaterThanOrEqual(30);
    expect(advanced.length).toBeGreaterThanOrEqual(25);
  });

  it('every challenge has 3 test cases and 3 hints', () => {
    for (const c of all) {
      expect(c.testCases).toHaveLength(3);
      expect(c.hints).toHaveLength(3);
    }
  });

  it('getChallengeById returns correct challenge', () => {
    const first = all[0];
    expect(getChallengeById(first.id)).toBe(first);
    expect(getChallengeById('nonexistent')).toBeUndefined();
  });
});
```

**Step 4: Run tests**

Run: `cd app && pnpm test:run`
Expected: All tests pass including new challenge tests

**Step 5: Commit**

```bash
git add app/src/lib/challenges/token-extensions.ts app/src/lib/challenges/__tests__/challenges.test.ts
git commit -m "feat: add 20 token extension challenges and challenge tests"
```

---

### Task 7: Wire Challenges into Mock Client

**Files:**
- Modify: `app/src/lib/sanity/mock-client.ts`

**Step 1: Add challenge query routing**

Import `getAllChallenges, getChallengesByCategory, getChallengeById` from `@/lib/challenges`.

Add to `resolveQuery` (before the fallback):

```typescript
// ── Challenges ────────────────────────────────────────────────────
if (query.includes('_type == "challenge"')) {
  if (query.includes('challengeId == $challengeId')) {
    const challengeId = params?.challengeId as string | undefined;
    return (challengeId ? getChallengeById(challengeId) ?? null : null) as T;
  }
  if (query.includes('category == $category')) {
    const category = params?.category as string | undefined;
    return (category ? getChallengesByCategory(category as any) : getAllChallenges()) as T;
  }
  return getAllChallenges() as T;
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd app && pnpm tsc --noEmit`
Expected: PASS

**Step 3: Run all tests**

Run: `cd app && pnpm test:run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add app/src/lib/sanity/mock-client.ts
git commit -m "feat: wire challenges into mock client"
```

---

### Task 8: Add Hindi Locale

**Files:**
- Create: `app/src/messages/hi.json`
- Modify: `app/src/i18n/routing.ts` — add `'hi'` to locales array
- Modify: `app/src/middleware.ts` — add `hi` to URL matcher pattern
- Modify: `app/src/components/layout/language-switcher.tsx` — add Hindi option

**Step 1: Create `hi.json`**

Copy structure from `en.json`. Translate all 358 keys to Hindi. Use Devanagari script.
Key examples:
- `common.connect_wallet` → `"वॉलेट कनेक्ट करें"`
- `nav.courses` → `"पाठ्यक्रम"`
- `landing.hero_title` → `"सोलाना डेवलपमेंट में महारत हासिल करें"`
- `courses.catalog_title` → `"पाठ्यक्रम सूची"`

**Step 2: Update `routing.ts`**

```typescript
// Change:
locales: ['en', 'pt', 'es'],
// To:
locales: ['en', 'pt', 'es', 'hi'],
```

**Step 3: Update `middleware.ts` matcher**

```typescript
// Change:
'/(en|pt|es)/:path*',
// To:
'/(en|pt|es|hi)/:path*',
```

**Step 4: Update `language-switcher.tsx`**

Add to `languages` array:
```typescript
{ locale: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
```

**Step 5: Verify TypeScript compiles**

Run: `cd app && pnpm tsc --noEmit`
Expected: PASS

**Step 6: Run tests**

Run: `cd app && pnpm test:run`
Expected: All tests pass

**Step 7: Commit**

```bash
git add app/src/messages/hi.json app/src/i18n/routing.ts app/src/middleware.ts app/src/components/layout/language-switcher.tsx
git commit -m "feat: add Hindi locale with full translation"
```

---

### Task 9: Expand i18n Keys to 500+

**Files:**
- Modify: `app/src/messages/en.json`
- Modify: `app/src/messages/pt.json`
- Modify: `app/src/messages/es.json`
- Modify: `app/src/messages/hi.json`

**Step 1: Add ~150 new keys across these new/expanded sections (all 4 locales)**

New sections to add:

**`admin` (30 keys):** dashboard, users, courses_management, analytics, reports, moderation, settings, roles, permissions, create_course, edit_course, delete_course, publish, unpublish, featured, user_management, ban_user, user_details, total_users, total_courses, total_xp_distributed, active_learners, completion_rate, enrollment_rate, revenue, export_report, system_health, api_status, storage_used, pending_reviews, content_moderation

**`creator` (20 keys):** dashboard, my_courses, create_new, course_builder, add_module, add_lesson, lesson_editor, preview, publish_course, draft, published, archived, course_analytics, total_enrollments, average_completion, learner_feedback, xp_earned_by_learners, edit_module, reorder_lessons, upload_content

**`challenges_page` (25 keys):** title, subtitle, all_categories, solana_fundamentals, defi, nft_metaplex, security, token_extensions, beginner, intermediate, advanced, all_difficulties, sort_newest, sort_popular, sort_difficulty, challenges_completed, total_challenges, start_challenge, resume_challenge, challenge_completed, xp_earned, time_taken, success_rate, leaderboard_rank, no_challenges

**`achievements` (20 keys):** title, subtitle, locked, unlocked, claim, claimed, progress, milestone, streak_7_title, streak_7_desc, streak_30_title, streak_30_desc, streak_100_title, streak_100_desc, first_course_title, first_course_desc, xp_1000_title, xp_1000_desc, all_challenges_title, all_challenges_desc

**`errors` (25 keys):** generic, network, timeout, unauthorized, forbidden, not_found, rate_limited, server_error, wallet_not_connected, wallet_rejected, transaction_failed, insufficient_funds, invalid_input, session_expired, maintenance_mode, try_again, contact_support, error_code, details, dismiss, report_issue, copy_error, reload_page, go_home, go_back

**`a11y` (20 keys):** skip_to_content, skip_to_nav, menu_open, menu_close, theme_toggle, language_select, notification_count, progress_bar, loading_content, search_results, pagination_page, pagination_next, pagination_prev, sort_ascending, sort_descending, filter_applied, filter_cleared, expand, collapse, external_link

**`notifications` (15 keys):** title, mark_all_read, clear_all, no_notifications, course_enrolled, course_completed, achievement_unlocked, xp_earned, streak_reminder, new_challenge, credential_issued, level_up, review_received, system_update, settings_updated

Target: 358 + 155 = 513 keys per locale.

**Step 2: Verify key count**

Run: `python3 -c "import json; d=json.load(open('app/src/messages/en.json')); print(sum(len(v) if isinstance(v,dict) else 1 for v in d.values()))"`
Expected: 513 (or similar, must be >500)

**Step 3: Verify TypeScript compiles**

Run: `cd app && pnpm tsc --noEmit`
Expected: PASS

**Step 4: Run tests**

Run: `cd app && pnpm test:run`
Expected: All tests pass

**Step 5: Commit**

```bash
git add app/src/messages/en.json app/src/messages/pt.json app/src/messages/es.json app/src/messages/hi.json
git commit -m "feat: expand i18n to 513 keys across 4 locales"
```

---

### Task 10: Update README, PR, and Verify CI

**Files:**
- Modify: `README.md`

**Step 1: Update README badges and stats**

- Tests badge: Update to reflect new test count (after challenge tests added)
- Languages badge: `Languages-4_(EN/PT/ES/HI)`
- Challenges badge: `Challenges-100`
- i18n badge: `i18n-513_keys_×_4_locales`
- Update architecture section: 100 coding challenges, 4 languages, 513 i18n keys
- Add challenges section to feature list

**Step 2: Push to main**

```bash
git push origin main
```

**Step 3: Verify CI green**

Run: `gh run list --limit 1`
Expected: All 5 jobs pass (typecheck, lint, test, build, e2e)

**Step 4: Update PR #39 body**

```bash
gh pr edit 39 --body "..."
```

Add competitive stats: 100 challenges, 4 languages (EN/PT/ES/HI), 513+ i18n keys.
