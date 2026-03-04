# Superteam Academy — Sanity CMS Guide

Last Updated: 2026-03-04

## Overview

Course content is managed in **Sanity CMS** — the single source of truth for all course, module, lesson, instructor, and track content. The frontend fetches content via GROQ queries at build time and on-demand, with cache revalidation driven by Sanity webhooks.

Content is decoupled from on-chain state. The on-chain program stores XP configuration and enrollment records; Sanity stores the human-readable content (titles, descriptions, lesson text, challenge code).

**Two ways to manage content:**

1. **Sanity Studio** (hosted) — Full CMS interface for direct content editing at [superteam-academy.sanity.studio](https://superteam-academy.sanity.studio/)
2. **Creator Dashboard** (in-app, bonus feature) — A fully integrated course creation wizard at `/creator` that writes directly to Sanity, with admin approval workflow

Both interfaces produce identical Sanity documents and follow the same publishing workflow. The creator dashboard was built as a bonus feature to give course creators a streamlined, in-app experience without needing direct Sanity Studio access.

---

## Accessing Sanity Studio

Sanity Studio is hosted at:

| Environment | URL |
|-------------|-----|
| **Production** | [superteam-academy.sanity.studio](https://superteam-academy.sanity.studio/) |

To access Studio, you must be added as a team member in the Sanity project. **If you need access for review purposes, please request it in the PR comments.**

Studio authentication uses Sanity's own auth system (Google or GitHub), not the app's NextAuth.

---

## Content Schema

Five document types make up the content model.

### `course`

The top-level document. Its `courseId` becomes the on-chain PDA seed.

| Field | Type | Notes |
|-------|------|-------|
| `courseId` | slug | Max 32 chars. Used as the on-chain PDA seed. Never change after enrollment begins. |
| `title` | string | Display name shown in the catalog |
| `description` | text | Short summary for course cards |
| `longDescription` | text | Full description shown on the course detail page |
| `thumbnail` | image | Must be 16:9 for consistent card layout |
| `difficulty` | string | `beginner`, `intermediate`, or `advanced` |
| `track` | reference | References a `track` document |
| `instructor` | reference | References an `instructor` document |
| `modules` | array of references | References to `module` documents. Order matters. |
| `tags` | array of strings | Used for catalog filtering and skill score computation |
| `published` | boolean | Controls visibility in the public catalog |
| `submissionStatus` | string | `waiting`, `approved`, `rejected`, `deactivated` |
| `xpPerLesson` | number | XP awarded to learner per completed lesson |
| `creatorRewardXp` | number | XP awarded to course creator per learner completion |
| `minCompletionsForReward` | number | Minimum learner completions before creator reward triggers |
| `lessonCount` | number | Total lesson count (must match actual module/lesson structure) |
| `trackLevel` | number | Numeric level within the track (used on-chain) |
| `prerequisiteCourseId` | string | courseId of a required prerequisite course |
| `creator` | string | Creator wallet public key (Base58) |
| `duration` | number | Estimated total hours |

### `module`

A grouping of lessons within a course. Modules are referenced from the `course.modules` array.

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Section heading displayed to learners |
| `description` | text | Brief description of what this module covers |
| `order` | number | Sort order within the course |
| `lessons` | array of references | References to `lesson` documents |

### `lesson`

A single unit of learning. Two lesson types are supported: `content` and `challenge`.

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Lesson heading |
| `slug` | slug | URL-safe identifier. Used to look up lesson content from the frontend. |
| `type` | string | `content` or `challenge` |
| `duration` | number | Estimated duration in minutes |
| `videoUrl` | URL | Optional. Embedded video for content lessons. |
| `markdownContent` | text | Markdown body for content lessons. Supports GFM (tables, task lists). |
| `content` | portable text | Structured rich text alternative to markdown |

For `challenge` lessons, the `challenge` object includes:

| Field | Type | Notes |
|-------|------|-------|
| `challenge.prompt` | text | Challenge description and instructions shown to the learner |
| `challenge.language` | string | `rust` or `typescript` |
| `challenge.starterCode` | code block | Pre-populated in the in-browser editor |
| `challenge.solution` | code block | Revealed when the learner toggles the solution |
| `challenge.testCases` | array | Each entry has `input`, `expectedOutput`, `label`, and optional `validator` |
| `challenge.hints` | array of strings | Expandable hints shown on demand |

The `@sanity/code-input` plugin provides syntax highlighting for `starterCode` and `solution` fields in Studio.

Challenge test cases must be deterministic. Do not use random inputs or time-dependent expected outputs.

### `instructor`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Display name |
| `bio` | text | Short biography |
| `avatar` | image | Profile photo |
| `twitter` | string | Twitter/X handle |
| `github` | string | GitHub username |
| `website` | URL | Personal or portfolio site |

### `track`

A learning track groups related courses and maps to a Metaplex Core collection for credential NFTs.

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Display name (e.g., "Solana Core") |
| `slug` | slug | URL-safe identifier |
| `description` | text | What this track covers |
| `color` | string | Hex color code used in the UI (e.g., `#9945FF`) |
| `trackId` | number | Numeric ID stored on-chain in the `Course` account |
| `collectionAddress` | string | Metaplex Core collection pubkey for credential NFTs |

---

## Publishing Workflow

### Track Management (Admin Only)

Tracks must exist before courses can be assigned to them. Track management is an **admin-only** feature available exclusively in the admin dashboard at `/admin` -> Tracks tab.

From the admin dashboard, an admin can:

1. **Create a new track** — Set name, slug, description, color. The track is created in Sanity automatically.
2. **Create a credential NFT collection** — With one click, the admin creates a Metaplex Core collection on devnet for the track. The collection address is stored in Sanity and used when issuing credential NFTs to learners who complete courses in that track.
3. **Upload track image** — Set the visual identity for the track.

No custom scripts, no CLI commands, no manual Sanity edits needed. Everything is managed from the admin dashboard UI.

---

### Course Publishing Workflow

The publishing workflow is identical regardless of whether the course is created via Sanity Studio or the Creator Dashboard. Both produce the same Sanity documents and follow the same approval pipeline.

```
                  +-----------------+           +------------------+
                  |  Sanity Studio  |           | Creator Dashboard|
                  | (direct editing)|           |   (/creator)     |
                  +--------+--------+           +--------+---------+
                           |                             |
                           |   Creates/updates Sanity    |
                           |   course document           |
                           +----------+------------------+
                                      |
                                      v
                        +-------------+-------------+
                        |  submissionStatus: waiting |
                        +-------------+-------------+
                                      |
                                      v
                        +-------------+-------------+
                        |   Admin Dashboard (/admin) |
                        |   Reviews course content   |
                        +--+---------------------+--+
                           |                     |
                           v                     v
                  +--------+--------+   +--------+--------+
                  | Status: approved|   | Status: rejected |
                  | (visible in     |   | (creator notified|
                  |  catalog)       |   |  to revise)      |
                  +-----------------+   +-----------------+
```

**State machine:**
- `waiting` — Course submitted, pending admin review
- `approved` — Admin approved, visible in course catalog
- `rejected` — Admin rejected, creator can revise and resubmit
- `deactivated` — Admin pulled from catalog (preserves enrollment data)

Admin-controlled states (`approved`, `deactivated`) are never reset by webhooks. Only `null` or `rejected` states are reset to `waiting` when a course is republished.

---

### Via Sanity Studio

1. Open [superteam-academy.sanity.studio](https://superteam-academy.sanity.studio/)
2. Create a new `course` document
3. Set `courseId` — this becomes the on-chain PDA seed. Rules:
   - Maximum 32 characters
   - URL-safe characters only (lowercase letters, digits, hyphens)
   - Never change it after learners have enrolled
4. Fill in `title`, `description`, `longDescription`, `thumbnail`, `difficulty`, `track`, `instructor`
5. Set `published = false` initially
6. Set `xpPerLesson`, `creatorRewardXp`, `minCompletionsForReward`, `lessonCount`, `creator` to match the values that will be registered on-chain via `register_course`
7. Create `module` documents for each section (set `order` field)
8. Create `lesson` documents:
   - **Content lessons:** Write markdown content, optionally add `videoUrl`
   - **Challenge lessons:** Set `challenge.prompt`, `challenge.language` (rust/typescript), `challenge.starterCode`, `challenge.solution`, `challenge.testCases` (at least two), `challenge.hints`
9. Link modules to their lessons, link course to its modules (order matters)
10. Set `instructor` reference
11. Set `published = true` — triggers webhook, sets `submissionStatus: waiting`
12. Admin reviews and approves from `/admin` dashboard

### Via Creator Dashboard (Bonus Feature)

The creator dashboard at `/creator` provides a streamlined, in-app alternative that is **tightly integrated with Sanity**. Every action in the creator dashboard writes directly to Sanity — no separate data store, no sync needed.

**What the creator dashboard offers:**

1. **Dashboard view** (`/creator`) — Lists all courses created by the current user with their submission status
2. **New course wizard** (`/creator/new`) — Multi-step form:
   - Step 1: Title, description, difficulty, track selection
   - Step 2: Module creation with ordering
   - Step 3: Lesson editor per module — markdown content editor for content lessons, code editor for challenge lessons with test case builder
   - Step 4: Review and submit
3. **Edit course** (`/creator/edit/[courseId]`) — Same wizard pre-populated with existing course data
4. **Thumbnail upload** — Uploaded to Supabase Storage, referenced in Sanity document
5. **Track assignment** — Select from admin-created tracks

When a course is submitted via the creator dashboard:
- A complete Sanity document tree is created (course + modules + lessons)
- `submissionStatus` is set to `waiting`
- The course appears in the admin dashboard for review
- Admin approves or rejects from `/admin` -> Courses tab
- On approval, the course becomes visible in the public catalog

The creator never needs Sanity Studio access — the entire workflow lives in the app.

---

## Webhook Configuration

The webhook endpoint is `/api/webhooks/sanity`.

**Signature verification:** Every incoming webhook is verified using HMAC-SHA256 against `SANITY_WEBHOOK_SECRET`. Requests without a valid `sanity-webhook-signature` header are rejected with 401.

**Cache revalidation tags:**

| Sanity document type | Revalidated tags |
|----------------------|-----------------|
| `course`, `module`, `lesson` | `courses` |
| `track` | `tracks` |
| `instructor` | `instructors` |

Configure the webhook in the Sanity project at [sanity.io/manage](https://www.sanity.io/manage):
- URL: `https://your-domain.com/api/webhooks/sanity`
- Trigger: `publish`
- Document types: `course`, `module`, `lesson`, `track`, `instructor`
- Enable HTTPS signature with a strong secret

---

## GROQ Queries

Queries live in `/home/user/projects/superteam-academy/app/src/lib/sanity/queries.ts`.

| Export | Purpose |
|--------|---------|
| `COURSES_QUERY` | All published courses with metadata for catalog cards |
| `COURSE_BY_SLUG_QUERY` | Full course with nested modules and lessons by `courseId` |
| `COURSE_BY_COURSE_ID_QUERY` | Lightweight course lookup by `courseId` |
| `COURSES_BY_IDS_QUERY` | Batch fetch of published courses by a list of `courseId` values |
| `ALL_COURSES_BY_IDS_QUERY` | Same as above but without `published` filter — used in learner dashboard |
| `COURSE_TAGS_QUERY` | Tags and XP data for skill score computation |
| `TRACKS_QUERY` | All tracks ordered alphabetically |
| `INSTRUCTORS_QUERY` | All instructors |

The Sanity client is configured in `/home/user/projects/superteam-academy/app/src/lib/sanity/client.ts`:

```typescript
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2026-02-15",
  useCdn: true,
});
```

The `useCdn: true` setting serves cached responses from Sanity's CDN. For write operations (the webhook handler), a separate client is instantiated with `useCdn: false` and `token` set to `SANITY_API_TOKEN`.

---

## Seeding Sample Content

Populate a fresh Sanity dataset with sample courses, modules, lessons, tracks, and instructors:

```bash
cd app
pnpm seed-sanity
```

Requires `NEXT_PUBLIC_SANITY_PROJECT_ID` and `SANITY_API_TOKEN` in `app/.env.local`.

The seed script creates:
- 5 tracks (Solana Core, DeFi, NFTs, Anchor, Web3 Integration)
- 3 instructors
- A sample "Introduction to Solana" course with content and challenge lessons

Replace `PLACEHOLDER_CREATOR` in the seed script with real creator wallet public keys before registering courses on-chain.

---

## Environment Variables

### Next.js App (`app/.env.local`)

```
NEXT_PUBLIC_SANITY_PROJECT_ID=       # Sanity project ID (public)
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=                    # Editor-level token for write operations
SANITY_WEBHOOK_SECRET=               # HMAC secret for webhook signature verification
```

### Backend / Server-Side

```
SANITY_PROJECT_ID=                   # Used when NEXT_PUBLIC_ prefix is unavailable
SANITY_DATASET=production
```

Obtain `SANITY_API_TOKEN` from the Sanity project settings at [sanity.io/manage](https://www.sanity.io/manage). Use an Editor-level token — do not use a Deploy token for write operations.

---

## On-Chain Alignment

Several `course` fields in Sanity must match the values passed to `register_course` on-chain exactly. Mismatches cause incorrect XP awards or frontend display errors.

| Sanity field | On-chain field | Notes |
|---|---|---|
| `courseId.current` | `course_id` (PDA seed) | 32-char max. Immutable after first enrollment. |
| `xpPerLesson` | `xp_per_lesson` | XP minted per `complete_lesson` call |
| `lessonCount` | `lesson_count` | Must equal the total number of lesson documents across all modules |
| `creatorRewardXp` | `creator_reward_xp` | XP minted to creator wallet after course finalization |
| `minCompletionsForReward` | `min_completions_for_reward` | Learner completions required before creator reward |
| `creator` | `creator` (wallet pubkey) | Must be the signer for `register_course` |
| `track->trackId` | `track_id` | Numeric track identifier stored in the `Course` account |
| `trackLevel` | `track_level` | Numeric level within the track |

PDA derivation for reference:

```typescript
const [coursePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("course"), Buffer.from(courseId)],
  PROGRAM_ID
);
```

---

## Common Mistakes

**Changing `courseId` after enrollment begins.**
The `courseId` is the on-chain PDA seed. Changing it creates a new PDA, orphaning all existing `Enrollment` accounts. The old course remains on-chain; the new Sanity slug points nowhere valid.

**`lessonCount` mismatch.**
If `lessonCount` in Sanity does not match the actual number of lesson documents, the on-chain program will consider a learner finished before they have completed all lessons (or never finished if the count is too high). Count lessons carefully before calling `register_course`.

**Module order not set.**
Modules are returned in reference array order from GROQ, not by `order` field. Arrange module references in the course document in the intended display order. Set the `order` field as a human-readable label; rely on the array position for actual ordering.

**Publishing without setting `creator` wallet.**
The `creator` field must be the Base58 public key of the wallet that will sign `register_course`. If left as the seed placeholder (`11111111111111111111111111111111`), creator rewards cannot be issued correctly.

**Challenge test cases with non-deterministic outputs.**
Avoid `Date.now()`, random numbers, or file system paths in test case inputs or expected outputs. The test runner compares exact string output.

**Not configuring the webhook secret.**
Without `SANITY_WEBHOOK_SECRET` set in the environment, all webhook requests are rejected with 401 and cache revalidation will not occur. Content edits in Studio will not appear on the site until the next full deployment.

---

## Troubleshooting

**Studio is inaccessible.**
Verify you have been added as a team member in the Sanity project at [sanity.io/manage](https://www.sanity.io/manage). Studio authentication uses Sanity's own auth (Google/GitHub), not the app's NextAuth. If you need access for review, request it in the PR comments.

**Content changes in Studio are not appearing on the site.**
1. Check that the webhook is configured in the Sanity project settings and points to the correct URL.
2. Verify `SANITY_WEBHOOK_SECRET` matches the secret configured in the Sanity project.
3. Check server logs for `[webhook]` entries. A 401 means the secret is wrong. A 500 means the revalidation call failed.
4. If the issue persists, trigger a manual revalidation by redeploying, or call `revalidateTag("courses")` from a test endpoint.

**Seed script fails with "Missing NEXT_PUBLIC_SANITY_PROJECT_ID".**
The script loads `app/.env.local`. Ensure that file exists and contains `NEXT_PUBLIC_SANITY_PROJECT_ID`.

**GROQ query returns null for a course.**
Confirm `published == true` on the course document in Studio. The `COURSES_QUERY` and `COURSE_BY_SLUG_QUERY` filter on `published`. Use `ALL_COURSES_BY_IDS_QUERY` for dashboard views that must include deactivated courses.

**Lesson count in the UI does not match expected.**
`totalLessons` is computed in GROQ as `count(modules[]->lessons[])`. If a lesson document is not saved or a reference is broken, it will be excluded. Open each module in Sanity Studio and verify all lesson references resolve without errors.
