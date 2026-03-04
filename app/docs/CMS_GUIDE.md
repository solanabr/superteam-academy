# CMS Guide - Sanity.io Integration

## Overview

Caminho. uses Sanity.io as its headless CMS for managing all learning content: courses, modules, lessons, and landing page content.

## Content Types

### Track
Learning tracks group related courses into a progression path.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Track name (e.g., "Solana Fundamentals") |
| slug | slug | URL-friendly identifier |
| description | text | Brief description |
| icon | string | Lucide icon name |
| order | number | Display order |

### Course
Individual courses containing modules and lessons.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Course name |
| slug | slug | URL-friendly identifier |
| description | text | Course description |
| difficulty | string | "beginner", "intermediate", or "advanced" |
| duration | string | Estimated time (e.g., "4 hours") |
| xpReward | number | Total XP for completing the course |
| thumbnail | image | Course cover image |
| track | reference | Parent track |
| prerequisites | string[] | List of prerequisite skills/courses |
| tags | string[] | Searchable tags |
| modules | reference[] | Ordered list of modules |

### Module
Organizational unit grouping lessons within a course.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Module name |
| order | number | Sort order within course |
| lessons | reference[] | Ordered list of lessons |

### Lesson
The core content unit - either educational content or a coding challenge.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Lesson title |
| slug | slug | URL-friendly identifier |
| type | string | "content" or "challenge" |
| body | Portable Text | Rich text content (blocks, code, images) |
| estimatedMinutes | number | Estimated completion time |
| xpReward | number | XP awarded on completion |
| order | number | Sort order within module |
| language | string | Code language (rust, typescript, javascript) |
| starterCode | text | Initial code for challenges |
| solutionCode | text | Solution for challenges |
| expectedOutput | text | Expected output for validation |
| hints | string[] | Progressive hints |

## Setting Up Sanity Studio

1. Create a Sanity project at [sanity.io](https://sanity.io)
2. Install Sanity CLI:
   ```bash
   npm install -g @sanity/cli
   npx sanity@latest init --project YOUR_PROJECT_ID --dataset production
   ```
3. Copy the schema definitions from `src/lib/cms/schemas.ts` (see the commented section at the bottom) into your Sanity Studio's `schemaTypes/` folder
4. Deploy the Studio:
   ```bash
   npx sanity deploy
   ```

## API Token

Create an API token in the Sanity management dashboard:
- Go to **Settings > API > Tokens**
- Create a new token with **Editor** permissions
- Add it to your `.env.local` as `SANITY_API_TOKEN`

> Note: Contributor permissions are NOT sufficient for the seeding script. You need Editor or higher.

## Seeding Content

The project includes a seeding script that populates your Sanity project with sample courses:

```bash
node scripts/seed-sanity.mjs
```

This creates:
- 3 learning tracks
- 7 courses across all tracks
- Modules and lessons for each course

## GROQ Queries

All CMS queries are centralized in `src/lib/cms/sanity.ts`:

| Function | Description |
|----------|-------------|
| `getCourses()` | All courses with track info |
| `getTracks()` | All learning tracks with course counts |
| `getCourseBySlug(slug)` | Single course with modules/lessons |
| `getLessonBySlug(courseSlug, lessonSlug)` | Single lesson with full content |

## Caching Strategy

- Course list pages use `revalidate = 60` (ISR, rebuilds every 60 seconds)
- Course detail pages are statically generated with `generateStaticParams`
- Lesson pages are dynamically rendered (always fresh)

## Adding New Content

1. Open your Sanity Studio
2. Create a Track (if needed)
3. Create Lessons with content/challenges
4. Create Modules referencing those lessons
5. Create a Course referencing the modules and track
6. Content appears on the site within 60 seconds (or immediately on dynamic pages)

## Content Modeling Tips

- Keep lesson `body` content modular - use headings (h2, h3) to break up sections
- For challenge-type lessons, always provide `starterCode`, `expectedOutput`, and at least 2 hints
- Set `xpReward` proportional to lesson difficulty (10-50 XP range)
- Use meaningful slugs (e.g., "hello-world" not "lesson-1")
