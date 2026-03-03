# CMS Guide — Sanity Content Management

**Version:** 1.0.0  
**Last Updated:** March 2026  
**Audience:** Content editors, course authors, developers adding CMS content

---

## Overview

The Solana Academy Platform uses **Sanity CMS** as its headless content management system. Courses, modules, lessons, and code challenges are authored in Sanity Studio and delivered to the frontend via GROQ queries.

**Key Details:**

| Property       | Value                                               |
| -------------- | --------------------------------------------------- |
| CMS            | Sanity v5.9.0                                       |
| Client         | next-sanity 12.1.0, @sanity/image-url 2.0.3        |
| Project Name   | `superteam_academy`                                 |
| Dataset        | `production` (configurable via env)                 |
| API Version    | `2024-02-13`                                        |
| Studio Plugin  | `deskTool()` (default desk structure)               |

---

## Architecture

```
Sanity Studio (CMS)          Sanity CDN / API
  │                               │
  │  Author content              │  GROQ queries
  │  (courses, lessons)          │  via REST API
  │                               │
  ▼                               ▼
┌──────────────┐          ┌────────────────────┐
│ Sanity Cloud │ ◄────────│  lib/sanity.ts      │
│ (hosted DB)  │          │  (client + queries) │
└──────────────┘          └─────────┬──────────┘
                                    │
                          ┌─────────▼──────────┐
                          │ course.service.ts   │
                          │ (CMS → App types)   │
                          └─────────┬──────────┘
                                    │
                          ┌─────────▼──────────┐
                          │   React Components  │
                          │  (CourseCard, etc.)  │
                          └────────────────────┘
```

**Fallback Strategy:** If Sanity is not configured (missing env vars), the platform falls back to hardcoded mock courses in `lib/services/course.service.ts` and static Anchor lessons in `lib/data/anchor-lessons.ts`. This allows development without a Sanity account.

---

## Setup

### 1. Create a Sanity Project

```bash
# If starting fresh
npx sanity init

# Or use the existing config
npm install
```

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-02-13
SANITY_API_TOKEN=your_read_token    # Required for server-side queries
```

| Variable                          | Required | Description                              |
| --------------------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`   | Yes      | Sanity project ID from manage.sanity.io  |
| `NEXT_PUBLIC_SANITY_DATASET`      | Yes      | Dataset name (default: `production`)     |
| `NEXT_PUBLIC_SANITY_API_VERSION`  | No       | API version date (default: `2024-02-13`) |
| `SANITY_API_TOKEN`                | Yes      | Read token for server-side GROQ queries  |

### 3. Run Sanity Studio

```bash
# Studio runs at localhost:3333
npx sanity dev
```

### 4. Verify Connection

The `isSanityConfigured()` function in `lib/sanity.ts` checks that both `projectId` and `dataset` are set. When configured, `course.service.ts` will prefer CMS data over mock data.

---

## Content Model

### Schema Hierarchy

```
Course
  ├── title, slug, description, thumbnail
  ├── difficulty (beginner / intermediate / advanced)
  ├── track (e.g. "Solana Core", "DeFi", "NFTs")
  ├── duration (minutes), xpReward
  ├── instructor { name, avatar }
  ├── tags[], prerequisites[]
  ├── status (draft / published / archived)
  │
  └── modules[] (references)
        ├── title, description, order
        │
        └── lessons[] (references)
              ├── title, slug, description
              ├── content (blockContent — rich text)
              ├── type (content / challenge)
              ├── xpReward, order
              │
              └── challenge (embedded, if type = "challenge")
                    ├── prompt, starterCode, solution
                    ├── testCases[] { input, expectedOutput, hidden }
                    ├── language (typescript / rust / python / javascript)
                    └── hints[]
```

### Schema: Course

**Document type:** `course`

