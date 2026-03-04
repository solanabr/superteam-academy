# CMS Guide (Sanity)

This guide covers course/challenge content management for the app using Sanity Studio.

## 1. Prerequisites

Set these env vars in `app/.env.local`:

```env
NEXT_PUBLIC_USE_SANITY=true
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
```

If you need server-side stub creation endpoints (`/api/sanity/create-*-stub`), also set:

```env
SANITY_PROJECT_ID=...
SANITY_DATASET=production
SANITY_API_VERSION=2025-01-01
SANITY_API_TOKEN=...     # write token
ADMIN_JWT_SECRET=...     # must match backend/admin auth secret
```

## 2. Open Studio

Run:

```bash
cd app
pnpm dev
```

Open: `http://localhost:3000/studio`

Access control behavior:

- Wallet must be connected
- Wallet must pass admin check (`useIsAdmin`)

## 3. Content Models

Schemas are defined in `sanity/schema/*`.

### Course (`course` document)

File: `sanity/schema/course.ts`

Key fields:

- `id` (string, required): on-platform course identifier
- `slug` (slug, required): URL path key
- `title`, `description`, `difficulty`
- `lessonCount`, `xpPerLesson`, `duration`, `tags`, `image`
- `modules` (array of `module` objects)
- `published` (boolean): controls visibility in frontend queries

Frontend reads only courses where `published == true`.

### Module (`module` object)

File: `sanity/schema/module.ts`

- `title`
- `lessons` (array of `lesson` objects)

### Lesson (`lesson` object)

File: `sanity/schema/lesson.ts`

- `id`, `title`, `type`, `duration`, `content`, `image`
- For `type == challenge`:
  - `challengeCode`
  - `challengeTests`

### Challenge (`challenge` document)

File: `sanity/schema/challenge.ts`

- `slug`, `title`, `description`, `type` (`daily|seasonal|sponsored`)
- `xpReward`
- `config` object for code challenges:
  - `codeEnabled`, `codeLanguage`, `starterCode`, `codeTests`, `requireSubmissionLink`
- `season` reference
- `startsAt`, `endsAt` (datetime)

### Track (`track` document)

File: `sanity/schema/track.ts`

- `trackId`, `name`, `slug`, `description`, `image`
- `trackCollection` (Metaplex Core collection pubkey)

### Season (`season` document)

File: `sanity/schema/season.ts`

- `slug`, `name`, `description`, `startAt`, `endAt`

## 4. Create or Edit a Course

1. Open Studio -> create or open a `Course` document.
2. Set `id`, `slug`, `title`, `description`, `difficulty`.
3. Add course image (recommended 2:1 ratio, high resolution).
4. Add modules and lessons:
   - Keep lesson ids stable once published
   - For challenge lessons, provide starter code and objective/tests
5. Update `lessonCount` to match total lessons in modules.
6. Set `xpPerLesson` and metadata (`duration`, `tags`).
7. Set `published = true`.
8. Publish the document.

Validation checklist:

- Slug is unique
- `lessonCount` matches actual lessons
- Required fields are not empty
- `published` is enabled

## 5. Create or Edit Daily Challenges

1. Create/open a `Challenge` document.
2. Set:
   - `type = daily`
   - `xpReward`
   - `startsAt` and `endsAt` in UTC windows
3. For code challenges, enable `config.codeEnabled`.
4. Fill `starterCode` and `codeTests`.
5. Publish.

For per-day content operations, keep challenge windows in UTC and avoid overlapping daily records for the same day.

## 6. Publishing Workflow

Recommended workflow:

1. Draft content in Studio.
2. QA in preview environment with `NEXT_PUBLIC_USE_SANITY=true`.
3. Confirm route rendering:
   - `/courses/[slug]`
   - `/courses/[slug]/lessons/[id]`
   - `/challenges` and `/challenges/[slug]`
4. Publish in Studio.
5. Revalidate/refresh app (Next.js fetches fresh data in no-store API paths and client refetch flows).

## 7. Optional Stub APIs for CMS Team

You can pre-create skeleton docs via API (admin JWT required):

- `POST /api/sanity/create-course-stub`
- `POST /api/sanity/create-track-stub`
- `POST /api/sanity/create-season-stub`
- `POST /api/sanity/create-challenge-stub`

These endpoints are useful for bootstrapping structured documents before manual editing in Studio.

## 8. Common Pitfalls

- Course is not visible: `published` is false.
- Wrong content source: `NEXT_PUBLIC_USE_SANITY` is false.
- Studio access denied: wallet is not connected or not admin.
- Stub API fails: missing `SANITY_API_TOKEN` or invalid admin JWT.
- Daily challenge unavailable: challenge not published, wrong date window, or wrong slug/day mapping.
