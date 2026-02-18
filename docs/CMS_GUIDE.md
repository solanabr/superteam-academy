# CMS Guide

Guide for managing course content in Sanity CMS for Superteam Academy (`solarium.courses`), a Solana developer education platform built by Superteam Brazil.

## Overview

All educational content is authored and managed in Sanity v3. The LMS fetches content via GROQ queries at request time using Next.js ISR (Incremental Static Regeneration) with a default 1-hour revalidation window. Content editors use Sanity Studio -- a web-based visual editor -- to create and manage courses, modules, lessons, instructors, and achievements.

## Schema Overview

The CMS has six document types organized in a hierarchical structure:

```
Learning Path
  └── Course (1 or more)
        ├── Instructor (reference)
        └── Module (1 or more, ordered)
              └── Lesson (1 or more, ordered)

Achievement (standalone)
```

All schema definitions live in `sanity/schemas/` and are registered in `sanity/schemas/index.ts`.

### Course

The top-level educational unit. Each course has a title, slug, description, difficulty level, estimated duration, instructor, tags, XP reward, and an ordered list of modules.

| Field       | Type                | Required | Notes                                                           |
| ----------- | ------------------- | -------- | --------------------------------------------------------------- |
| title       | string              | Yes      | Course name displayed in UI                                     |
| slug        | slug                | Yes      | Auto-generated from title (max 96 chars), used in URLs          |
| description | text                | No       | 4-line summary for course cards                                 |
| difficulty  | string (radio)      | Yes      | `beginner`, `intermediate`, `advanced`                          |
| duration    | number              | Yes      | Estimated hours to complete (min: 0)                            |
| thumbnail   | image               | No       | Course card image, supports hotspot cropping                    |
| instructor  | reference           | No       | Links to an Instructor document                                 |
| tags        | array of strings    | No       | Free-form tags with tag layout (e.g., "Rust", "DeFi", "Anchor") |
| xpReward    | number              | Yes      | XP awarded on course completion (default: 500, min: 0)          |
| modules     | array of references | No       | Ordered list of Module documents                                |

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

| Field    | Type             | Required | Notes                                                                               |
| -------- | ---------------- | -------- | ----------------------------------------------------------------------------------- |
| title    | string           | Yes      | Lesson name                                                                         |
| slug     | slug             | Yes      | Auto-generated from title (max 96 chars), used in URLs                              |
| type     | string (radio)   | Yes      | `content` or `challenge`                                                            |
| language | string (radio)   | No       | `typescript` or `rust` (default: `typescript`). Only visible for challenge lessons. |
| content  | text             | No       | Markdown body for the lesson (20-row editor)                                        |
| code     | text             | No       | Starter code (challenge only, hidden for content lessons)                           |
| tests    | array of objects | No       | Test cases (challenge only, hidden for content lessons)                             |
| hints    | array of text    | No       | Progressive hints (challenge only, hidden for content lessons)                      |
| solution | text             | No       | Complete solution code (challenge only, hidden for content lessons)                 |
| xpReward | number           | Yes      | XP for completing this lesson (default: 10, min: 0)                                 |
| order    | number           | Yes      | Sort position within the module (min: 0)                                            |

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

Badges and milestones that learners can unlock.

| Field       | Type          | Required | Notes                                                   |
| ----------- | ------------- | -------- | ------------------------------------------------------- |
| name        | string        | Yes      | Achievement display name                                |
| description | text          | No       | What the learner did to earn it (3-line editor)         |
| icon        | string        | No       | Icon identifier (emoji or icon library name)            |
| category    | string (list) | Yes      | `progress`, `streaks`, `skills`, `community`, `special` |

## How to Add/Edit Content

### Accessing Sanity Studio

Sanity Studio is configured in `sanity/sanity.config.ts`. It uses separate environment variables from the Next.js app:

| Variable                        | Used by       | Purpose                                  |
| ------------------------------- | ------------- | ---------------------------------------- |
| `SANITY_STUDIO_PROJECT_ID`      | Sanity Studio | Your Sanity project ID                   |
| `SANITY_STUDIO_DATASET`         | Sanity Studio | Dataset name (default: `production`)     |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Next.js app   | Same project ID, consumed by the web app |
| `NEXT_PUBLIC_SANITY_DATASET`    | Next.js app   | Same dataset, consumed by the web app    |

To run Studio locally:

