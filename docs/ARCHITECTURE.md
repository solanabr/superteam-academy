# Superteam Academy — Architecture Reference

Quick-reference for developers. Full details in [SPEC.md](./SPEC.md).  
**Live Demo:** [superteam-academy-sigma.vercel.app](https://superteam-academy-sigma.vercel.app) | **Program ID:** `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`

---

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js 16 + React 19)               │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Wallet      │  │ Anchor       │  │ Helius DAS API           │ │
│  │ Adapter     │  │ Client       │  │ (credentials + XP)       │ │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────────┘ │
│         │                │                     │                 │
│  ┌──────┴────────────────┴─────────────────────┴───────────────┐ │
│  │ Features: i18n (EN/ES/PT-BR) · Dual Theme · Gamification   │ │
│  │ Monaco Code Editor · Framer Motion · Recharts · Sanity CMS │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Pages: Landing · Dashboard · Courses · Lessons · Leaderboard   │
│         Profile · Admin · Settings · Certificates · Onboarding   │
└────────┬─────────────────────┬───────────────────┬──────────────┘
         │ learner signs       │ read accounts     │ leaderboard +
         │ (enroll, close)     │ (course, enroll)  │ credential NFTs
         │                     │                   │
┌────────▼─────────────────────▼───────────────────▼──────────────┐
│                        BACKEND (API)                             │
│                                                                  │
│  Lesson validation  ──  TX builder  ──  DAS queries  ──  Queue   │
│                                                                  │
│  Holds: backend_signer (rotatable via update_config)             │
│  Also: registered MinterRole for reward_xp / award_achievement  │
└────────┬─────────────────────────────────────────────────────────┘
         │ co-signed transactions
         │
┌────────▼─────────────────────────────────────────────────────────┐
│                   SOLANA (On-Chain Program)                       │
│                                                                  │
│  Config ──┬── Course ──── Enrollment                             │
│           │                   └── Credential NFT (Metaplex Core) │
│           ├── MinterRole                                         │
│           └── AchievementType ── AchievementReceipt             │
│                                                                  │
│  XP Token (Token-2022: NonTransferable + PermanentDelegate)      │
└──────────────────────────────────────────────────────────────────┘
         │
┌────────▼─────────────────────────────────────────────────────────┐
│                       OFF-CHAIN                                  │
│                                                                  │
│  Arweave ── course content, credential metadata JSON             │
│  Helius  ── DAS API for XP balances, credential NFT queries      │
│  Squads  ── multisig for config.authority                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Account Map

### PDA Derivation

| Account | Seeds | Closeable |
|---------|-------|-----------|
| Config | `["config"]` | No |
| Course | `["course", course_id.as_bytes()]` | No |
| Enrollment | `["enrollment", course_id.as_bytes(), user.key()]` | Yes |
| MinterRole | `["minter", minter.key()]` | Yes (via revoke_minter) |
| AchievementType | `["achievement", achievement_id.as_bytes()]` | No |
| AchievementReceipt | `["achievement_receipt", achievement_id.as_bytes(), recipient.key()]` | No |
| Credential NFT | Metaplex Core asset — no PDA, keypair-based | No |

### Account Relationships

Config is the singleton root. It holds `xp_mint` (Token-2022 mint), `backend_signer`, and `authority`. Config PDA is also the update authority for all Metaplex Core track collection NFTs.

Each Course is independent. Enrollment PDAs are children of a Course × learner pair. An Enrollment stores the lesson bitmap, `completed_at` timestamp, and the `credential_asset` pubkey once issued. That pubkey is the on-chain source of truth for create-vs-upgrade decisions in `issue_credential`.

MinterRole PDAs are independent of Course. Any registered minter (including the backend signer, auto-registered at initialize) can call `reward_xp` and `award_achievement`.

AchievementType PDAs are independent. AchievementReceipt PDAs hang off AchievementType × recipient — their creation is the idempotency guard against double-awarding.

Credential NFTs are Metaplex Core assets. One exists per learner per track. It belongs to a collection (one per track), and Config PDA is that collection's update authority.

---

## Data Flow: Core Learning Loop

