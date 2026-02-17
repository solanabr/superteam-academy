# CMS Guide

Content management guide for the Superteam Academy frontend.

## Overview

The Superteam Academy uses a **dual-source content architecture**:

1. **Sanity CMS** (primary, optional) -- A headless CMS for managing courses, modules, and lessons through a visual studio interface.
2. **Local Fallback** (built-in) -- Hardcoded course data in `lib/course-catalog.ts` that works without any CMS configuration.

The system selects the data source automatically based on whether `NEXT_PUBLIC_SANITY_PROJECT_ID` is configured:

```
getCourseService()
   |
   ├── Sanity configured? ──Yes──> SanityCourseService (GROQ queries)
   |
   └── No ──> LocalCourseService (hardcoded data)
```

Both implementations share the same `CourseService` interface, so all consuming code works identically regardless of the data source.

## Architecture

### Files

| File | Purpose |
|------|---------|
| `lib/cms/sanity-client.ts` | Sanity client initialization and `isCmsConfigured()` check |
| `lib/cms/sanity-schema.ts` | Sanity document types and transformation functions |
| `lib/cms/content-types.ts` | CMS content type definitions (documentation/reference) |
| `lib/cms/course-service.ts` | Strategy pattern: `SanityCourseService` vs `LocalCourseService` |
| `lib/course-catalog.ts` | Hardcoded course data (local fallback) |

### CourseService Interface

```typescript
interface CourseService {
  getAllCourses(): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  searchCourses(query: string): Promise<Course[]>;
  getCoursesByDifficulty(difficulty: string): Promise<Course[]>;
  getCoursesByTag(tag: string): Promise<Course[]>;
}
```

## Content Schema

### Course (Document)

The top-level content type. Each course appears in the catalog and has its own detail page.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Display name of the course |
| `slug` | slug | Yes | URL-friendly identifier (sourced from title) |
| `description` | text | Yes | Full course description (plain text) |
| `instructor` | string | Yes | Instructor display name |
| `instructorAvatar` | string | No | Two-letter initials or image URL |
| `difficulty` | string | Yes | One of: `"Beginner"`, `"Intermediate"`, `"Advanced"` |
| `duration` | string | Yes | Human-readable total duration (e.g., `"12h 30m"`) |
| `xp` | number | Yes | Total XP awarded for completing the course |
| `rating` | number | No | Average rating (0-5) |
| `tags` | array of string | No | Filterable tags (e.g., `["Solana", "Rust"]`) |
| `thumbnail` | image | No | Course thumbnail image |
| `modules` | array of Module | Yes | Ordered list of course modules |

### Module (Object)

A grouping of related lessons within a course. Modules are displayed as collapsible sections.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Module display name |
| `order` | number | Yes | Sort order within the course (0-indexed) |
| `lessons` | array of Lesson | Yes | Ordered list of lessons in this module |

### Lesson (Object)

An individual learning unit. Each lesson has a type that determines how it renders.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique lesson identifier within the course (e.g., `"1-1"`, `"a-2-3"`) |
| `title` | string | Yes | Lesson display name |
| `type` | string | Yes | One of: `"video"`, `"reading"`, `"challenge"` |
| `duration` | string | Yes | Human-readable duration (e.g., `"15m"`) |
| `content` | markdown/text | No | Lesson body content (for reading lessons) |
| `starterCode` | text | No | Pre-filled code for challenge lessons |
| `testCases` | array of text | No | Expected outputs / assertions for challenges |
| `hints` | array of text | No | Progressive hints for challenges |
| `solution` | text | No | Reference solution for challenges |

## How to Create a New Course in Sanity

### Prerequisites

1. A Sanity project set up at [sanity.io](https://www.sanity.io/).
2. Environment variables configured:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your-token  # Optional, for draft access
   ```

### Step 1: Define the Schema in Sanity Studio

Create the following schema types in your Sanity Studio project:

```javascript
// schemas/lesson.js
export default {
  name: 'lesson',
  type: 'object',
  title: 'Lesson',
  fields: [
    { name: 'id', type: 'string', title: 'Lesson ID',
      description: 'Unique ID within the course (e.g., "1-1")' },
    { name: 'title', type: 'string', title: 'Title' },
    { name: 'type', type: 'string', title: 'Type',
      options: { list: ['video', 'reading', 'challenge'] } },
    { name: 'duration', type: 'string', title: 'Duration',
      description: 'e.g., "15m" or "1h 20m"' },
    { name: 'content', type: 'text', title: 'Content',
      description: 'Markdown content for reading lessons' },
    { name: 'starterCode', type: 'text', title: 'Starter Code',
      description: 'Pre-filled code for challenge lessons' },
    { name: 'testCases', type: 'array', title: 'Test Cases',
      of: [{ type: 'text' }] },
    { name: 'hints', type: 'array', title: 'Hints',
      of: [{ type: 'text' }] },
    { name: 'solution', type: 'text', title: 'Solution',
      description: 'Reference solution (hidden from students)' },
  ],
};

// schemas/module.js
export default {
  name: 'module',
  type: 'object',
  title: 'Module',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    { name: 'order', type: 'number', title: 'Order',
      description: '0-indexed sort order within the course' },
    { name: 'lessons', type: 'array', title: 'Lessons',
      of: [{ type: 'lesson' }] },
  ],
};

