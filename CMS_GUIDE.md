# Content Management Guide

This document explains how course content is managed in Superteam Academy, from the static TypeScript catalog to the optional Sanity CMS integration.

## Current State

Course content lives in `app/src/lib/services/courses.ts` as a static TypeScript array. Each course contains modules, and each module contains lessons. This file is the single source of truth when Sanity CMS is not configured.

The static catalog currently includes courses across all six tracks (Rust, Anchor, Frontend, Security, DeFi, Mobile) with full lesson content — reading material, code challenges with starter code and solutions, video references, and quizzes.

## Sanity CMS Integration

The app has built-in Sanity CMS support. When the environment variables `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are set, the async fetchers `fetchCourses()` and `fetchCourseBySlug()` try Sanity first, falling back to the static data if the fetch fails or returns nothing.

### How It Works

The Sanity client is lazy-initialized via a Proxy in `app/src/lib/sanity/client.ts`. It is only created when `isSanityConfigured()` returns `true`, avoiding build errors when the env vars are absent.

```
fetchCourses() / fetchCourseBySlug(slug)
  |
  +-- isSanityConfigured()? --NO--> return static courses[]
  |
  YES
  |
  +-- sanityClient.fetch(query)
  |     |
  |     +-- success + non-empty --> transform via transformSanityCourse() --> return
  |     |
  |     +-- failure or empty ----> return static courses[]