```
1. ENROLL
   Learner ──sign──► enroll(course_id)
   - Check: course.is_active
   - Check: prerequisite Enrollment.completed_at.is_some() (if set)
   - Init: Enrollment PDA (lesson_flags = 0, completed_at = None)
   - Emit: Enrolled

2. COMPLETE LESSON  (×N, one per lesson)
   Backend ──sign──► complete_lesson(lesson_index)
   - Check: lesson_index < course.lesson_count
   - Check: bit not already set in lesson_flags
   - Set: lesson_flags[lesson_index / 64] |= 1 << (lesson_index % 64)
   - Mint: course.xp_per_lesson → learner XP ATA (Token-2022 CPI)
   - Emit: LessonCompleted
   (Backend enforces rate limits off-chain before signing)

3. FINALIZE COURSE
   Backend ──sign──► finalize_course()
   - Check: popcount(lesson_flags) == course.lesson_count
   - Check: enrollment.completed_at.is_none()
   - Mint: floor(xp_per_lesson * lesson_count / 2) → learner (completion bonus)
   - Mint: course.creator_reward_xp → creator (if total_completions >= min_completions_for_reward)
   - Set: enrollment.completed_at = now
   - Increment: course.total_completions
   - Emit: CourseFinalized

4. ISSUE CREDENTIAL
   Backend ──sign──► issue_credential(credential_name, metadata_uri, courses_completed, total_xp)
   - Check: enrollment.completed_at.is_some()
   - If enrollment.credential_asset == None:
       - Metaplex Core createV2 CPI (PermanentFreezeDelegate + Attributes plugins)
       - Set: enrollment.credential_asset = new asset pubkey
       - Emit: CredentialIssued (credential_created = true)
   - If enrollment.credential_asset == Some(pubkey):
       - Metaplex Core updateV1 + updatePluginV1 CPI
       - Emit: CredentialIssued (credential_upgraded = true)
   (Config PDA signs as collection update authority)

5. CLOSE ENROLLMENT  (optional — reclaims rent)
   Learner ──sign──► close_enrollment()
   - If completed_at.is_some(): close freely
   - Else: require now - enrolled_at > 86400 (24h cooldown)
   - Close: Enrollment PDA, return lamports to learner
   - Emit: EnrollmentClosed
   (Credential NFT and all events remain permanently)
```

---

## Data Flow: Minter XP Rewards

```
1. REGISTER MINTER
   Authority ──sign──► register_minter(minter_pubkey, label, max_xp_per_call)
   - Init: MinterRole PDA (is_active = true, total_xp_minted = 0)
   - Emit: MinterRegistered
   (Backend signer is auto-registered during initialize)

2. REWARD XP
   Minter ──sign──► reward_xp(amount, recipient)
   - Check: minter_role.is_active
   - Check: amount > 0
   - Check: amount <= max_xp_per_call (if max > 0)
   - Mint: amount → recipient XP ATA (Token-2022 CPI)
   - Increment: minter_role.total_xp_minted
   - Emit: XpRewarded

3. REVOKE MINTER  (when no longer needed)
   Authority ──sign──► revoke_minter(minter_pubkey)
   - Close: MinterRole PDA (rent reclaimed to authority)
   - Emit: MinterRevoked
```

---

## Data Flow: Achievements

```
1. CREATE ACHIEVEMENT TYPE
   Authority ──sign──► create_achievement_type(achievement_id, name, metadata_uri, collection, max_supply, xp_reward)
   - Init: AchievementType PDA (current_supply = 0, is_active = true)
   - Emit: AchievementTypeCreated

2. AWARD ACHIEVEMENT
   Minter ──sign──► award_achievement(achievement_id, recipient)
   - Check: achievement_type.is_active
   - Check: current_supply < max_supply (if max_supply > 0)
   - Init: AchievementReceipt PDA (collision = already awarded → error)
   - Mint: Metaplex Core NFT → recipient (CPI, Config PDA signs as collection authority)
   - Mint: achievement_type.xp_reward → recipient (Token-2022 CPI)
   - Increment: achievement_type.current_supply
   - Emit: AchievementAwarded

3. DEACTIVATE ACHIEVEMENT TYPE
   Authority ──sign──► deactivate_achievement_type(achievement_id)
   - Set: achievement_type.is_active = false
   - Emit: AchievementTypeDeactivated
```

---

## Instruction → Account Matrix

R = read, W = write, I = init, C = close

| Instruction | Config | Course | Enrollment | MinterRole | AchievementType | AchievementReceipt | XP Mint | Token Accts | Credential NFT |
|-------------|--------|--------|------------|------------|-----------------|--------------------|---------|-----------  |----------------|
| initialize | W/I | | | W/I | | | W/I | | |
| update_config | W | | | | | | | | |
| create_course | R | W/I | | | | | | | |
| update_course | | W | | | | | | | |
| enroll | | R | W/I | | | | | | |
| complete_lesson | R | R | W | | | | R | W (learner) | |
| finalize_course | R | W | W | | | | R | W (learner + creator) | |
| issue_credential | R | R | W | | | | | | W |
| upgrade_credential | R | R | R | | | | | | W |
| close_enrollment | | | C | | | | | | |
| register_minter | R | | | W/I | | | | | |
| revoke_minter | R | | | C | | | | | |
| reward_xp | R | | | W | | | R | W (recipient) | |
| create_achievement_type | R | | | | W/I | | | | |
| award_achievement | R | | | W | W | W/I | R | W (recipient) | W/I |
| deactivate_achievement_type | R | | | | W | | | | |

---

## Account Sizes