| Field           | Type                  | Required | Description                                |
| --------------- | --------------------- | -------- | ------------------------------------------ |
| `title`         | `string`              | ✅       | Course title                               |
| `slug`          | `slug`                | ✅       | URL slug (auto-generated from title)       |
| `description`   | `text`                | ✅       | Short description for catalog cards        |
| `thumbnail`     | `image`               | No       | Cover image with hotspot support           |
| `difficulty`    | `string` (list)       | ✅       | `beginner`, `intermediate`, or `advanced`  |
| `track`         | `string`              | ✅       | Learning track name                        |
| `duration`      | `number`              | ✅       | Estimated duration in minutes              |
| `xpReward`      | `number`              | ✅       | Total XP awarded for course completion     |
| `instructor`    | `object`              | No       | `{ name: string, avatar: image }`          |
| `tags`          | `array<string>`       | No       | Searchable tags                            |
| `modules`       | `array<ref:module>`   | No       | Ordered list of module references          |
| `prerequisites` | `array<ref:course>`   | No       | Required courses before enrollment         |
| `status`        | `string` (list)       | No       | `draft`, `published`, `archived`           |

**Preview:** Displays title with difficulty as subtitle.

**Important:** Only courses with `status == "published"` appear in the frontend. Draft and archived courses are hidden from all GROQ queries.

### Schema: Module

**Document type:** `module`

| Field         | Type                 | Required | Description                       |
| ------------- | -------------------- | -------- | --------------------------------- |
| `title`       | `string`             | ✅       | Module title                      |
| `description` | `string`             | No       | Brief description                 |
| `order`       | `number`             | ✅       | Display order within the course   |
| `course`      | `reference<course>`  | ✅       | Parent course                     |
| `lessons`     | `array<ref:lesson>`  | No       | Ordered list of lesson references |

### Schema: Lesson

**Document type:** `lesson`

| Field         | Type                  | Required | Description                                    |
| ------------- | --------------------- | -------- | ---------------------------------------------- |
| `title`       | `string`              | ✅       | Lesson title                                   |
| `slug`        | `slug`                | ✅       | URL slug (auto-generated from title)           |
| `description` | `string`              | No       | Brief description                              |
| `content`     | `blockContent`        | No       | Rich text lesson content (portable text)       |
| `type`        | `string` (list)       | ✅       | `content` (reading) or `challenge` (coding)    |
| `challenge`   | `challenge` (object)  | No       | Code challenge config (hidden when type ≠ challenge) |
| `xpReward`    | `number`              | No       | XP awarded on completion                       |
| `order`       | `number`              | No       | Display order within the module                |
| `module`      | `reference<module>`   | No       | Parent module                                  |

### Schema: Challenge (Embedded Object)

**Object type:** `challenge` (embedded within lessons)

| Field          | Type                | Required | Description                                    |
| -------------- | ------------------- | -------- | ---------------------------------------------- |
| `prompt`       | `text`              | ✅       | Challenge description / instructions           |
| `starterCode`  | `text`              | No       | Pre-filled code in the editor                  |
| `solution`     | `text`              | No       | Reference solution (hidden from learners in Studio) |
| `testCases`    | `array<object>`     | No       | `{ input, expectedOutput, hidden }` per test   |
| `language`     | `string` (list)     | No       | `typescript`, `rust`, `python`, `javascript`   |
| `hints`        | `array<string>`     | No       | Progressive hints for struggling learners      |

### Schema: Block Content (Rich Text)

**Array type:** `blockContent`

Supports:
- **Styles:** Normal, H1, H2, H3, Blockquote
- **Lists:** Bullet, Numbered
- **Marks:** Bold, Italic, Inline Code, URL Links
- **Custom blocks:**
  - **Image** — with hotspot/crop support
  - **Code Block** — `{ code: text, language: string }` with syntax highlighting support for TypeScript, JavaScript, Rust, Python, Bash, JSON

---

## GROQ Queries

All queries are centralized in `lib/sanity.ts`. Here are the four main queries:

### Get All Published Courses

```groq
*[_type == "course" && status == "published"] | order(title asc) {
  _id, title, slug, description, thumbnail,
  difficulty, track, duration, xpReward,
  instructor, tags, status,
  "modules": modules[]-> {
    _id, title, order,
    "lessons": lessons[]-> { _id, title, slug, type, xpReward, order }
  }
}
```