// schemas/course.js
export default {
  name: 'course',
  type: 'document',
  title: 'Course',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    { name: 'slug', type: 'slug', title: 'Slug',
      options: { source: 'title' } },
    { name: 'description', type: 'text', title: 'Description' },
    { name: 'instructor', type: 'string', title: 'Instructor' },
    { name: 'instructorAvatar', type: 'string', title: 'Instructor Avatar',
      description: 'Two-letter initials (e.g., "AS")' },
    { name: 'difficulty', type: 'string', title: 'Difficulty',
      options: { list: ['Beginner', 'Intermediate', 'Advanced'] } },
    { name: 'duration', type: 'string', title: 'Duration' },
    { name: 'xp', type: 'number', title: 'XP',
      description: 'Total XP awarded on completion' },
    { name: 'rating', type: 'number', title: 'Rating' },
    { name: 'tags', type: 'array', title: 'Tags',
      of: [{ type: 'string' }] },
    { name: 'thumbnail', type: 'image', title: 'Thumbnail' },
    { name: 'modules', type: 'array', title: 'Modules',
      of: [{ type: 'module' }] },
  ],
};
```

### Step 2: Create a Course Document

In Sanity Studio:

1. Navigate to the **Course** document type.
2. Click **Create new**.
3. Fill in required fields: title, slug, description, instructor, difficulty, duration, xp.
4. Add tags for filtering (e.g., `Solana`, `Rust`, `DeFi`).
5. Upload a thumbnail image.

### Step 3: Add Modules

1. In the course document, click **Add item** in the Modules array.
2. Set the module title and order (starting from 0).
3. Add lessons within the module.

### Step 4: Add Lessons

For each lesson, set the required fields and choose the type:

**Reading Lessons:**
- Set `type` to `"reading"`.
- Write the lesson content in the `content` field (supports markdown).

**Video Lessons:**
- Set `type` to `"video"`.
- Content field can contain a video URL or embed instructions.

**Challenge Lessons (Interactive Coding):**
- Set `type` to `"challenge"`.
- Write starter code in `starterCode`.
- Add test cases, hints, and a solution.

### Step 5: Publish

Click **Publish** in Sanity Studio. The course will be available immediately via the Sanity CDN (or near-immediately if using an API token for draft access).

## Content Types in Detail

### Reading Lessons

Plain text/markdown content rendered in the lesson view. Suitable for conceptual explanations, tutorials, and documentation.

```
type: "reading"
content: "## Account Model\n\nSolana uses an account-based model..."
duration: "12m"
```

### Video Lessons

Video content. The `content` field can contain a video URL or embed code. Duration reflects the video length.

```
type: "video"
content: "https://youtube.com/embed/..."
duration: "25m"
```

### Challenge Lessons (Interactive Coding)

The most complex lesson type. Renders the Monaco code editor with a built-in test runner.

```
type: "challenge"
starterCode: "use anchor_lang::prelude::*;\n\n// TODO: Implement..."
testCases:
  - "Initializes counter to 0"
  - "Sets correct authority"
  - "Increments counter by 1"
hints:
  - "Look at the Counter struct fields"
  - "Use ctx.accounts.counter to access the account"
