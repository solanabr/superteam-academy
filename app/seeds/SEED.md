# Seed Architecture

Superteam Academy uses a **two-layer data system**: Payload CMS for editorial content and Prisma for app state. The seed script writes to both in a single run.

## Data Ownership

| Data | Layer | Notes |
|------|-------|-------|
| Courses, Modules, Lessons | **Payload CMS** | Editorial content, source of truth |
| Tracks, Difficulties | **Payload CMS** | Content metadata |
| Achievements | **Prisma** | Gamification definitions |
| Users (learners) | **Prisma** | App state |
| Enrollments, completions, XP, streaks | **Prisma** | User state (mirrors reference Payload IDs) |
| Discussions, notifications | **Prisma** | Community data |

## Scripts

### `seed.ts` — Full dual-write seed

**Run by:** `pnpm db:seed`

Seeds everything in one pass:
1. Initializes Payload CMS (local API)
2. Clears both Payload collections and Prisma tables
3. Seeds Payload: tracks, difficulties, courses, modules, lessons
4. Seeds Prisma: mirrors of courses/modules/lessons (using Payload-generated IDs), achievements, users, enrollments, completions, XP events, streaks, discussions, notifications

**Requires Payload CMS running.**

### `reset.ts` — Full reset (drop everything + re-seed)

**Run by:** `pnpm db:full-reset`

1. Drops the Payload schema (`DROP SCHEMA payload CASCADE`)
2. Runs `prisma migrate reset --force` (drops public schema, re-applies all migrations)
3. Runs `seed.ts` (full dual-write seed)

**Requires Payload CMS running.** This is the nuclear option for a clean slate.

### `prisma.config.ts` — No auto-seed

The Prisma config intentionally has **no seed command**. This prevents `prisma migrate reset` from failing when Payload isn't available. Use `pnpm db:full-reset` or `pnpm db:seed` instead.

## Common Operations

```bash
# Full reset: drop everything, re-migrate, re-seed (requires Payload)
pnpm db:full-reset

# Seed only (requires Payload running, assumes tables exist)
pnpm db:seed

# Migrations only (no seed, no Payload needed)
npx prisma migrate reset --force

# Apply pending migrations without reset
npx prisma migrate deploy
```

## Troubleshooting

**Seed fails with "Cannot connect to Payload"**
→ Start the dev server first (`pnpm dev`), then run `pnpm db:seed` in another terminal.

**`prisma migrate reset` used to auto-seed and now doesn't**
→ By design. Use `pnpm db:full-reset` for a complete reset+seed, or `pnpm db:seed` after migrations.

**Duplicate key errors**
→ The seed clears all tables before inserting. If you see duplicates, run `pnpm db:full-reset` for a clean slate.

## File Map

```
seeds/
├── SEED.md              ← This file
├── seed.ts              ← Full dual-write seed (Payload + Prisma)
├── reset.ts             ← Full reset orchestrator
├── data/
│   ├── achievements.ts  ← Achievement definitions
│   ├── users.ts         ← Seed user archetypes
│   ├── courses/         ← Course content data
│   ├── discussions.ts   ← Thread + comment templates
│   └── notifications.ts ← Notification templates
└── utils/
    ├── payload.ts       ← Payload CMS local API init
    └── prisma-to-payload.ts ← Data format converters
```

Mock profiles for demo public profile pages live in `src/lib/data/mock-profiles.ts` — runtime data, not seed data.