Supports optional filters for `difficulty` and `track`.

### Get Single Course (with Full Content)

```groq
*[_type == "course" && slug.current == $slug && status == "published"][0] {
  _id, title, slug, description, thumbnail,
  difficulty, track, duration, xpReward,
  instructor, tags, status,
  "modules": modules[]-> {
    _id, title, description, order,
    "lessons": lessons[]-> {
      _id, title, slug, description, content,
      type, challenge, xpReward, order
    }
  }
}
```

Deep-resolves all module and lesson references including full lesson content.

### Get Single Lesson

```groq
*[_type == "lesson" && (_id == $lessonId || slug.current == $lessonId)][0] {
  _id, title, slug, description, content,
  type, challenge, xpReward, order
}
```

Looks up by either Sanity `_id` or `slug`.

### Search Courses

```groq
*[_type == "course" && status == "published" && (
  title match $search ||
  description match $search ||
  tags[] match $search
)] | order(title asc) {
  _id, title, slug, description, thumbnail,
  difficulty, track, duration, xpReward, tags
}
```

Full-text match on title, description, and tags.

---

## Data Flow: CMS → Frontend

### Type Mapping

Sanity documents are mapped to internal application types in `course.service.ts`:

```
SanityCourse (CMS) → Course (app)
  ├── _id          → id
  ├── title        → title
  ├── slug.current → slug
  ├── description  → description
  ├── thumbnail    → thumbnail (via urlFor())
  ├── difficulty   → difficulty
  ├── track        → track
  ├── duration     → duration
  ├── xpReward     → xpReward
  ├── instructor   → instructor
  ├── tags         → tags
  └── modules[]    → modules[]
       └── lessons[] → lessons[]

SanityLesson (CMS) → Lesson (app)
  ├── _id            → id
  ├── title          → title
  ├── slug.current   → slug
  ├── content        → content (portable text)
  ├── type           → type
  ├── challenge      → challenge
  └── xpReward       → xpReward
```

### Priority Chain

```
1. Sanity CMS (if configured)        ← Production source
2. On-chain course data (enrichment)  ← Supplements CMS data
3. Mock courses (MOCK_COURSES array)  ← Development fallback
```

`isSanityConfigured()` checks for `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`. When both are set, CMS is the primary data source.

---

## Content Authoring Guide

### Creating a New Course

1. Open Sanity Studio (`npx sanity dev`)
2. Click **Course** → **Create new**
3. Fill in required fields:
   - **Title** — descriptive name (e.g., "Solana Token Extensions")
   - **Slug** — auto-generates from title, editable
   - **Description** — 1–2 sentence summary for course cards
   - **Difficulty** — Beginner / Intermediate / Advanced
   - **Track** — learning track name (e.g., "DeFi", "NFTs", "Solana Core")
   - **Duration** — estimated total time in minutes
   - **XP Reward** — total XP for completing the entire course
4. Set **Status** to `draft` while building content
5. Add modules (see below)
6. Change **Status** to `published` when ready

### Creating Modules

1. Click **Module** → **Create new**
2. Set:
   - **Title** — module name (e.g., "Getting Started")
   - **Order** — `1`, `2`, `3`, etc.
   - **Course** — link to parent course
3. Add lessons (see below)
4. Go back to the Course and add this module to the **Modules** array

### Creating Lessons

#### Reading Lesson (type: `content`)

1. Click **Lesson** → **Create new**
2. Set **Type** to `content`
3. Write lesson content using the **Block Content** editor:
   - Use headings (H1, H2, H3) for structure
   - Add code blocks with language selection
   - Insert images where helpful
4. Set **XP Reward** (typically 10–25 XP for reading lessons)
5. Set **Order** within the module
6. Link to parent **Module**
7. Add this lesson to the Module's **Lessons** array

#### Challenge Lesson (type: `challenge`)

