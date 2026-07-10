# Monorepo Structure (full tree)

```
superteam-academy/
├── CLAUDE.md                    ← Root project instructions
├── docs/
│   ├── ARCHITECTURE.md          ← System architecture, data flows, service interfaces
│   ├── DEPLOYMENT.md            ← Deployment guide
│   ├── CMS_GUIDE.md             ← Sanity content management
│   ├── CUSTOMIZATION.md         ← Theming and customization
│   ├── ADMIN.md                 ← Admin panel guide
│   └── DEPLOY-PROGRAM.md       ← Devnet deployment guide
├── onchain-academy/             ← Anchor workspace
│   ├── programs/
│   │   └── onchain-academy/    ← On-chain program (Anchor 0.31+)
│   │       └── src/
│   │           ├── lib.rs       ← 18 instructions
│   │           ├── state/       ← 6 PDA account structs
│   │           ├── instructions/← One file per instruction
│   │           ├── errors.rs    ← 35 error variants
│   │           ├── events.rs    ← 18 events
│   │           └── utils.rs     ← Shared helpers (mint_xp)
│   ├── tests/
│   │   ├── onchain-academy.ts  ← 89 TypeScript integration tests
│   │   └── rust/                ← 128 Rust unit tests
│   ├── Anchor.toml
│   ├── Cargo.toml               ← Workspace root
│   └── package.json
├── apps/
│   ├── web/                     ← Next.js 14 App Router
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [locale]/       # i18n route group
│   │   │   │   │   ├── (marketing)/  # Landing page
│   │   │   │   │   └── (platform)/   # Authenticated routes
│   │   │   │   │       ├── dashboard/
│   │   │   │   │       ├── courses/
│   │   │   │   │       │   └── [slug]/lessons/[id]/
│   │   │   │   │       ├── community/           # Forum home + category + thread pages
│   │   │   │   │       │   └── [category-slug]/[thread-slug]/
│   │   │   │   │       ├── profile/
│   │   │   │   │       │   └── [username]/
│   │   │   │   │       ├── leaderboard/
│   │   │   │   │       ├── certificates/ (list + [id])
│   │   │   │   │       └── settings/
│   │   │   │   ├── api/                    # 34 routes — see apps/web/src/app/api/CLAUDE.md
│   │   │   │   ├── studio/[[...tool]]/     # Embedded Sanity Studio
│   │   │   │   ├── error.tsx          # Global error (inline i18n)
│   │   │   │   ├── not-found.tsx      # Global 404 (inline i18n)
│   │   │   │   ├── sitemap.ts         # Dynamic sitemap
│   │   │   │   ├── robots.ts          # robots.txt
│   │   │   │   └── layout.tsx         # Root layout (OG meta, skip link)
│   │   │   ├── components/
│   │   │   │   ├── ui/             # shadcn/ui base components
│   │   │   │   ├── course/         # Course cards, progress bars
│   │   │   │   ├── community/      # Thread list, answers, voting, flags, search (14 components)
│   │   │   │   ├── editor/         # Monaco editor + challenge runner
│   │   │   │   ├── gamification/   # XP bars, streak display, achievements, level-up
│   │   │   │   ├── auth/           # Wallet auth handler, auth modal, user menu
│   │   │   │   ├── certificates/   # NFT cert display, mint button, completion mint
│   │   │   │   ├── deploy/         # Program deploy panel, explorer
│   │   │   │   ├── admin/          # Course/achievement sync tables, resync panel
│   │   │   │   ├── analytics/      # Analytics provider wrapper
│   │   │   │   ├── icons/          # SolanaLogo, GoogleLogo
│   │   │   │   ├── profile/        # WalletNameGenerator
│   │   │   │   ├── landing/        # TerminalTypewriter
│   │   │   │   └── layout/         # Header, footer, sidebar, theme toggle
│   │   │   ├── hooks/
│   │   │   │   ├── use-threads.ts          # Community thread pagination
│   │   │   │   ├── use-community-stats.ts  # Community stats fetcher
│   │   │   │   ├── use-gamification-events.ts # XP/achievement event bus
│   │   │   │   ├── use-on-chain-enroll.ts  # Enrollment transaction hook
│   │   │   │   └── use-on-chain-unenroll.ts # Unenrollment transaction hook
│   │   │   ├── lib/
│   │   │   │   ├── auth/           # auth-provider.tsx (AuthProvider + useAuth hook)
│   │   │   │   ├── supabase/       # client.ts, server.ts, admin.ts, types.ts
│   │   │   │   ├── sanity/         # client.ts, queries.ts, types.ts, admin-mutations.ts
│   │   │   │   ├── solana/         # wallet-provider, academy-program, academy-reads,
│   │   │   │   │                   # admin-signer, pda, bitmap, instructions, onchain-queue,
│   │   │   │   │                   # xp-mint, parse-program-error, account-resolver, IDL
│   │   │   │   ├── helius/         # event-decoder, event-handlers, resolvers, webhook-config
│   │   │   │   ├── analytics/      # ga4.ts, posthog.ts, sentry.ts, index.ts (facade)
│   │   │   │   ├── gamification/   # xp.ts, achievements.ts, streaks.ts
│   │   │   │   ├── services/       # hybrid-progress-service.ts, index.ts
│   │   │   │   ├── styles/         # styleClasses.ts, index.ts
│   │   │   │   ├── admin/          # auth.ts, sync-diff.ts
│   │   │   │   ├── build-server/   # client.ts, binary-cache.ts
│   │   │   │   ├── rust/           # execute.ts
│   │   │   │   ├── i18n/           # config.ts, request.ts
│   │   │   │   ├── utils.ts        # cn() helper
│   │   │   │   └── logging.ts      # Server-side logging
│   │   │   ├── messages/           # en.json, pt-BR.json, es.json
│   │   │   └── styles/
│   │   │       └── globals.css     # Tailwind + focus rings + gradient utilities
│   │   ├── sanity.config.ts        # Embedded Sanity Studio config
│   │   └── tailwind.config.ts
│   └── build-server/              ← Anchor build server (Rust/Axum)
│       ├── src/                   # Routes, build logic, middleware
│       ├── programs/              # Cargo workspace template
│       ├── tests/                 # Integration tests
│       └── Dockerfile             # Multi-stage build
├── packages/
│   ├── types/                     # Shared TypeScript interfaces
│   │   └── src/
│   │       ├── course.ts          # Course, Module, Lesson, Instructor, LearningPath
│   │       ├── user.ts            # UserProfile, Achievement, Certificate
│   │       ├── progress.ts        # Progress, StreakData, LeaderboardEntry, DailyQuest
│   │       ├── community.ts       # Thread, Answer, Vote, Flag, ForumCategory
│   │       ├── onchain.ts         # PDA seeds, bitmap helpers
│   │       └── index.ts           # Re-exports
│   └── config/                    # Shared ESLint, TS, Tailwind configs
├── sanity/                        # Sanity Studio + schemas
│   ├── schemas/                   # course, module, lesson, instructor, learningPath, achievement, quest
│   ├── seed/                      # Seed data JSON files + import.mjs script (includes quests.json)
│   └── sanity.config.ts
├── supabase/
│   └── schema.sql                 # Complete DB schema (19 tables, indexes, RLS, functions, views)
├── wallets/                       ← Keypairs (gitignored)
├── scripts/                       ← Helper scripts
└── .claude/
    ├── agents/                    ← 6 specialized agents
    ├── commands/                  ← 13 slash commands
    ├── rules/                     ← Path-scoped constraints
    ├── skills/                    ← Skill docs (this directory)
    └── settings.json              ← Permissions, hooks
```

## Nested CLAUDE.md files

| Path                             | Loads when working on                              |
| -------------------------------- | -------------------------------------------------- |
| `apps/web/CLAUDE.md`             | Frontend: middleware, i18n, gamification, env vars |
| `apps/web/src/app/api/CLAUDE.md` | The 34 API routes                                  |
| `packages/types/CLAUDE.md`       | Shared TypeScript interfaces                       |
