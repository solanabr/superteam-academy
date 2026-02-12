# CMS Guide — Sanity Studio

## Setup

1. Create a Sanity project at [sanity.io/manage](https://www.sanity.io/manage)
2. Note your **Project ID** and **Dataset** (default: `production`)
3. Add to your `.env.local`:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your-write-token   # optional, for mutations
   ```
4. Start Sanity Studio:
   ```bash
   cd apps/cms
   pnpm dev
   ```
   Studio runs at **http://localhost:3333**

## Content Schema Overview

```
Course
 └── Module (ordered)
      └── Lesson (ordered)
           ├── Content (rich text)
           ├── Video (URL + transcript)
           ├── Quiz (questions + answers)
           └── Challenge (code + tests)
```

### Schema Files

| File | Type | Description |
|------|------|-------------|
| `schemas/course.ts` | `document` | Top-level course entity |
| `schemas/module.ts` | `document` | Group of lessons within a course |
| `schemas/lesson.ts` | `document` | Individual learning unit |
| `schemas/challenge.ts` | `document` | Code challenge with test cases |

## Creating a New Course — Step by Step

### 1. Create the Course Document
- Open Sanity Studio → **Course** → **Create new**
- Fill in:
  - **Title** — e.g., "Solana Fundamentals"
  - **Slug** — auto-generated or manual (e.g., `solana-fundamentals`)
  - **Description** — 2-3 sentence overview
  - **Difficulty** — `beginner`, `intermediate`, or `advanced`
  - **Duration** — estimated hours
  - **XP** — total XP for completing the course
  - **Thumbnail** — upload a 16:9 image (recommended: 1200×675)
  - **Prerequisites** — list of prior knowledge or course slugs
  - **Status** — set to `draft`

### 2. Create Modules
- Go to **Module** → **Create new**
- Set **Title**, **Order** (1, 2, 3...), and link to the parent **Course**
- Typical structure: 3-8 modules per course

### 3. Create Lessons
For each module, create lessons:

#### Content Lesson
- **Type:** `content`
- **Content:** Rich text (Portable Text) — supports headings, code blocks, images, callouts
- **XP:** 10-25 per lesson

#### Video Lesson
- **Type:** `video`
- **Video URL:** YouTube or Vimeo embed URL
- **Content:** Optional transcript or summary
- **XP:** 15-30 per lesson

#### Quiz Lesson
- **Type:** `quiz`
- **Content:** Question text + answer options in structured format
- **XP:** 20-50 (bonus for perfect score)

#### Challenge Lesson
- **Type:** `challenge`
- Create a linked **Challenge** document with:
  - **Starter Code** — what the student sees initially
  - **Solution** — reference solution
  - **Language** — `rust`, `typescript`, `javascript`
  - **Test Cases** — array of `{ input, expected }` pairs
  - **Hints** — progressive hints (shown on request)
- **XP:** 30-100 per challenge

### 4. Review & Publish
1. Verify all modules and lessons are linked and ordered correctly
2. Preview in the app (draft content visible in dev mode)
3. Change course **Status** to `published`
4. Content is now live in the catalog

## Lesson Types Reference

| Type | Fields | Monaco Editor | XP Range |
|------|--------|:-------------:|----------|
| `content` | title, content (rich text), xp | ❌ | 10-25 |
| `video` | title, videoUrl, content, xp | ❌ | 15-30 |
| `quiz` | title, content (questions), xp | ❌ | 20-50 |
| `challenge` | title, challenge (ref), xp | ✅ | 30-100 |

## Publishing Workflow

```
Draft → Review → Published → (optionally) Archived
```

- **Draft:** Only visible in Studio and dev preview
- **Review:** Ready for peer review (use Sanity's collaboration features)
- **Published:** Live in the course catalog for students
- **Archived:** Hidden from catalog but data preserved

## Media Management

- **Images:** Upload directly in Studio; Sanity CDN serves optimized versions
- **Videos:** Use external hosting (YouTube/Vimeo) — paste embed URLs
- **Code:** Stored as plain text in challenge documents
- Sanity's image pipeline supports: cropping, hotspot, auto-format (WebP)

## Content Localization

Courses support 3 locales: **English**, **Português (BR)**, **Español**.

Approach:
1. Use Sanity's `@sanity/document-internationalization` plugin
2. Each document has locale-specific versions linked by a shared `i18n.base` reference
3. The app resolves the correct locale based on the user's preference
4. Fallback chain: user locale → `en` → first available

To add a translated version:
1. Open a course in Studio
2. Use the language switcher in the document toolbar
3. Fill in translated fields
4. Publish the translated version