1. Click **Lesson** → **Create new**
2. Set **Type** to `challenge`
3. Fill in the **Challenge** section:
   - **Prompt** — clear instructions for the coding task
   - **Starter Code** — pre-filled code template
   - **Solution** — reference solution (hidden from learners)
   - **Language** — TypeScript, JavaScript, Rust, or Python
   - **Test Cases** — at least 2–3 test cases:
     - `input`: test input string
     - `expectedOutput`: expected result string
     - `hidden`: check `true` for tests not shown to learners
   - **Hints** — progressive hints (shown one at a time)
4. Set **XP Reward** (typically 25–50 XP for challenges)
5. Optionally add **Content** above the challenge for context

### Content Best Practices

- **Course structure:** 3–6 modules per course, 2–5 lessons per module
- **Lesson length:** Reading lessons ~5–15 minutes, challenges ~10–30 minutes
- **XP distribution:** Challenges should award 2× the XP of reading lessons
- **Difficulty progression:** Order modules from foundational → advanced
- **Code blocks:** Always specify the language for syntax highlighting
- **Test cases:** Include at least one hidden test case to prevent hardcoding solutions
- **Prerequisites:** Link prerequisite courses for guided learning paths
- **Thumbnails:** Recommended 600×400 resolution, use hotspot for responsive cropping
- **Tags:** Add 3–5 searchable tags per course (e.g., "solana", "token", "defi")

---

## Image Handling

### URL Builder

Sanity images are served via `urlFor()` from `lib/sanity.ts`:

```typescript
import { urlFor } from '@/lib/sanity';

// Basic usage
const imageUrl = urlFor(course.thumbnail).url();

// With transformations
const imageUrl = urlFor(course.thumbnail)
  .width(600)
  .height(400)
  .fit('crop')
  .url();
```

### Supported in Next.js

`next.config.js` is configured with `cdn.sanity.io` as an allowed image domain:

```javascript
images: {
  domains: ['cdn.sanity.io'],
}
```

---

## Extending the CMS

### Adding a New Schema Type

1. Create `sanity/schemaTypes/yourType.ts`:

```typescript
import { defineType, defineField } from 'sanity';

export const yourType = defineType({
  name: 'yourType',
  title: 'Your Type',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    // ... more fields
  ],
});
```

2. Register in `sanity/schemaTypes/index.ts`:

```typescript
import { yourType } from './yourType';
export const schemaTypes = [course, module, lesson, challenge, blockContent, yourType];
```

3. Restart Sanity Studio.

### Adding a New GROQ Query

Add a new function in `lib/sanity.ts` following the existing pattern:

```typescript
export async function getYourData(params?: Record<string, unknown>) {
  const query = `*[_type == "yourType"] | order(title asc) {
    _id, title, ...
  }`;
  return sanityFetch<YourType[]>(query, params);
}
```

### Custom Desk Structure

To customize Studio navigation, create a custom desk structure:

```typescript
// sanity.config.ts
import { deskTool } from 'sanity/desk';

export default defineConfig({
  // ...
  plugins: [
    deskTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem().title('Courses').child(S.documentTypeList('course')),
            S.listItem().title('Modules').child(S.documentTypeList('module')),
            S.listItem().title('Lessons').child(S.documentTypeList('lesson')),
            S.divider(),
            // Add more categories here
          ]),
    }),
  ],
});
```

---

## Troubleshooting

| Issue                          | Solution                                                        |
| ------------------------------ | --------------------------------------------------------------- |
| Courses not appearing          | Check `status` is set to `published` in Sanity Studio           |
| Mock data showing instead of CMS | Verify `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are set in `.env.local` |
| Images not loading             | Confirm `cdn.sanity.io` in `next.config.js` image domains       |
| GROQ query errors              | Test queries in Sanity Vision plugin (`npx sanity dev` → Vision) |
| `SANITY_API_TOKEN` error       | Generate a read token at manage.sanity.io → API → Tokens        |
| Challenge not visible          | Ensure lesson `type` is set to `challenge`                      |
| Lessons out of order           | Check `order` field on both modules and lessons                 |

---

**Document Version**: 1.0.0  
**Last Updated**: March 2026  
**Maintained By**: Superteam Academy Team