```

GROQ queries are defined in `app/src/lib/sanity/queries.ts`:

- `allCoursesQuery` — fetches all published courses with instructor info and lesson counts
- `courseBySlugQuery` — fetches a single course with full module/lesson structure
- `lessonBySlugQuery` — fetches a single lesson with full content (for future use)

### Environment Variables

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

If `NEXT_PUBLIC_SANITY_PROJECT_ID` is empty or set to `"your_sanity_project_id"`, Sanity is treated as not configured and the static catalog is used.

## Course Structure

All types are defined in `app/src/lib/services/types.ts`.

### Course

| Field             | Type       | Description                                      |
|-------------------|------------|--------------------------------------------------|
| `id`              | `string`   | Unique identifier (e.g., `"intro-solana"`)       |
| `slug`            | `string`   | URL slug (e.g., `"intro-to-solana"`)             |
| `title`           | `string`   | Display title                                    |
| `description`     | `string`   | Short description for catalog cards              |
| `track`           | `Track`    | One of: rust, anchor, frontend, security, defi, mobile |
| `difficulty`      | `Difficulty` | One of: beginner, intermediate, advanced       |
| `lessonCount`     | `number`   | Total number of lessons across all modules       |
| `duration`        | `string`   | Estimated time (e.g., `"4 hours"`)               |
| `xpReward`        | `number`   | XP awarded on course completion                  |
| `creator`         | `string`   | Creator name (e.g., `"SuperteamBR"`)             |
| `imageUrl`        | `string?`  | Optional cover image URL                         |
| `modules`         | `Module[]` | Ordered list of modules                          |
| `prerequisiteId`  | `string?`  | ID of a prerequisite course                      |
| `isActive`        | `boolean`  | Whether the course is visible in the catalog     |
| `totalCompletions`| `number`   | Number of users who completed the course         |
| `enrolledCount`   | `number`   | Number of currently enrolled users               |

### Module

| Field    | Type       | Description                   |
|----------|------------|-------------------------------|
| `id`     | `string`   | Unique identifier             |
| `title`  | `string`   | Module title                  |
| `lessons`| `Lesson[]` | Ordered list of lessons       |

### Lesson

| Field       | Type            | Description                                 |
|-------------|-----------------|---------------------------------------------|
| `id`        | `string`        | Unique identifier                           |
| `title`     | `string`        | Lesson title                                |
| `type`      | `LessonType`    | One of: reading, video, challenge, quiz     |
| `duration`  | `string`        | Estimated time (e.g., `"15 min"`)           |
| `xpReward`  | `number`        | XP awarded on lesson completion             |
| `content`   | `string?`       | Text content (reading/video/quiz)           |
| `challenge` | `CodeChallenge?`| Challenge data (only for type `"challenge"`)|

### CodeChallenge

| Field          | Type         | Description                                   |
|----------------|--------------|-----------------------------------------------|
| `instructions` | `string`     | What the learner needs to do                  |
| `starterCode`  | `string`     | Pre-filled code in the Monaco editor          |
| `solution`     | `string`     | Reference solution                            |
| `testCases`    | `TestCase[]` | Array of test cases with name, input, expectedOutput |
| `language`     | `string`     | `"rust"`, `"typescript"`, or `"javascript"`   |

## Adding a New Course

### Step 1: Define the course object

Open `app/src/lib/services/courses.ts` and add a new entry to the `courses` array:

```typescript
{
  id: "my-new-course",
  slug: "my-new-course",
  title: "My New Course",
  description: "A brief description for the catalog card.",
  track: "frontend",       // see Tracks below
  difficulty: "beginner",  // see Difficulty Levels below
  lessonCount: 6,          // total lessons across all modules
  duration: "3 hours",
  xpReward: 400,
  creator: "Your Name",
  modules: [
    {
      id: "mnc-1",
      title: "Module 1: Getting Started",
      lessons: [
        // ... lessons go here (see Step 2)
      ],
    },
  ],
  isActive: true,
  totalCompletions: 0,
  enrolledCount: 0,
},
```

### Step 2: Add lessons to each module

Each lesson must have a unique `id` within the course. Choose the appropriate `type`:

**Reading lesson:**

```typescript
{
  id: "mnc-1-1",
  title: "Introduction",
  type: "reading",
  duration: "10 min",
  xpReward: 25,
  content: "Your lesson content here. This is plain text that gets rendered in the lesson view. Use \\n for line breaks."
},
```

**Video lesson:**

```typescript
{
  id: "mnc-1-2",
  title: "Watch: Overview",
  type: "video",
  duration: "15 min",
  xpReward: 30,
  content: "A description of the video content. The video URL handling depends on the lesson player component."
},
```

**Challenge lesson:**

```typescript
{
  id: "mnc-1-3",
  title: "Build a Component",
  type: "challenge",
  duration: "20 min",
  xpReward: 50,
  challenge: {
    instructions: "Describe what the learner needs to build.",
    starterCode: "// Pre-filled code\n",
    solution: "// Reference solution\n",
    testCases: [
      { name: "Test description", input: "", expectedOutput: "expected" },
    ],
    language: "typescript",
  },
},
```

**Quiz lesson:**

```typescript
{
  id: "mnc-1-4",
  title: "Quiz: Key Concepts",
  type: "quiz",
  duration: "10 min",
  xpReward: 40,
  content: "Test your knowledge.\n\n1. What is the correct answer?\n   a) Wrong  b) Wrong  c) Correct  d) Wrong\n   Answer: c) Explanation of why this is correct.\n\n2. Another question?\n   a) Option A  b) Option B  c) Option C  d) Option D\n   Answer: b) Explanation here."
},
```

### Step 3: Update the lesson count

Make sure the `lessonCount` field on the course object matches the total number of lessons across all modules.

### Step 4: Optionally add a prerequisite

If the course requires another course to be completed first, set `prerequisiteId` to that course's `id`:

```typescript
prerequisiteId: "intro-solana",
```

## Tracks

| Track      | Description                              |
|------------|------------------------------------------|
| `rust`     | Rust programming and Solana fundamentals |
| `anchor`   | Anchor framework for Solana programs     |
| `frontend` | Frontend development with React/Next.js  |
| `security` | Smart contract security and auditing     |
| `defi`     | Decentralized finance protocols          |
| `mobile`   | Mobile development with Solana           |

Track definitions, labels, and colors are in `app/src/lib/constants.ts`.

## Difficulty Levels

| Level          | Color   | Description                          |
|----------------|---------|--------------------------------------|
| `beginner`     | Green   | No prerequisites, foundational       |
| `intermediate` | Amber   | Requires basic Solana knowledge      |
| `advanced`     | Red     | Requires significant prior experience|

## Achievement System

Achievements are defined in the `achievements` array at the bottom of `courses.ts`. Each achievement has:

| Field         | Type     | Description                                |
|---------------|----------|--------------------------------------------|
| `id`          | `string` | Unique identifier (e.g., `"first-lesson"`) |
| `name`        | `string` | Display name (e.g., `"First Steps"`)       |
| `description` | `string` | How to earn it                             |
| `icon`        | `string` | Lucide icon name                           |
| `xpReward`    | `number` | XP awarded when unlocked                   |
| `category`    | `string` | One of: learning, streak, social, special  |

### Achievement Categories

- **learning** — Tied to course/lesson completion milestones (e.g., "Complete your first lesson", "Complete 10 coding challenges")
- **streak** — Tied to maintaining daily activity streaks (e.g., 7-day streak, 30-day streak)
- **social** — Tied to community activity (e.g., referring friends)
- **special** — Unique accomplishments (e.g., reaching leaderboard top 10, speed-running a course)

To add a new achievement, append to the `achievements` array:

```typescript
{ id: "my-badge", name: "Badge Name", description: "How to earn it", icon: "star", xpReward: 100, category: "learning" },
```

## Content Types

### Reading

Plain text content stored in the `content` field. Rendered in the lesson view with basic text formatting. Use `\n` for paragraph breaks within the string.

### Video

The `content` field contains a description or transcript. Video URL handling is implementation-dependent in the lesson player component.

### Challenge

Interactive coding challenges rendered with a Monaco code editor. The learner writes code against the `starterCode` template and can compare with the `solution`. Test cases describe expected behavior.

The `language` field determines Monaco editor syntax highlighting:
- `"typescript"` — TypeScript/JavaScript challenges
- `"rust"` — Rust/Anchor program challenges
- `"javascript"` — JavaScript challenges

### Quiz

Quizzes are defined as structured text in the `content` field and parsed by the frontend quiz component. The format:

```
1. What consensus mechanism does Solana use alongside Tower BFT?
   a) Proof of Work  b) Proof of Stake  c) Proof of History  d) Proof of Authority
   Answer: c) Proof of History -- a cryptographic clock that timestamps transactions before consensus.

