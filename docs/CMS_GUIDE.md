# CMS Guide

Guide for managing course content in Sanity CMS for Solarium (`solarium.courses`), a Solana developer education platform.

## Overview

All educational content is authored and managed in Sanity v3. The platform fetches content via GROQ queries at request time using Next.js ISR (Incremental Static Regeneration) with a default 1-hour revalidation window. Content editors use Sanity Studio -- a web-based visual editor -- to create and manage courses, modules, lessons, instructors, achievements, and learning paths.

## Content Schema

Six document types are registered in `sanity/schemas/index.ts`:

```
Learning Path
  └── Course (1 or more)
        ├── Instructor (reference)
        └── Module (1 or more, ordered)
              └── Lesson (1 or more, ordered)

Achievement (standalone)
```

### Course

The top-level educational unit.

| Field                   | Type                | Required  | Notes                                                                                        |
| ----------------------- | ------------------- | --------- | -------------------------------------------------------------------------------------------- |
| title                   | string              | Yes       | Course name displayed in UI                                                                  |
| slug                    | slug                | Yes       | Auto-generated from title (max 96 chars), used in URLs                                       |
| description             | text                | No        | 4-line summary for course cards                                                              |
| difficulty              | string (radio)      | Yes       | `beginner`, `intermediate`, `advanced`                                                       |
| duration                | number              | Yes       | Estimated hours to complete (min: 0)                                                         |
| thumbnail               | image               | No        | Course card image, supports hotspot cropping                                                 |
| instructor              | reference           | No        | Links to an Instructor document                                                              |
| tags                    | array of strings    | No        | Free-form tags with tag layout (e.g., "Rust", "DeFi", "Anchor")                              |
| xpReward                | number              | Yes       | XP awarded on course completion (default: 500, min: 0)                                       |
| modules                 | array of references | No        | Ordered list of Module documents                                                             |
| xpPerLesson             | number              | Yes       | XP per lesson completion (default: 10, min: 1, max: 100). Stored on-chain in the Course PDA. |
| trackId                 | number              | No        | Numeric learning track identifier (default: 0 = default track)                               |
| trackLevel              | number              | No        | Position within the track (default: 0 = first)                                               |
| prerequisiteCourse      | reference           | No        | Students must complete this course before enrolling                                          |
| creatorRewardXp         | number              | No        | XP awarded to course creator once min completions threshold is reached (default: 0)          |
| minCompletionsForReward | number              | No        | Student completions required before creator reward is paid. 0 = never. (default: 0)          |
| onChainStatus           | object              | Read-only | Managed by admin dashboard (see [On-Chain Status](#on-chain-status-object))                  |

#### On-Chain Status Object

The `onChainStatus` object on Course documents is **read-only** and only visible to Sanity administrators. It is populated by the admin dashboard after on-chain deployment.

| Sub-field              | Type     | Purpose                                                                                                                                                                                   |
| ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| status                 | string   | Sync state. When set to `"synced"`, the course becomes visible to students.                                                                                                               |
| coursePda              | string   | Base58-encoded Course PDA address on Solana                                                                                                                                               |
| trackCollectionAddress | string   | Metaplex Core collection pubkey for this course's credential NFTs. Populated after the admin creates the track collection on-chain. Required for credential minting at course completion. |
| lastSynced             | datetime | Timestamp of the last successful on-chain sync                                                                                                                                            |
| txSignature            | string   | Solana transaction signature of the deployment                                                                                                                                            |

### Module

A logical grouping of lessons within a course (e.g., "Getting Started", "Advanced Topics").

| Field       | Type                | Required | Notes                                    |
| ----------- | ------------------- | -------- | ---------------------------------------- |
| title       | string              | Yes      | Module name                              |
| description | text                | No       | 3-line summary                           |
| lessons     | array of references | No       | Ordered list of Lesson documents         |
| order       | number              | Yes      | Sort position within the course (min: 0) |

Studio preview shows modules as `{order}. {title}` and supports sorting by order.

### Lesson

The atomic content unit. Lessons can be either **content** (reading/video) or **challenge** (interactive coding exercise).

| Field      | Type             | Required | Notes                                                                                                                    |
| ---------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| title      | string           | Yes      | Lesson name                                                                                                              |
| slug       | slug             | Yes      | Auto-generated from title (max 96 chars), used in URLs                                                                   |
| type       | string (radio)   | Yes      | `content` or `challenge`                                                                                                 |
| language   | string (radio)   | No       | `typescript` or `rust` (default: `typescript`). Only visible for challenge lessons.                                      |
| buildType  | string (radio)   | No       | `standard` (Rust Playground) or `buildable` (Build Server for Anchor/Solana programs). Only visible for Rust challenges. |
| deployable | boolean          | No       | Show "Deploy to Devnet" button after successful build. Only visible for buildable challenges. (default: false)           |
| widgets    | array of strings | No       | Interactive widgets for content lessons: `wallet-funding`, `program-explorer`, `deployed-program-card`                   |
| programIdl | text             | No       | Anchor IDL JSON for program-explorer widget. Must contain non-empty `instructions` array and `metadata.name`.            |
| videoUrl   | url              | No       | YouTube or Vimeo URL (HTTPS only). Supports youtube.com/watch, youtu.be, and vimeo.com links.                            |
| content    | text             | No       | Markdown body for the lesson (20-row editor)                                                                             |
| code       | text             | No       | Starter code (challenge only, hidden for content lessons)                                                                |
| tests      | array of objects | No       | Test cases (challenge only, hidden for content lessons)                                                                  |
| hints      | array of text    | No       | Progressive hints (challenge only, hidden for content lessons)                                                           |
| solution   | text             | No       | Complete solution code (challenge only, hidden for content lessons)                                                      |
| xpReward   | number           | Yes      | XP for completing this lesson (default: 10, min: 0)                                                                      |
| order      | number           | Yes      | Sort position within the module (min: 0)                                                                                 |

Studio preview shows lessons as `{order}. {title}` with subtitle "Challenge" or "Content".

**Test Case Object Fields:**

| Field          | Type    | Required            |
| -------------- | ------- | ------------------- |
| id             | string  | Yes                 |
| description    | string  | Yes                 |
| input          | text    | No                  |
| expectedOutput | text    | No                  |
| hidden         | boolean | No (default: false) |

Hidden tests are run but not displayed to the learner until after submission.

### Instructor

A content author or course creator.

| Field       | Type   | Required | Notes                                                    |
| ----------- | ------ | -------- | -------------------------------------------------------- |
| name        | string | Yes      | Display name                                             |
| avatar      | image  | No       | Profile photo with hotspot cropping                      |
| bio         | text   | No       | Short biography (4-line editor)                          |
| socialLinks | object | No       | Contains `twitter` (string) and `github` (string) fields |

### Learning Path

A curated sequence of courses forming a complete learning journey.

| Field       | Type                | Required | Notes                                                  |
| ----------- | ------------------- | -------- | ------------------------------------------------------ |
| title       | string              | Yes      | Path name                                              |
| slug        | slug                | Yes      | Auto-generated from title (max 96 chars), used in URLs |
| description | text                | No       | What the learner will achieve (4-line editor)          |
| difficulty  | string (radio)      | Yes      | `beginner`, `intermediate`, `advanced`                 |
| courses     | array of references | No       | Ordered list of Course documents                       |

### Achievement

Badges and milestones that learners can unlock. Each achievement can be minted as a soulbound NFT once deployed on-chain.

| Field         | Type          | Required  | Notes                                                                                     |
| ------------- | ------------- | --------- | ----------------------------------------------------------------------------------------- |
| name          | string        | Yes       | Achievement display name                                                                  |
| description   | text          | No        | What the learner did to earn it (3-line editor)                                           |
| icon          | string        | No        | Icon identifier (emoji or icon library name, e.g., `footprints`, `graduation-cap`, `zap`) |
| category      | string (list) | Yes       | `progress`, `streaks`, `skills`, `community`, `special`                                   |
| xpReward      | number        | Yes       | XP awarded when unlocked (default: 50, min: 1)                                            |
| maxSupply     | number        | No        | Maximum times this achievement can be awarded. 0 = unlimited. (default: 0)                |
| metadataUri   | url           | No        | URI for the NFT metadata JSON. Leave blank to use the platform default endpoint.          |
| onChainStatus | object        | Read-only | Managed by admin dashboard (see below)                                                    |

**Achievement On-Chain Status:**

| Sub-field         | Type     | Purpose                                              |
| ----------------- | -------- | ---------------------------------------------------- |
| status            | string   | `"synced"` when deployed on-chain                    |
| achievementPda    | string   | Base58-encoded AchievementType PDA address           |
| collectionAddress | string   | Metaplex Core collection pubkey for achievement NFTs |
| lastSynced        | datetime | Timestamp of last successful sync                    |

## Publishing Workflow

Content in Solarium follows a two-phase publishing model: **CMS-first, then on-chain deployment**. A course is NOT visible to students until both phases are complete.

### Phase 1: Create Content in Sanity

1. Create the course and all its content documents in Sanity Studio (see [Creating a New Course](#creating-a-new-course) below)
2. Publish all documents in Sanity
3. At this point, the course exists in the CMS but is **not yet visible** to students

### Phase 2: Deploy On-Chain via Admin Panel

1. Navigate to the admin panel (`/admin`)
2. The admin panel shows all courses and their sync status
3. Deploy the course on-chain -- this calls on-chain instructions to create the Course PDA, set XP parameters, and register the track
4. The admin panel receives back PDA addresses and transaction signatures
5. The admin panel writes these values back to Sanity via admin mutation functions in `apps/web/src/lib/sanity/admin-mutations.ts`:
   - `writeCourseOnChainStatus(sanityId, status, coursePda, txSignature)` -- sets `onChainStatus.status` to `"synced"`
   - `writeCourseTrackCollection(sanityId, trackCollectionAddress)` -- stores the Metaplex Core collection address
6. Once `onChainStatus.status == "synced"`, GROQ queries include the course and students can see/enroll in it

### The Visibility Gate

Every student-facing GROQ query includes an `onChainStatus.status == "synced"` filter. This is the gate that controls visibility. The exact filter used in `apps/web/src/lib/sanity/queries.ts`:

```groq
*[_type == "course" && onChainStatus.status == "synced"]
```

This filter appears in `getAllCourses`, `getCourseBySlug`, `getLessonBySlug`, `getCourseIdBySlug`, `getCourseLessons`, `getCoursesByIds`, `getRecommendedCourses`, `getAllCourseTags`, and `getAllCourseLessonCounts`.

Admin queries (`getAllCoursesAdmin`, `getAllAchievementsAdmin`) intentionally omit this filter so administrators can see all content regardless of deployment status.

Learning paths also apply this gate per-course:

```groq
"courses": courses[onChainStatus.status == "synced"]->{...}
```

### Achievement Deployment

Achievements follow a similar pattern:

1. Create the Achievement document in Sanity with name, description, icon, category, xpReward, and maxSupply
2. Deploy on-chain via the admin panel (creates AchievementType PDA and collection)
3. Admin panel writes back via `writeAchievementOnChainStatus(sanityId, achievementPda, collectionAddress)` -- sets status to `"synced"`
4. The achievement becomes mintable. The GROQ query `getDeployedAchievements()` filters to `defined(onChainStatus.achievementPda)`

Unlock logic is defined in `apps/web/src/lib/gamification/achievements.ts` in the `UNLOCK_CHECKS` map. Achievement IDs in this map must match Sanity `_id` values minus the `"achievement-"` prefix.

## Creating a New Course

### Step-by-Step

1. **Create the Instructor** (if not already existing):
   - Go to the "Instructor" section in Studio
   - Click "Create new"
   - Fill in: name (required), avatar, bio, social links (twitter, github)
   - Publish

2. **Create the Lessons**:
   - Go to the "Lesson" section
   - For each lesson, create a new document:
     - Set the title and let the slug auto-generate
     - Choose type: "Content" for reading/video or "Challenge" for coding exercises
     - For content lessons: write Markdown content, optionally add a video URL, optionally select embedded widgets
     - For challenges: select the programming language (TypeScript or Rust), add starter code, test cases, hints, and solution
     - For Rust challenges: choose build type (standard for Rust Playground, buildable for Build Server)
     - For buildable challenges: optionally enable the "Deployable" flag
     - Set the XP reward and order number
   - Publish each lesson

3. **Create the Modules**:
   - Go to the "Module" section
   - Create a module for each logical section of the course
   - Add lesson references in the correct order
   - Set the order number (0-based)
   - Publish

4. **Create the Course**:
   - Go to the "Course" section
   - Fill in: title (required), slug (auto-generated), description, difficulty (required), duration (required)
   - Upload a thumbnail image (recommended 16:9 aspect ratio)
   - Link the instructor
   - Add tags (e.g., "solana", "rust", "typescript")
   - Set the XP reward for course completion (default: 500)
   - Set XP per lesson (default: 10, min: 1, max: 100) -- this value is stored on-chain
   - Set track ID and track level if using learning tracks
   - Optionally set prerequisite course, creator reward XP, and min completions
   - Add module references in order
   - Publish

5. **Deploy on-chain** (see [Publishing Workflow](#publishing-workflow)):
   - Go to the admin panel
   - Deploy the course and create its track collection
   - The course becomes visible to students once sync completes

6. **Optionally Create a Learning Path**:
   - Go to the "Learning Path" section
   - Fill in title, slug, description, difficulty
   - Add course references in the desired order
   - Publish

### Challenge Configuration

Challenge lessons have several fields that control the interactive coding experience:

- **Language**: TypeScript (default) or Rust. Determines syntax highlighting and execution environment.
- **Build Type** (Rust only): `standard` runs on the Rust Playground; `buildable` compiles via the Build Server (for Anchor/Solana programs).
- **Deployable** (buildable only): When enabled, shows a "Deploy to Devnet" button after a successful build.
- **Starter Code**: The initial code template shown in the Monaco editor.
- **Test Cases**: Array of test objects with `id`, `description`, `input`, `expectedOutput`, and `hidden` flag. Hidden tests run but are not shown to the learner until submission.
- **Hints**: Progressive hints shown one at a time.
- **Solution**: Complete solution code (accessible after submission or hint exhaustion).

### Content Lesson Widgets

Content lessons can embed interactive widgets via the `widgets` array field:

| Widget                | Value                   | Purpose                                                                                                     |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Wallet Funding        | `wallet-funding`        | Lets students fund their devnet wallet                                                                      |
| Program Explorer      | `program-explorer`      | Interactive program call interface. Requires `programIdl` field to be populated with valid Anchor IDL JSON. |
| Deployed Program Card | `deployed-program-card` | Shows the student's deployed program details                                                                |

### Video Lessons

Any lesson can include a `videoUrl` field (HTTPS YouTube or Vimeo link). The video is rendered as an embedded player above the lesson content.

### Lesson Content (Markdown)

Lesson content is authored as plain Markdown in Sanity's text editor. Standard Markdown features are supported:

- Headings, paragraphs, bold, italic
- Code blocks with language identifiers (e.g., ` ```rust `) for syntax highlighting
- Links, images, lists, blockquotes

## Accessing Sanity Studio

Sanity Studio is configured in `sanity/sanity.config.ts`. It uses separate environment variables from the Next.js app:

| Variable                        | Used by       | Purpose                                  |
| ------------------------------- | ------------- | ---------------------------------------- |
| `SANITY_STUDIO_PROJECT_ID`      | Sanity Studio | Your Sanity project ID                   |
| `SANITY_STUDIO_DATASET`         | Sanity Studio | Dataset name (default: `production`)     |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Next.js app   | Same project ID, consumed by the web app |
| `NEXT_PUBLIC_SANITY_DATASET`    | Next.js app   | Same dataset, consumed by the web app    |

To run Studio locally:

1. Set `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` environment variables (or they default to `placeholder` and `production`).
2. Navigate to the `sanity/` directory and run:
   ```bash
   npx sanity dev
   ```
3. Log in with your Sanity account credentials.

Alternatively, access Studio through the Sanity dashboard at [sanity.io/manage](https://www.sanity.io/manage).

## GROQ Query Patterns

All queries are defined in `apps/web/src/lib/sanity/queries.ts`. The Sanity client uses the `next-sanity` package with ISR revalidation (default: 1 hour).

### Query Functions

| Function                                  | Returns                 | Purpose                                                                         |
| ----------------------------------------- | ----------------------- | ------------------------------------------------------------------------------- |
| `getAllCourses()`                         | `Course[]`              | All synced courses with summarized modules/lessons (no lesson content)          |
| `getCourseBySlug(slug)`                   | `Course \| null`        | Single synced course with full module/lesson hierarchy including content        |
| `getLessonBySlug(courseSlug, lessonSlug)` | `Lesson \| null`        | Single lesson with all fields (content, code, tests, hints, solution)           |
| `getAllLearningPaths()`                   | `LearningPath[]`        | All learning paths with nested synced courses                                   |
| `getCourseById(id)`                       | `Course \| null`        | Course by Sanity `_id` (includes `trackCollectionAddress`). Used by API routes. |
| `getCourseIdBySlug(slug)`                 | `string \| null`        | Lightweight: just the Sanity `_id` for a synced course                          |
| `getCourseLessons(courseSlug)`            | `Lesson[]` (partial)    | Flat list of lesson `_id`, `title`, `slug`, `type` for navigation               |
| `getCoursesByIds(ids)`                    | `CourseSummary[]`       | Course summaries by Sanity `_id` array (for dashboard enrolled courses)         |
| `getRecommendedCourses(excludeIds)`       | `RecommendedCourse[]`   | Synced courses NOT in the given ID set (for dashboard recommendations)          |
| `getAllCourseTags()`                      | `{_id, title, tags}[]`  | Course tags for profile skill radar                                             |
| `getAllCourseLessonCounts()`              | `{_id, totalLessons}[]` | Lesson counts per synced course for completion detection                        |
| `getDeployedAchievements()`               | `DeployedAchievement[]` | Achievements with an on-chain PDA (mintable as NFTs)                            |
| `getAllAchievements()`                    | `DeployedAchievement[]` | All achievements regardless of on-chain status (for unlock checking)            |
| `getAllCoursesAdmin()`                    | `AdminCourse[]`         | All courses with on-chain sync fields (admin dashboard, no sync filter)         |
| `getAllAchievementsAdmin()`               | `AdminAchievement[]`    | All achievements with on-chain sync fields (admin dashboard)                    |
| `getLessonsByIds(ids)`                    | `LessonSummary[]`       | Lesson titles/slugs by `_id` array (for dashboard recent activity)              |

### Key GROQ Patterns

| Pattern              | Example                                         | Purpose                                |
| -------------------- | ----------------------------------------------- | -------------------------------------- |
| Reference resolution | `instructor->{name, bio}`                       | Follow document references             |
| Asset URL extraction | `"thumbnail": thumbnail.asset->url`             | Get image/file URLs from assets        |
| Slug extraction      | `"slug": slug.current`                          | Get the string value from slug objects |
| Ordering             | `\| order(order asc)`                           | Sort arrays by a field                 |
| Filtering            | `*[_type == "course" && slug.current == $slug]` | Query with parameters                  |
| On-chain gate        | `onChainStatus.status == "synced"`              | Only show deployed content             |
| Deep traversal       | `modules[]->lessons[]->`                        | Navigate nested references             |
| Computed fields      | `"totalLessons": count(modules[]->lessons[])`   | Aggregate counts                       |
| Exclusion filter     | `!(_id in $excludeIds)`                         | Exclude documents by ID array          |

## Admin Mutations

Server-side functions in `apps/web/src/lib/sanity/admin-mutations.ts` write back to Sanity after on-chain deployment. These use a separate `SANITY_ADMIN_TOKEN` (write-capable) and bypass the CDN.

| Function                                                                     | Purpose                                                                          |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `writeCourseOnChainStatus(sanityId, status, coursePda, txSignature)`         | Sets `onChainStatus.status`, `coursePda`, `lastSynced`, `txSignature`            |
| `writeCourseTrackCollection(sanityId, trackCollectionAddress)`               | Sets `onChainStatus.trackCollectionAddress`                                      |
| `writeAchievementOnChainStatus(sanityId, achievementPda, collectionAddress)` | Sets achievement `onChainStatus` to `"synced"` with PDA and collection addresses |

## Seeding Content

The project includes seed data in `sanity/seed/` for bootstrapping a development environment.

| File                | Content                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `instructor.json`   | Sample instructors                                                                                              |
| `achievements.json` | All 15 achievement definitions (with xpReward, maxSupply, metadataUri)                                          |
| `lessons.json`      | Sample lessons (content + challenge types)                                                                      |
| `modules.json`      | Sample modules referencing lessons                                                                              |
| `course.json`       | Sample courses referencing modules and instructors (includes trackId, trackLevel, xpPerLesson, creatorRewardXp) |
| `learningPath.json` | Sample learning paths referencing courses                                                                       |

### Running the Seed Script

The import script (`sanity/seed/import.mjs`) reads credentials from `apps/web/.env.local`:

```bash
# Required env vars in apps/web/.env.local:
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-write-token   # Only needed for seeding
```

To run:

```bash
node sanity/seed/import.mjs
```

The script:

1. Verifies the connection to Sanity
2. Imports documents in dependency order (instructors first, then achievements, lessons, modules, courses, learning paths)
3. Uses `createOrReplace` so it is idempotent -- safe to run multiple times
4. Prints a verification summary of document counts per type

`SANITY_API_TOKEN` requires write permissions. Generate one from Sanity's API settings at [sanity.io/manage](https://www.sanity.io/manage). This token is only needed for seeding, not for the running application.

## Content Workflow

### Recommended Workflow

1. **Draft**: Create content in Sanity Studio. Content is saved but not published.
2. **Review**: Share the Sanity preview URL with reviewers.
3. **Publish**: Click "Publish" to make content available to the API.
4. **Deploy on-chain**: Use the admin panel to deploy the course on Solana and sync status back to Sanity.
5. **Live**: Students can now see, enroll in, and complete the course.
6. **Update**: Edit published content. Changes go live within the ISR revalidation window (default: 1 hour). On-chain parameters (xpPerLesson, etc.) require a separate on-chain update via the admin panel.

### Environment-Specific Datasets

| Environment | Dataset                                    | Purpose                         |
| ----------- | ------------------------------------------ | ------------------------------- |
| Development | `production` (or `development` if created) | Local development and testing   |
| Staging     | `production`                               | Preview deployments on Vercel   |
| Production  | `production`                               | Live site at `solarium.courses` |

You can create a separate `development` dataset in Sanity for testing content changes without affecting production. Update the `NEXT_PUBLIC_SANITY_DATASET` and `SANITY_STUDIO_DATASET` environment variables accordingly.

### Caching Behavior

The Sanity client is configured with two layers of caching:

1. **Sanity CDN**: Enabled in production (`useCdn: process.env.NODE_ENV === "production"`). Disabled in development for instant content updates.
2. **Next.js ISR**: All GROQ fetches use `next: { revalidate: 3600 }` (1 hour) by default. Pages are statically generated and revalidated in the background.

Content changes propagate within the revalidation window. For immediate updates during development, CDN is disabled and you can restart the dev server.

## Content Tips

- **Lesson Markdown**: Use standard Markdown. Code blocks with language identifiers (e.g., ` ```rust `) are syntax-highlighted in the UI.
- **Challenge Language**: Always set the programming language field for challenge lessons. It defaults to TypeScript but should be explicitly set to Rust for Rust-based challenges.
- **Build Type**: For Rust challenges that compile Anchor/Solana programs, set build type to "Buildable". Standard challenges use the Rust Playground.
- **Challenge Test Cases**: Write clear descriptions that help the learner understand what is being tested. Use the `hidden` flag for edge-case tests.
- **XP Rewards**: Follow the reward guidelines (10--50 for lessons, 25--100 for challenges, 500--2000 for courses) scaled by difficulty.
- **xpPerLesson**: This is the on-chain XP per lesson completion. It is stored in the Course PDA and must be between 1 and 100.
- **Slugs**: Let them auto-generate from titles. Avoid changing slugs after publication as this breaks existing URLs.
- **Images**: Use high-quality thumbnails with a 16:9 aspect ratio. The hotspot feature lets you control how images are cropped.
- **Seed data conventions**: Achievement `_id` values use the format `achievement-{slug}` (e.g., `achievement-first-steps`). Course `_id` values use `course-{slug}`. These conventions are used by the unlock check system.
