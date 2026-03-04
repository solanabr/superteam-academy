# CMS Guide — Superteam Academy

This guide covers how to manage course content for Superteam Academy. The platform uses a **service abstraction layer** that currently reads from stub data, designed to be swapped for a headless CMS (Sanity, Strapi, Contentful, or similar).

## Content Schema

### Course

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `slug` | string | URL-friendly slug (e.g., `solana-fundamentals`) |
| `title` | string | Course title |
| `description` | string | Short description for cards and SEO |
| `thumbnail` | image URL | Course card thumbnail |
| `difficulty` | `beginner` \| `intermediate` \| `advanced` | Difficulty level |
| `track` | `fundamentals` \| `defi` \| `nft` \| `gaming` \| `infrastructure` \| `security` | Learning track |
| `durationMinutes` | number | Total estimated duration |
| `lessonCount` | number | Total number of lessons |
| `xpReward` | number | XP awarded on course completion |
| `instructor` | Instructor | Course instructor |
| `modules` | Module[] | Ordered list of modules |
| `prerequisites` | string[] | Prerequisite course slugs |
| `learningObjectives` | string[] | What the learner will achieve |
| `tags` | string[] | Searchable tags |
| `isActive` | boolean | Whether visible in catalog |

### Module

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `title` | string | Module title |
| `description` | string | Optional module description |
| `order` | number | Display order within course |
| `durationMinutes` | number | Estimated duration |
| `lessons` | Lesson[] | Ordered list of lessons |

### Lesson

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `title` | string | Lesson title |
| `description` | string | Short description |
| `type` | `content` \| `challenge` \| `video` | Lesson type |
| `order` | number | Display order within module |
| `durationMinutes` | number | Estimated duration |
| `xpReward` | number | XP for completing this lesson |
| `content` | markdown | Lesson body (for content type) |
| `videoUrl` | URL | Video URL (for video type) |
| `challenge` | Challenge | Challenge config (for challenge type) |

### Challenge

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `description` | string | Challenge description |
| `instructions` | string | Step-by-step instructions |
| `starterCode` | string | Pre-populated code |
| `solution` | string | Reference solution |
| `language` | `rust` \| `typescript` \| `json` | Code language |
| `testCases` | TestCase[] | Validation test cases |
| `hints` | string[] | Progressive hints |

### TestCase

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `description` | string | What this test verifies |
| `input` | string | Test input |
| `expectedOutput` | string | Expected result |
| `isHidden` | boolean | Whether visible to learner |

### Instructor

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Display name |
| `avatar` | image URL | Profile picture |
| `bio` | string | Short bio |
| `title` | string | Role/title |

## Current Implementation (Stub Data)

Course data is currently hardcoded in `app/src/services/stub/courses.ts`. The stub contains **6 sample courses** covering all tracks and difficulty levels.

### Where the data lives

```
app/src/services/
├── interfaces.ts          # CourseService interface
├── stub/
│   └── courses.ts         # Mock course data (282 lines)
└── index.ts               # Exports courseService
```

### CourseService Interface

```typescript
interface CourseService {
  getCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>>;
  getCourse(slugOrId: string): Promise<Course | null>;
  getCoursesByTrack(track: Track): Promise<Course[]>;
  searchCourses(query: string): Promise<Course[]>;
  getFeaturedCourses(): Promise<Course[]>;
  getRelatedCourses(courseId: string, limit?: number): Promise<Course[]>;
}
```

## Connecting a Headless CMS

### Option 1: Sanity

1. Install the Sanity client:
   ```bash
   cd app && pnpm add @sanity/client next-sanity
   ```

2. Create schemas matching the content model above in your Sanity studio.

3. Create `app/src/services/sanity/courses.ts` implementing `CourseService`:
   ```typescript
   import { createClient } from '@sanity/client';
   import type { CourseService } from '../interfaces';

   const client = createClient({
     projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
     dataset: 'production',
     apiVersion: '2024-01-01',
     useCdn: true,
   });

   export class SanityCourseService implements CourseService {
     async getCourses(filters) {
       const query = `*[_type == "course" && isActive == true]{ ... }`;
       return client.fetch(query);
     }
     // ... implement remaining methods
   }

   export const courseService = new SanityCourseService();
   ```

4. Swap the export in `services/index.ts`:
   ```typescript
   export { courseService } from "./sanity/courses";
   ```

### Option 2: Strapi

1. Install the Strapi SDK:
   ```bash
   cd app && pnpm add @strapi/strapi
   ```

2. Create content types in Strapi admin matching the schema above.

3. Create `app/src/services/strapi/courses.ts` implementing `CourseService`.

4. Swap the export.

### Option 3: Contentful

Same pattern — install `contentful`, create content model, implement the interface, swap the export.

## Content Authoring Workflow

### Creating a New Course

1. **Define the course** — title, slug, description, track, difficulty, XP reward
2. **Create modules** — ordered sections within the course
3. **Add lessons** to each module:
   - **Content lessons**: Write markdown with code blocks
   - **Video lessons**: Add video URL
   - **Challenge lessons**: Define starter code, solution, test cases, hints
4. **Set prerequisites** — link to courses that should be completed first
5. **Publish** — set `isActive: true`

### Writing Lesson Content

Lesson content supports full Markdown:

```markdown
# Understanding PDAs

Program Derived Addresses (PDAs) are deterministic addresses
derived from a set of seeds and a program ID.

## Finding a PDA

\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(
    &[b"config"],
    &program_id,
);
\`\`\`

> **Note**: PDAs don't have private keys — only the program
> that derived them can sign on their behalf.
```

### Creating Challenges

A challenge needs:

1. **Clear instructions** — what the learner should build
2. **Starter code** — pre-populated template
3. **Test cases** — at least 2 visible + 1 hidden
4. **Solution** — reference implementation (hidden by default)
5. **Hints** — progressive hints, revealed one at a time

Example test case:
```json
{
  "description": "Should derive the correct PDA",
  "input": "seeds: [\"config\"]",
  "expectedOutput": "PDA matches expected address",
  "isHidden": false
}
```

## Adding a Sample Course

To add a course to the stub data:

1. Open `app/src/services/stub/courses.ts`
2. Add a new object to the `stubCourses` array following the `Course` type
3. Include at least one module with one lesson of each type

The stub service automatically handles filtering, search, and pagination.