| Account | Discriminator | Data | Reserved | Total | Rent |
|---------|---------------|------|----------|-------|------|
| Config | 8 B | 97 B | 8 B | 113 B | ~0.001 SOL |
| Course | 8 B | ~176 B | 8 B | 192 B | ~0.002 SOL |
| Enrollment | 8 B | ~115 B | 4 B | 127 B | ~0.001 SOL |
| MinterRole | 8 B | ~94 B | 8 B | 110 B | ~0.001 SOL |
| AchievementType | 8 B | ~322 B | 8 B | 338 B | ~0.003 SOL |
| AchievementReceipt | 8 B | ~41 B | — | 49 B | ~0.0004 SOL |
| Credential NFT | — | ~200 B (Core asset) | — | ~200 B | ~0.006 SOL |

---

## Compute Unit Budgets

| Instruction | Est. CU | Primary Cost |
|-------------|---------|--------------|
| initialize | ~50K | Config PDA init + Token-2022 mint creation + MinterRole init |
| update_config | ~5K | Field updates |
| create_course | ~15K | Course PDA init |
| update_course | ~10K | Field updates |
| enroll | ~15K | Enrollment PDA init + prerequisite check |
| complete_lesson | ~30K | Bitmap write + Token-2022 mint CPI |
| finalize_course | ~50K | Bitmap verify + 2× Token-2022 mint CPI |
| issue_credential | ~50–100K | Metaplex Core createV2 or updateV1 CPI |
| upgrade_credential | ~50–100K | Metaplex Core updateV1 + updatePluginV1 CPI |
| close_enrollment | ~5K | Account close |
| register_minter | ~10K | MinterRole PDA init |
| revoke_minter | ~5K | Account close |
| reward_xp | ~25K | Token-2022 mint CPI |
| create_achievement_type | ~15K | AchievementType PDA init |
| award_achievement | ~80K | AchievementReceipt init + Metaplex Core CPI + Token-2022 mint CPI |
| deactivate_achievement_type | ~5K | Field update |

---

## Off-Chain Dependencies

| Service | Purpose | Notes |
|---------|---------|-------|
| Helius DAS API | XP token holder indexing, leaderboard, credential NFT queries | `getTokenHolders`, `getAssetsByOwner`, `getAssetsByGroup` |
| Arweave | Immutable course content and credential metadata JSON | Content addressed via `content_tx_id` stored on Course |
| Squads | Multisig for `config.authority` | Single signer acceptable on devnet |
| AWS KMS (recommended) | Backend signer private key storage | Key never leaves KMS boundary; rotate via `update_config` |

---

## Frontend Architecture

The Next.js 16 frontend is deployed at [superteam-academy-sigma.vercel.app](https://superteam-academy-sigma.vercel.app). See [app/README.md](../app/README.md) for full frontend documentation.

### Application Routes

| Route | Description | On-Chain Data |
|---|---|---|
| `/` | Landing page with hero, stats, learning paths | None (static) |
| `/courses` | Course catalog with track filtering | Course PDAs |
| `/courses/[slug]` | Course detail with lessons | Course + Enrollment PDAs |
| `/courses/[slug]/lessons/[id]` | Lesson viewer with Monaco editor | Enrollment bitmap |
| `/dashboard` | Personal dashboard (XP ring, streaks) | Token-2022 XP balance |
| `/leaderboard` | Global XP rankings | Helius DAS API |
| `/profile/[username]` | Public user profile | Enrollment + Credential NFTs |
| `/admin` | Admin panel for course management | Course PDAs |
| `/settings` | User preferences | None (local) |
| `/certificates` | Credential NFT display | Helius DAS API |
| `/onboarding` | Skill quiz for new users | None (local) |

### Key Library Modules

| Module | Purpose | On-Chain Dependency |
|---|---|---|
| `src/lib/pda.ts` | PDA derivation (6 account types) | Program ID |
| `src/lib/xp.ts` | XP level calculations, formatting | Token-2022 ATA balance |
| `src/lib/bitmap.ts` | Lesson progress bitmap parsing | Enrollment account |
| `src/lib/helius.ts` | Helius DAS API client | Helius RPC |
| `src/lib/cms.ts` | CMS interface (Repository Pattern) | None |
| `src/lib/courses.ts` | Static course data (7 courses) | None |
| `src/lib/services.ts` | Backend service layer | API routes |

### Provider Tree

```
NextIntlProvider (i18n)
  └── ThemeProvider (light/dark)
        └── WalletProvider (Solana Wallet Adapter)
              └── Sidebar + Main Content
```

### Tech Stack

| Layer | Stack |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Framer Motion, Lucide React |
| **Web3** | Solana Wallet Adapter, @coral-xyz/anchor, @solana/web3.js |
| **i18n** | next-intl (EN, ES, PT-BR — 270+ strings per locale) |
| **CMS** | Sanity CMS (Repository Pattern — swappable) |
| **Analytics** | Google Analytics 4 |
| **Testing** | Playwright |

---

*For instruction parameter details, account field definitions, and error codes, see [SPEC.md](./SPEC.md). For frontend integration, see [INTEGRATION.md](./INTEGRATION.md). For frontend-specific architecture, see [app/README.md](../app/README.md).*