1. Set the `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` environment variables (or they default to `placeholder` and `production`).
2. Navigate to the `sanity/` directory and run:
   ```bash
   npx sanity dev
   ```
3. Log in with your Sanity account credentials.

Alternatively, access Studio through the Sanity dashboard at [sanity.io/manage](https://www.sanity.io/manage).

### Creating a New Course

1. **Create the Instructor** (if not already existing):
   - Go to the "Instructor" section in Studio
   - Click "Create new"
   - Fill in name, avatar, bio, and social links
   - Publish

2. **Create the Lessons**:
   - Go to the "Lesson" section
   - For each lesson, create a new document:
     - Set the title and let the slug auto-generate
     - Choose type: "Content" for reading or "Challenge" for coding exercises
     - For challenges: select the programming language (TypeScript or Rust), add starter code, test cases, hints, and solution
     - Write the markdown content
     - Set the XP reward and order number
   - Publish each lesson

3. **Create the Modules**:
   - Go to the "Module" section
   - Create a module for each logical section of the course
   - Add lesson references in the correct order
   - Set the order number
   - Publish

4. **Create the Course**:
   - Go to the "Course" section
   - Fill in title, description, difficulty, duration
   - Upload a thumbnail image
   - Link the instructor
   - Add tags
   - Set the XP reward
   - Add module references in order
   - Publish

5. **Optionally Create a Learning Path**:
   - Go to the "Learning Path" section
   - Add the new course alongside related courses
   - Publish

### Editing Existing Content

1. Navigate to the document in Sanity Studio
2. Make your changes in the editor
3. The real-time preview (if configured) shows changes immediately
4. Click "Publish" to make changes live

### Content Tips

- **Lesson Markdown**: Use standard Markdown. Code blocks with language identifiers (e.g., ` ```rust `) are syntax-highlighted in the UI.
- **Challenge Language**: Always set the programming language field for challenge lessons. It defaults to TypeScript but should be explicitly set to Rust for Rust-based challenges.
- **Challenge Test Cases**: Write clear descriptions that help the learner understand what is being tested. Use the `hidden` flag for edge-case tests.
- **XP Rewards**: Follow the reward guidelines (10--50 for lessons, 25--100 for challenges, 500--2000 for courses) scaled by difficulty.
- **Slugs**: Let them auto-generate from titles. Avoid changing slugs after publication as this breaks existing URLs.
- **Images**: Use high-quality thumbnails with a 16:9 aspect ratio. The hotspot feature lets you control how images are cropped.

## Seeding Content

The project includes seed data in `sanity/seed/` for bootstrapping a development environment. Seed files:

| File                | Content                                            |
| ------------------- | -------------------------------------------------- |
| `instructor.json`   | Sample instructors                                 |
| `achievements.json` | All 15 achievement definitions                     |
| `lessons.json`      | Sample lessons (content + challenge types)         |
| `modules.json`      | Sample modules referencing lessons                 |
| `course.json`       | Sample courses referencing modules and instructors |
| `learningPath.json` | Sample learning paths referencing courses          |

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

**Note:** `SANITY_API_TOKEN` requires write permissions. Generate one from Sanity's API settings at [sanity.io/manage](https://www.sanity.io/manage). This token is only needed for seeding, not for the running application.

## GROQ Query Patterns

The application fetches content from Sanity using GROQ (Graph-Relational Object Queries). All queries are defined in `apps/web/src/lib/sanity/queries.ts`. The Sanity client (`apps/web/src/lib/sanity/client.ts`) uses the `next-sanity` package with ISR revalidation (default: 1 hour).

### Query Functions

The following query functions are available:

| Function                                  | Returns                 | Purpose                                                                 |
| ----------------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `getAllCourses()`                         | `Course[]`              | All courses with summarized modules/lessons (no lesson content)         |
| `getCourseBySlug(slug)`                   | `Course \| null`        | Single course with full module/lesson hierarchy including content       |
| `getLessonBySlug(courseSlug, lessonSlug)` | `Lesson \| null`        | Single lesson with all fields (content, code, tests, hints, solution)   |
| `getAllLearningPaths()`                   | `LearningPath[]`        | All learning paths with nested courses and summarized modules           |
| `getCourseIdBySlug(slug)`                 | `string \| null`        | Lightweight: just the Sanity `_id` for a course                         |
| `getCourseLessons(courseSlug)`            | `Lesson[]` (partial)    | Flat list of lesson `_id`, `title`, `slug`, `type` for navigation       |
| `getCoursesByIds(ids)`                    | `CourseSummary[]`       | Course summaries by Sanity `_id` array (for dashboard enrolled courses) |
| `getRecommendedCourses(excludeIds)`       | `RecommendedCourse[]`   | Courses NOT in the given ID set (for dashboard recommendations)         |
| `getAllCourseTags()`                      | `{_id, title, tags}[]`  | Course tags for profile skill radar                                     |
| `getAllCourseLessonCounts()`              | `{_id, totalLessons}[]` | Lesson counts per course for completion detection                       |

### Example: Get All Courses (summarized)

```groq
*[_type == "course"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  difficulty,
  duration,
  "thumbnail": thumbnail.asset->url,
  instructor->{
    name,
    "avatar": avatar.asset->url,
    bio,
    socialLinks
  },
  tags,
  xpReward,
  "modules": modules[]->{
    _id, title, description, order,
    "lessons": lessons[]->{
      _id, title, "slug": slug.current, type, xpReward, order
    } | order(order asc)
  } | order(order asc)
}
```

Lesson content (markdown, code, tests, hints, solution) is intentionally omitted on listing pages to minimize payload size.

### Example: Get Single Course by Slug (full content)

```groq
*[_type == "course" && slug.current == $slug][0] {
  ...,  // all course fields
  "modules": modules[]->{
    _id, title, description, order,
    lessons[]->{
      _id, title, "slug": slug.current, type, language,
      content, code, tests, hints, solution, xpReward, order
    } | order(order asc)
  } | order(order asc)
}
```

Full lesson content is only fetched on the individual course/lesson page.

### Example: Get Lesson by Slug (within a course)

```groq
*[_type == "course" && slug.current == $courseSlug][0] {
  "allLessons": modules[]->lessons[]->{
    _id, title, "slug": slug.current, type, language,
    content, code, tests, hints, solution, xpReward, order
  }
}.allLessons[slug == $lessonSlug][0]
```

This flattens all lessons from all modules in the course, then filters to find the target lesson by slug.

### Key GROQ Patterns Used

| Pattern              | Example                                         | Purpose                                |
| -------------------- | ----------------------------------------------- | -------------------------------------- |
| Reference resolution | `instructor->{name, bio}`                       | Follow document references             |
| Asset URL extraction | `"thumbnail": thumbnail.asset->url`             | Get image/file URLs from assets        |
| Slug extraction      | `"slug": slug.current`                          | Get the string value from slug objects |
| Ordering             | `\| order(order asc)`                           | Sort arrays by a field                 |
| Filtering            | `*[_type == "course" && slug.current == $slug]` | Query with parameters                  |
| Deep traversal       | `modules[]->lessons[]->`                        | Navigate nested references             |
| Computed fields      | `"totalLessons": count(modules[]->lessons[])`   | Aggregate counts                       |
| Exclusion filter     | `!(_id in $excludeIds)`                         | Exclude documents by ID array          |

## Content Workflow

### Recommended Workflow

1. **Draft**: Create content in Sanity Studio. Content is saved but not published.
2. **Review**: Share the Sanity preview URL with reviewers.
3. **Publish**: Click "Publish" to make content available to the API.
4. **Update**: Edit published content. Changes go live within the ISR revalidation window (default: 1 hour).

### Environment-Specific Datasets

| Environment | Dataset                                    | Purpose                         |
| ----------- | ------------------------------------------ | ------------------------------- |
| Development | `production` (or `development` if created) | Local development and testing   |
| Staging     | `production`                               | Preview deployments on Vercel   |
| Production  | `production`                               | Live site at `solarium.courses` |

You can create a separate `development` dataset in Sanity for testing content changes without affecting production. Update the `NEXT_PUBLIC_SANITY_DATASET` and `SANITY_STUDIO_DATASET` environment variables accordingly.

### Caching Behavior

The Sanity client (`apps/web/src/lib/sanity/client.ts`) is configured with two layers of caching:

1. **Sanity CDN**: Enabled in production (`useCdn: process.env.NODE_ENV === "production"`). Disabled in development for instant content updates.
2. **Next.js ISR**: All GROQ fetches use `next: { revalidate: 3600 }` (1 hour) by default. Pages are statically generated and revalidated in the background.

Content changes propagate within the revalidation window. For immediate updates during development, CDN is disabled and you can restart the dev server.
