# CMS Guide

How to manage course content in Superteam Academy using Sanity CMS.

## Overview

Superteam Academy uses [Sanity](https://www.sanity.io/) as a headless CMS for all course content. Content editors create courses, modules, lessons, challenges, and learning paths in Sanity Studio. The Next.js frontend fetches this content via GROQ queries.

When Sanity is not configured (no `NEXT_PUBLIC_SANITY_PROJECT_ID` set), the app falls back to mock data from `src/lib/mock-data.ts` automatically.

### Content Model

```
LearningPath
  └── Course[]  (references)

Course
  ├── metadata (title, slug, difficulty, duration, track, tags)
  └── Module[]  (references)
        └── Lesson[]  (references)
              └── Challenge  (reference, optional)
                    ├── starterCode
                    ├── testCases[]
                    ├── hints[]
                    └── solution
```

---

## Environment Variables

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Client + Server | No | Your Sanity project ID. If unset, all queries return mock data. |
| `NEXT_PUBLIC_SANITY_DATASET` | Client + Server | No | Dataset name. Defaults to `production`. |
| `SANITY_API_TOKEN` | Server only | No | Read token for draft/preview access. Generate in Sanity dashboard under API > Tokens. |

The Sanity client is created in `src/lib/sanity/client.ts`:

```typescript
import { createClient, type SanityClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export const client: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
      apiVersion: "2024-01-01",
      useCdn: process.env.NODE_ENV === "production",
    })
  : null;
```

When `projectId` is falsy, `client` is `null`. The data service layer (`src/lib/data-service.ts`) checks this and returns mock data instead.

---

## Schema Definitions

All schemas live in `src/lib/sanity/schemas/` and are registered in `schemas/index.ts`:

```typescript
import { course } from "./course";
import { moduleSchema } from "./module";
import { lesson } from "./lesson";
import { challenge } from "./challenge";
import { learningPath } from "./learning-path";

export const schemas = [course, moduleSchema, lesson, challenge, learningPath];
```

### Course (`course.ts`)

The top-level content document. Each course belongs to a track and difficulty level.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Course name displayed in catalog and detail pages |
| `slug` | slug (from title) | Yes | URL-safe identifier, auto-generated from title |
| `description` | text | No | 1-3 sentence summary shown on course cards |
| `thumbnail` | image (hotspot) | No | Course card image. Served via Sanity CDN |
| `difficulty` | string (enum) | No | `beginner`, `intermediate`, or `advanced` |
| `duration` | string | No | Estimated time, e.g. "8 hours" |
| `trackId` | number | No | Matches on-chain track registry (0-6). See track list below. |
| `trackLevel` | number | No | Position within the track (1, 2, 3) |
| `trackName` | string | No | Display name for the track (e.g. "Anchor Framework") |
| `creator` | string | No | Author or organization name |
| `isActive` | boolean | No | Defaults to `true`. Set `false` to hide from catalog |
| `xpTotal` | number | No | Total XP awarded for completing the course |
| `tags` | string[] | No | Searchable tags (e.g. "rust", "defi", "security") |
| `modules` | reference[] -> Module | No | Ordered list of modules |
| `prerequisites` | string[] | No | Course slugs that should be completed first |

**Track ID Reference:**

| ID | Name | Display |
|----|------|---------|
| 0 | standalone | Standalone |
| 1 | anchor | Anchor Framework |
| 2 | rust | Rust for Solana |
| 3 | defi | DeFi Development |
| 4 | security | Program Security |
| 5 | frontend | Frontend & dApps |
| 6 | token | Token Engineering |

### Module (`module.ts`)

A logical grouping of lessons within a course. Displayed as accordion sections.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Module heading |
| `description` | text | No | Brief summary of what the module covers |
| `order` | number | No | Sort position within the course (0-based) |
| `lessons` | reference[] -> Lesson | No | Ordered list of lessons |

### Lesson (`lesson.ts`)

An individual learning unit. Can be pure content or a coding challenge.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Lesson name |
| `description` | text | No | One-line description |
| `type` | string (enum) | No | `content` (reading) or `challenge` (coding exercise) |
| `order` | number | No | Sort position within the module (0-based) |
| `xpReward` | number | No | XP granted on completion |
| `content` | block[] (Portable Text) | No | Rich text content for content-type lessons |
| `challenge` | reference -> Challenge | No | Linked challenge for challenge-type lessons |
| `duration` | string | No | Estimated time, e.g. "20 min" |

### Challenge (`challenge.ts`)

A coding exercise rendered in the Monaco editor. Linked from challenge-type lessons.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | text | Yes | The problem statement shown to the learner |
| `starterCode` | text | No | Pre-filled code in the editor |
| `language` | string (enum) | No | `rust`, `typescript`, or `json` |
| `hints` | string[] | No | Progressive hints revealed on request |
| `solution` | text | No | Reference solution (hidden until submitted or revealed) |
| `testCases` | object[] | No | Array of `{ name, input, expectedOutput }` |

### Learning Path (`learning-path.ts`)

A curated sequence of courses forming a learning track.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Path title (e.g. "DeFi Developer") |
| `description` | text | No | What the learner will achieve |
| `icon` | string | No | Lucide icon name for display |
| `courses` | reference[] -> Course | No | Ordered course sequence |
| `color` | string | No | Hex color for the path card |

---

## Setting Up Sanity

### 1. Create a Sanity Project

```bash
npx sanity@latest init
```

When prompted:
- Project name: `superteam-academy`
- Dataset: `production`
- Template: Clean project (no starter)

### 2. Set Environment Variables

```bash
# In app/.env.local
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-read-token    # From Sanity dashboard > API > Tokens
```

### 3. Register Schemas in Sanity Studio

In your Sanity Studio project, import the schemas from this app:

```typescript
// sanity.config.ts (Sanity Studio)
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemas } from "./path-to-app/src/lib/sanity/schemas";

export default defineConfig({
  name: "superteam-academy",
  title: "Superteam Academy",
  projectId: "your-project-id",
  dataset: "production",
  plugins: [structureTool()],
  schema: { types: schemas },
});
```

### 4. Deploy Sanity Studio

```bash
npx sanity deploy
```

This gives you a hosted Studio at `https://your-project.sanity.studio`.

### 5. Configure CORS

In the Sanity project dashboard (Manage > API > CORS origins), add:

- `http://localhost:3000` (development)
- `https://your-production-domain.com` (production)

---

## Course Creation Workflow

Content is created bottom-up since documents reference each other.

### Step 1: Create Challenges

1. Open Sanity Studio
2. Create a new **Challenge** document
3. Fill in the prompt, starter code, language, test cases, hints, and solution
4. Publish

### Step 2: Create Lessons

1. Create a new **Lesson** document
2. Set the type (`content` or `challenge`)
3. For content lessons: add Portable Text blocks in the `content` field
4. For challenge lessons: link the Challenge reference created in Step 1
5. Set XP reward and duration
6. Publish

### Step 3: Create Modules

1. Create a new **Module** document
2. Set the order number (0-based)
3. Add Lesson references in the correct order
4. Publish

### Step 4: Create the Course

1. Create a new **Course** document
2. Fill in title (slug auto-generates), description, difficulty, duration
3. Set `trackId` to match the track registry (0-6)
4. Set `trackLevel` for ordering within the track
5. Add Module references in order
6. Set `isActive: true` to show in the course catalog
7. Publish

### Step 5: (Optional) Create a Learning Path

1. Create a new **Learning Path** document
2. Add Course references in the recommended completion order
3. Set a color and icon for the path card
4. Publish

---

## GROQ Queries

All queries used by the frontend are defined in `src/lib/sanity/queries.ts`.

### All Active Courses

```groq
*[_type == "course" && isActive == true] | order(trackId asc, trackLevel asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  "thumbnail": thumbnail.asset->url,
  difficulty,
  duration,
  trackId,
  trackLevel,
  trackName,
  creator,
  isActive,
  xpTotal,
  tags,
  "lessonCount": count(modules[]->lessons[]),
  "challengeCount": count(modules[]->lessons[_type == "lesson" && type == "challenge"]),
  "totalEnrollments": 0,
  "totalCompletions": 0,
}
```

### Single Course with Full Content

```groq
*[_type == "course" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  "thumbnail": thumbnail.asset->url,
  difficulty,
  duration,
  trackId,
  trackLevel,
  trackName,
  creator,
  isActive,
  xpTotal,
  tags,
  prerequisites,
  modules[]-> {
    _id,
    title,
    description,
    order,
    lessons[]-> {
      _id,
      title,
      description,
      type,
      order,
      xpReward,
      duration,
      challenge-> {
        _id,
        prompt,
        starterCode,
        language,
        hints,
        solution,
        testCases
      }
    }
  }
}
```

### All Learning Paths

```groq
*[_type == "learningPath"] | order(_createdAt asc) {
  _id,
  name,
  description,
  icon,
  courses[]->{ "slug": slug.current },
  color
}
```

---

## Mock Data Fallback

When Sanity is not configured, `src/lib/data-service.ts` returns data from `src/lib/mock-data.ts`:

```typescript
const isSanityConfigured = !!client;

export async function getAllCourses(): Promise<Course[]> {
  if (isSanityConfigured && client) {
    try {
      return await client.fetch<Course[]>(allCoursesQuery);
    } catch (error) {
      console.warn("Sanity fetch failed, falling back to mock data:", error);
    }
  }
  return MOCK_COURSES;
}
```

The mock data includes sample courses with modules, lessons, and challenges so the app is fully functional without any CMS setup.

---

## Publishing and CDN

- **Production**: `useCdn: true` serves content from Sanity's global CDN. Updates propagate within ~60 seconds after publishing.
- **Development**: `useCdn: false` always fetches fresh data.
- **Image URLs**: Use `cdn.sanity.io` hostname (configured in `next.config.ts` remote patterns).
- **Draft Preview**: Create a separate preview client with `useCdn: false` and a `SANITY_API_TOKEN` that has draft access for previewing unpublished content.
