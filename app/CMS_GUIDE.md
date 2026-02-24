# Superteam Academy -- CMS Guide

A practical guide for content editors using Sanity CMS to manage courses, lessons, achievements, and daily challenges.

---

## Getting Started

### Accessing Sanity Studio

Sanity Studio is embedded in the app at the `/studio` route. When running locally:

```
http://localhost:3000/studio
```

For hosted instances, navigate to `https://your-domain.com/studio`. The Studio UI is rendered by `src/app/studio/[[...tool]]/page.tsx` using the `next-sanity` integration.

Alternatively, if the project is deployed to Sanity's hosted Studio, it will be available at `https://your-project.sanity.studio`.

### Required Credentials

Two environment variables control the CMS connection:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Your Sanity project ID (found in your Sanity dashboard) |
| `NEXT_PUBLIC_SANITY_DATASET` | Dataset name (typically `production`) |

Set these in `.env.local` (or your deployment's environment config). Without them, the app falls back to a built-in mock client that serves seed data -- useful for development but not for real content management.

### Creating a Sanity Project

1. Go to [sanity.io](https://www.sanity.io) and sign up / log in.
2. Create a new project from the dashboard.
3. Note your **Project ID** from the project settings page.
4. Create a dataset named `production` (or use the default one).
5. Add your Project ID and dataset name to the environment variables above.
6. Deploy the app -- Sanity Studio will be available at `/studio`.

---

## Content Types

### Track

**What it represents:** A high-level learning path grouping related courses (e.g., "Solana Core", "DeFi", "NFT", "Security").

**Key fields:**

| Field | Purpose |
|---|---|
| `trackId` | Unique identifier string (e.g., `"1"`, `"solana-core"`) |
| `name` | Display name (plain string, not localized) |
| `description` | Short description of the track |
| `icon` | Icon name from the icon set (e.g., `"solana"`, `"shield"`) |
| `color` | Hex color code for visual theming (e.g., `"#9945FF"`) |

**Relationships:** Courses reference a Track via the `track` field. One track can have many courses.

**Tips:**
- Keep track names short and recognizable.
- The `color` field must be a valid hex code (`#RGB` or `#RRGGBB`). This color is used for track badges throughout the UI.
- The `icon` field maps to the app's icon set -- coordinate with the developer for available icon names.

---

### Course

**What it represents:** A complete learning unit containing ordered modules, which in turn contain lessons.

**Key fields:**

| Field | Purpose |
|---|---|
| `courseId` | Unique identifier (e.g., `"solana-101"`). Used in URLs and on-chain enrollment |
| `title` | Localized title (`en`, `pt`, `es`) |
| `description` | Localized description |
| `thumbnail` | Course card image (supports hotspot cropping) |
| `track` | Reference to a Track document |
| `difficulty` | One of `beginner`, `intermediate`, `advanced` |
| `modules` | Ordered array of Module references |
| `prerequisites` | Array of course ID strings for prerequisite courses |
| `skills` | Array of skill strings gained from completion |
| `credentialImage` | Image for the completion credential NFT |
| `xpPerLesson` | Default XP awarded per lesson (default: 25) |
| `lessonCount` | Total lesson count. Must match the actual number of lessons across all modules |

**Relationships:** References one Track. Contains an ordered array of Module references. May reference other courses via `prerequisites`.

**Tips:**
- The `lessonCount` field is critical for on-chain bitmap progress tracking. If it doesn't match the actual number of lessons, progress tracking will break.
- Prerequisites are course ID strings, not document references. Make sure they match exactly.
- The Studio preview shows the English title and the courseId as subtitle.

---

### Module

**What it represents:** A logical section within a course that groups related lessons (e.g., "Getting Started", "Advanced Patterns").

**Key fields:**

| Field | Purpose |
|---|---|
| `title` | Localized title |
| `description` | Localized description |
| `lessons` | Ordered array of Lesson references |
| `order` | Zero-indexed display order within the parent course |

**Relationships:** Referenced by Course. Contains an ordered array of Lesson references.

**Tips:**
- The `order` field determines the display sequence in the curriculum accordion. Start at 0.
- Each module must contain at least one lesson (enforced by validation).
- The Studio preview displays the English title and module number.

---

### Lesson

**What it represents:** A single learning unit with rich content, optionally including an interactive code editor and/or challenge test cases.

**Key fields:**

| Field | Purpose |
|---|---|
| `title` | Localized title |
| `lessonIndex` | Zero-based index matching the on-chain bitmap position |
| `content` | Localized rich text content (block content per locale) |
| `xpReward` | XP awarded on completion. Overrides the course's `xpPerLesson` if set |
| `hasCodeEditor` | Whether this lesson includes a Monaco code editor |
| `starterCode` | Pre-filled code (visible when `hasCodeEditor` is true) |
| `solution` | Reference solution. Hidden from the API -- used for server-side validation only |
| `language` | Code language: `rust`, `typescript`, or `json` |
| `isChallenge` | Whether learners must pass test cases to complete |
| `testCases` | Array of test case objects (visible when `isChallenge` is true) |

**Relationships:** Referenced by Module documents.

**Tips:**
- The `lessonIndex` must be unique across all lessons within a course and must be sequential starting from 0. This index maps directly to the on-chain bitmap for progress tracking.
- Fields like `starterCode`, `solution`, and `language` are conditionally hidden in Studio when `hasCodeEditor` is false. Toggle it on first.
- Test cases are conditionally hidden when `isChallenge` is false.
- The `solution` field is deliberately excluded from the GROQ query that serves lessons to the frontend. It stays server-side only.

---

### Achievement

**What it represents:** A badge/award that learners earn by meeting specific conditions (e.g., completing lessons, maintaining streaks).

**Key fields:**

| Field | Purpose |
|---|---|
| `achievementId` | Unique identifier (e.g., `"first-lesson"`, `"7-day-streak"`) |
| `name` | Localized name |
| `description` | Localized description |
| `icon` | Icon name from the icon set |
| `category` | One of: `learning`, `streak`, `challenge`, `social`, `special` |
| `xpReward` | XP bonus awarded when the achievement is earned |
| `condition.type` | Condition type string (see "Achievement Types" section below) |
| `condition.value` | Numeric threshold to unlock |

**Relationships:** Standalone documents. Evaluated against the learner's context (completed courses, streak days, etc.).

**Tips:**
- Keep achievement IDs descriptive and kebab-cased.
- The `condition.type` must match one of the types the app evaluates (see Achievement Types below).

---

### Daily Challenge

**What it represents:** A time-limited coding challenge active for a specific date.

**Key fields:**

| Field | Purpose |
|---|---|
| `date` | The date this challenge is active (YYYY-MM-DD format) |
| `title` | Localized title |
| `description` | Localized description |
| `difficulty` | One of `beginner`, `intermediate`, `advanced` |
| `xpReward` | XP awarded for completing the challenge |
| `starterCode` | Pre-filled code template |
| `language` | Code language: `rust`, `typescript`, or `json` |
| `testCases` | Array of test case objects for validation |

**Relationships:** Standalone documents. Queried by the app using the current date.

**Tips:**
- Schedule challenges ahead of time by setting future dates.
- Each date should have at most one challenge. The app fetches by exact date match.
- The Studio sorts challenges by date descending for easy management.

---

## Creating a Course (Step-by-Step)

### 1. Create a Track (if it doesn't exist)

Go to Studio > Track > Create New:
- Set a unique `trackId` (e.g., `"5"` or `"governance"`)
- Fill in `name`, `description`, `icon`, and `color`

### 2. Create Lessons

For each lesson in the course, go to Studio > Lesson > Create New:
- Set the `lessonIndex` starting from 0, incrementing for each lesson
- Fill in `title` with all three languages (en, pt, es)
- Write the `content` for all three locales using the rich text editor
- Set the `xpReward` (typically 25-100)
- If the lesson includes coding: enable `hasCodeEditor`, set `starterCode`, `language`, and optionally `solution`
- If it's a challenge lesson: enable `isChallenge`, then add test cases

### 3. Create Modules

Go to Studio > Module > Create New:
- Fill in `title` and `description` (localized)
- Add the lessons you created in step 2 as references, in the correct order
- Set the `order` field (starting from 0)

### 4. Create the Course

Go to Studio > Course > Create New:
- Set a unique `courseId` (e.g., `"solana-201"`)
- Fill in `title` and `description` (localized)
- Upload a `thumbnail` image
- Select the Track reference
- Set `difficulty`
- Add the Module references in order
- Add `skills` and `prerequisites` (if any)
- Set `xpPerLesson` (default fallback for lessons without an explicit xpReward)
- Set `lessonCount` to the total number of lessons across all modules
- Optionally upload a `credentialImage` for the completion NFT

### 5. Verify in the App

- Navigate to the courses page and confirm your new course appears
- Click into the course to verify the curriculum structure
- Open a lesson to check content rendering and code editor functionality
- Test the progression by completing lessons (in development mode)

---

## Internationalization

Every user-facing text field uses the localized helper pattern. In Studio, you will see sub-fields:

- **en** -- English
- **pt** -- Portuguese
- **es** -- Spanish

**All three languages should be filled** for complete i18n support. The app uses `next-intl` for locale routing (`/en/...`, `/pt/...`, `/es/...`).

**Fallback behavior:** If a translation is missing, the app falls back to the English (`en`) value. This means English content is the minimum requirement, but incomplete translations will result in mixed-language pages for non-English users.

The localized helpers are defined in `sanity/schemas/helpers/localized.ts`:
- `localizedString` -- for short text fields (titles, names)
- `localizedText` -- for multi-line text fields (descriptions)
- `localizedBlock` -- for rich text / block content (lesson content)

---

## Code Lessons

To create a lesson with an interactive code editor:

1. Set `hasCodeEditor` to `true` -- this reveals the code-related fields in Studio
2. Provide `starterCode` -- the initial code that appears in the Monaco editor when the lesson loads
3. Set `language` to one of: `rust`, `typescript`, `json` -- this controls syntax highlighting
4. Optionally provide `solution` -- this is hidden from the API response and used only for server-side validation

**Example:** The seed data includes a "Introduction to Solana" lesson with Rust starter code that asks the learner to log a greeting message using `msg!()`.

---

## Challenge Lessons

Challenge lessons require learners to write code that passes automated test cases:

1. Set `isChallenge` to `true` -- this reveals the test cases field
2. Set `hasCodeEditor` to `true` -- challenges always need a code editor
3. Provide `starterCode` with TODO comments guiding the learner
4. Define test cases, each with:

| Test Case Field | Purpose |
|---|---|
| `description` | Human-readable description shown to the learner |
| `input` | Input passed to the learner's code |
| `expectedOutput` | The output the code must produce to pass |
| `points` | Points awarded for passing this test case |
| `hidden` | If `true`, the test case is not shown before submission (anti-cheat) |

**Tip:** Include a mix of visible and hidden test cases. Visible ones guide the learner; hidden ones prevent hardcoded solutions. For example, in the seed data's "Token Vault" challenge, the basic functionality tests are visible while security edge cases (unauthorized access, overflow) are hidden.

---

## Achievement Types

### Categories

| Category | Use For |
|---|---|
| `learning` | Course and lesson completion milestones |
| `streak` | Consecutive daily activity rewards |
| `challenge` | Challenge completion milestones |
| `social` | Forum and community participation |
| `special` | One-off or event-based achievements |

### Condition Types

The app evaluates the following condition types against the learner's context:

| Condition Type | Evaluated Against |
|---|---|
| `lessons_completed` | Total lessons completed |
| `courses_completed` | Total courses finalized |
| `streak_days` | Current consecutive active days |
| `challenges_completed` | Total challenges completed |
| `forum_answers` | Forum answers accepted by other users |
| `total_xp` | Accumulated XP balance |

### XP Reward Guidelines

- **Small milestones** (first lesson, first challenge): 50-100 XP
- **Medium milestones** (10 lessons, 7-day streak): 100-250 XP
- **Large milestones** (course completion, 30-day streak): 250-500 XP
- **Epic achievements** (special events, all courses): 500+ XP

---

## Importing Seed Data

The repository includes seed data as an NDJSON file that can be imported into a fresh Sanity dataset:

```bash
npx sanity dataset import sanity/seed/production.ndjson production --replace
```

**Warning:** The `--replace` flag will overwrite existing documents with matching IDs. Omit it if you want to merge instead.

This populates the CMS with one full track, one course (with 5 lessons across 2 modules), sample achievements, and a daily challenge -- everything needed to see the app working end-to-end.

---

## Development Without Sanity

The app includes a mock client (`src/lib/sanity/mock-client.ts`) that serves built-in seed data when Sanity credentials are not configured. This enables:

- Full local development without a Sanity account
- Running the test suite without external dependencies
- Onboarding new developers immediately

The mock client routes GROQ query patterns to the appropriate seed data exports from `src/lib/sanity/seed-data.ts`. It simulates 100-200ms network latency so loading states remain visible.

To switch to the real CMS, set `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in your environment. The client (`src/lib/sanity/client.ts`) automatically detects these and connects to Sanity.