2. What is the maximum size of a Solana transaction?
   a) 256 bytes  b) 1,232 bytes  c) 10,000 bytes  d) 1 MB
   Answer: b) 1,232 bytes -- this limits the number of accounts and instructions per transaction.
```

Each question block has three parts:
1. **Question number and text** — starts with a number and period
2. **Options** — labeled `a)` through `d)`, can be on one line or split across lines
3. **Answer line** — starts with `Answer:` followed by the correct option letter, a closing parenthesis, and an explanation

## i18n for Content

Course content (lesson text, challenge instructions, quiz questions) is currently English-only. It is embedded directly in the TypeScript source and not processed through the i18n system.

The UI chrome (navigation labels, button text, headings, empty states) is translated via `next-intl` message files located in `app/src/messages/`. Available locales: English (`en.json`), Portuguese (`pt-br.json`), Spanish (`es.json`).

To translate course content in the future, you would either:
1. Add locale-aware fields to the static catalog (e.g., `content_pt_br`)
2. Use Sanity CMS with its built-in internationalization support
3. Add a translation layer in the `fetchCourses()` / `fetchCourseBySlug()` functions

## File Reference

| File | Purpose |
|------|---------|
| `app/src/lib/services/types.ts` | TypeScript interfaces for Course, Module, Lesson, etc. |
| `app/src/lib/services/courses.ts` | Static course catalog + achievement definitions + Sanity fetchers |
| `app/src/lib/sanity/client.ts` | Sanity client with lazy initialization and `isSanityConfigured()` |
| `app/src/lib/sanity/queries.ts` | GROQ queries for courses and lessons |
| `app/src/lib/sanity/index.ts` | Re-exports from client and queries |
| `app/src/lib/constants.ts` | Track types, labels, colors, difficulty levels |
