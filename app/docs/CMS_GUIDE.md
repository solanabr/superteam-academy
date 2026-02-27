# CMS guide — Superteam Brazil LMS

How to source course content from a Headless CMS (Sanity, Strapi, Contentful, or similar) and keep the platform structure ready for it.

## Current state

- **Courses** are defined in code: `lib/data/courses.ts`. Each course has: id, slug, title, description, image, instructor, duration, difficulty, topic, xpReward, lessons (array of { id, title, duration, type, content? }).
- **Lesson types**: `video` | `read` | `quiz` | `code`. Lesson content is rendered from markdown (`lesson.content`) using react-markdown with syntax highlighting (rehype-highlight); the code-editor side is a stub ready for CMS-driven content.

The bounty requires a **Headless CMS** (Sanity, Strapi, Contentful, or similar) with:

- Visual content editor with markdown and code blocks
- Media management
- Draft/publish workflow
- Course metadata (difficulty, duration, XP, track association)

This guide describes the **content schema** and **publishing workflow** so you can plug in your CMS.

## Content schema (recommended)

### Course (top-level document)

| Field        | Type     | Notes                                      |
|-------------|----------|--------------------------------------------|
| `id`        | string   | Unique ID (or slug as id)                   |
| `slug`      | string   | URL segment, e.g. `solana-fundamentals`     |
| `title`     | string   | Display title                              |
| `description` | text   | Short description for cards and SEO       |
| `image`     | asset ref | Card/hero image                           |
| `instructor`| string   | Instructor or team name                    |
| `duration`  | string   | e.g. `2h`, `4h`                            |
| `difficulty`| enum     | `beginner` \| `intermediate` \| `advanced`  |
| `topic`     | enum     | `fundamentals` \| `development` \| `defi` \| … |
| `xpReward`  | number   | Total XP for completing the course         |
| `modules`   | array    | List of modules (see below)                  |
| `published` | boolean  | If false, hide from catalog                |

### Module (optional grouping)

| Field     | Type   | Notes                |
|-----------|--------|----------------------|
| `id`      | string | Unique within course |
| `title`   | string | e.g. "Week 1: Basics" |
| `lessons` | array  | Refs or inline lessons |

### Lesson

| Field     | Type   | Notes                                      |
|-----------|--------|--------------------------------------------|
| `id`      | string | Unique within course (e.g. `l1`, `l2`)     |
| `title`   | string | Display title                              |
| `duration`| string | e.g. `15 min`                             |
| `type`    | enum   | `video` \| `read` \| `quiz` \| `code`       |
| `content` | rich text / markdown | Body; code blocks for code lessons |
| `starterCode` | text | Optional; for `code` type                 |
| `hint`    | text   | Optional; expandable hint                  |
| `solution`| text   | Optional; solution toggle                  |

### Media

- **Images**: Course card, hero, lesson images. CMS asset pipeline; frontend uses `next/image` with CMS URL.
- **Videos**: Store URL or embed ID; lesson view can render iframe or player when `type === 'video'`.

## Publishing workflow

1. **Draft**: Create or edit course/modules/lessons in the CMS. Use “Draft” or “Unpublished” so they don’t appear on the site.
2. **Review**: Use CMS preview or a preview deployment (e.g. Vercel preview) to validate.
3. **Publish**: Set `published: true` (or trigger “Publish”). The frontend should only fetch published courses.
4. **Frontend**: Either:
   - **Build-time**: Fetch courses at build (e.g. in `getStaticProps` or during `next build`) and write into `lib/data/courses.ts` or a generated JSON; or
   - **Runtime**: Create an API route (e.g. `GET /api/courses`) that reads from the CMS and returns the same shape as `lib/data/courses.ts`, then have the app call that API and cache as needed.

## Integrating with the app

1. **Data layer**: Replace or complement `lib/data/courses.ts` with a function that fetches from your CMS (REST or GraphQL), maps CMS fields to the existing `Course` and `Lesson` types, and returns the same structure.
2. **Catalog**: `app/courses/page.tsx` and `app/courses/[slug]/page.tsx` already use `courses` and `getCourseBySlug`. Point them to your CMS-backed data source (e.g. `getCourses()`, `getCourseBySlug(slug)` from a new `lib/cms/` or `lib/data/courses-cms.ts`).
3. **Lesson content**: The app already renders `lesson.content` as markdown via `react-markdown` and `rehype-highlight` (see `components/LessonMarkdown.tsx`). Ensure your CMS returns markdown in the same shape; the catalog and lesson pages use `getCourseBySlug` / course data from your CMS-backed source.
4. **Draft/preview**: Use env vars (e.g. `CMS_PREVIEW_SECRET`, `NEXT_PUBLIC_CMS_PREVIEW`) and pass a preview token to the CMS client when in preview mode so editors can see unpublished content.

## Example: Sanity

- **Schema**: Define `course`, `module`, `lesson` document types with the fields above. Use `slug.current` for URL, `array` of references for modules/lessons.
- **GROQ**: Query published courses and resolve lesson content. Export a function that runs the query and maps to `Course[]`.
- **Preview**: Use `usePreviewSubscription` or similar in a layout/page when `NEXT_PUBLIC_CMS_PREVIEW === 'true'`.

## Example: Strapi

- **Content-types**: Course, Module, Lesson with relations (course has many modules, module has many lessons, or course has many lessons directly).
- **REST**: `GET /api/courses?publicationState=live` (or draft for preview). Map response to `Course[]`.
- **Draft & Publish**: Use Strapi’s built-in draft/publish; filter by `publishedAt` on the frontend.

Once the schema and fetch layer are in place, the existing UI (catalog, course detail, lesson view, progress, enrollment) can stay as-is; only the data source changes.