solution: "pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n..."
duration: "30m"
```

**How test validation works:**

The code editor uses client-side pattern matching to validate challenges. Each test case has a `name` (displayed to the user) and an `expected` string. The test passes if `code.toLowerCase().includes(expected.toLowerCase())`. This is a simplified validation suitable for guided exercises where the user must include specific patterns in their code.

## Challenge Format Reference

| Field | Type | Example |
|-------|------|---------|
| `starterCode` | string | Rust/TypeScript code with TODO comments |
| `testCases` | string[] | `["Initializes counter to 0", "Sets correct authority"]` |
| `hints` | string[] | `["Look at the Counter struct", "Use checked_add"]` |
| `solution` | string | Complete working code |

Test cases in the CMS are stored as strings. Each string is used as both the test name and the expected pattern. For more complex validation, the test case can be a JSON string with separate `name` and `expected` fields.

## Draft/Publish Workflow

Sanity supports a draft/publish workflow:

| State | CDN Access | API Token Access |
|-------|------------|------------------|
| Draft | Not visible | Visible |
| Published | Visible | Visible |

- **Without `SANITY_API_TOKEN`**: The Sanity client uses the CDN (`useCdn: true`) and only sees published documents.
- **With `SANITY_API_TOKEN`**: The client bypasses the CDN (`useCdn: false`) and can access draft documents.

For preview workflows, configure `SANITY_API_TOKEN` in your development or staging environment.

## Media Management

Sanity has built-in media management:

- **Course thumbnails** are stored as Sanity `image` assets.
- The `thumbnail.asset.url` is resolved via GROQ projection: `"thumbnail": thumbnail { asset-> { url } }`.
- If no thumbnail is set, the frontend falls back to `/placeholder.jpg`.
- Images served via the Sanity CDN are automatically optimized.

## Migrating from Hardcoded Data to CMS

The default installation uses hardcoded course data from `lib/course-catalog.ts`. To migrate to Sanity:

### Step 1: Set Up Sanity

1. Create a Sanity project at [sanity.io/manage](https://www.sanity.io/manage).
2. Install Sanity Studio: `npm create sanity@latest`.
3. Add the schema types from "How to Create a New Course" above.

### Step 2: Import Existing Courses

Each course in `lib/course-catalog.ts` can be manually created in Sanity Studio, or you can write a migration script:

```typescript
// Example migration script (run once)
import { createClient } from "@sanity/client";
import { courses } from "./lib/course-catalog";

const client = createClient({
  projectId: "your-project-id",
  dataset: "production",
  token: "your-write-token",
  apiVersion: "2024-01-01",
  useCdn: false,
});

for (const course of courses) {
  await client.create({
    _type: "course",
    title: course.title,
    slug: { _type: "slug", current: course.slug },
    description: course.description,
    instructor: course.instructor,
    instructorAvatar: course.instructorAvatar,
    difficulty: course.difficulty,
    duration: course.duration,
    xp: course.xp,
    rating: course.rating,
    tags: course.tags,
    modules: course.modules.map((mod, i) => ({
      _type: "module",
      _key: `mod-${i}`,
      title: mod.title,
      order: i,
      lessons: mod.lessons.map((lesson, j) => ({
        _type: "lesson",
        _key: `lesson-${i}-${j}`,
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
      })),
    })),
  });
}
```

### Step 3: Configure Environment

Add to `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-read-token  # Optional
```

### Step 4: Verify

Restart the dev server. The `getCourseService()` factory will now return `SanityCourseService` instead of `LocalCourseService`. Verify courses load correctly.

## API Endpoints for Content Retrieval

The frontend does not expose raw CMS data through API routes. Content is fetched server-side:

| Consumer | Method |
|----------|--------|
| Course catalog page | `courseService.getAllCourses()` in Server Component |
| Course detail page | `courseService.getCourseBySlug(slug)` in Server Component |
| Search | `courseService.searchCourses(query)` in Server Component |
| Filter by difficulty | `courseService.getCoursesByDifficulty(difficulty)` in Server Component |
| Filter by tag | `courseService.getCoursesByTag(tag)` in Server Component |

For on-chain course operations, the API routes are:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/academy/courses/ensure` | POST | Ensure a course PDA exists on-chain |
| `/api/academy/progress/complete` | POST | Record lesson completion on-chain |
| `/api/academy/status` | GET | Check enrollment status for a course |

### GROQ Queries

The Sanity implementation uses the following GROQ queries:

```groq
// All courses
*[_type == "course"] | order(title asc) {
  _id, title, "slug": slug, description, instructor, instructorAvatar,
  difficulty, duration, xp, rating, tags,
  "thumbnail": thumbnail { asset-> { url } },
  "modules": modules[] | order(order asc) {
    title, order,
    lessons[] { id, title, type, duration, content, starterCode, testCases, hints, solution }
  }
}

// Course by slug
*[_type == "course" && slug.current == "solana-fundamentals"][0] { ... }

// Search
*[_type == "course" && (title match "solana*" || description match "solana*")] { ... }

// By difficulty
*[_type == "course" && difficulty == "Beginner"] { ... }

// By tag
*[_type == "course" && "Rust" in tags] { ... }
```
