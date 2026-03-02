# CMS Guide

How to manage course content in Superteam Academy using Payload CMS.

## Overview

Superteam Academy uses [Payload CMS v3](https://payloadcms.com/) embedded directly in the Next.js application. The admin panel lives at `/cms` and the REST API at `/cms-api`. Content is stored in PostgreSQL (in a separate `payload` schema from the app's Prisma schema).

When Payload has no courses, the app falls back to Prisma data, then to mock data from `src/lib/mock-data.ts` automatically.

### Content Model

```
Course
  ├── metadata (title, slug, difficulty, duration, track, tags, xpTotal)
  ├── thumbnail (upload → Media)
  └── modules[] (inline array)
        └── lessons[] (inline array)
              ├── content (Lexical rich text — for reading lessons)
              ├── videoUrl (embed URL — for video lessons)
              └── challenge (group — for coding exercise lessons)
                    ├── prompt (Lexical rich text)
                    ├── starterCode
                    ├── testCases[] (min 1)
                    ├── hints[]
                    └── solution
```

All content is **inline** (nested arrays inside the Course document), not separate referenced documents. This means creating a course is a single-document workflow.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Shared with Prisma — Payload uses a separate `payload` schema. |
| `PAYLOAD_SECRET` | Yes | Random 32+ character string for encrypting auth tokens. Generate with `openssl rand -hex 16`. |

```bash
# In app/.env.local
DATABASE_URL=postgresql://user:password@localhost:5432/superteam_academy
PAYLOAD_SECRET=your-random-32-char-secret-here
```

---

## Admin Panel

### First-Time Setup

1. Start the dev server: `pnpm dev`
2. Navigate to `http://localhost:3000/cms`
3. You'll be prompted to create the first admin user (email + password)
4. After creating your account, you'll be logged into the admin panel

### Authentication

The admin panel requires login. Users are managed in the **Users** collection with two roles:

| Role | Permissions |
|------|------------|
| **Admin** | Full access to all collections and settings |
| **Editor** | Can create and edit courses and media |

To create additional users, go to `/cms` > Users > Create New.

### Navigation

- **Dashboard** — Overview of all collections
- **Courses** — Create and manage courses (the main content)
- **Media** — Upload and manage images
- **Users** — Manage CMS admin accounts

---

## Content Schema

### Course

The top-level content document. Each course belongs to a track and difficulty level.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | text | Yes | Course name displayed in catalog and detail pages |
| `slug` | text (auto, read-only) | Auto | URL-safe identifier, auto-generated from title |
| `description` | textarea | No | 1-3 sentence summary shown on course cards |
| `thumbnail` | upload (Media) | No | Course card image |
| `difficulty` | select | No | `beginner`, `intermediate`, or `advanced` |
| `duration` | text | No | Estimated time, e.g. "8 hours" |
| `xpTotal` | number (read-only) | Auto | Auto-computed sum of all lesson XP rewards |
| `isActive` | checkbox | No | Defaults to `true`. Uncheck to hide from catalog |
| `trackId` | number | No | Matches on-chain track registry (0-6) |
| `trackLevel` | number | No | Position within the track (1, 2, 3...) |
| `trackName` | text | No | Display name for the track |
| `creator` | text | No | Author or organization name |
| `creatorAvatar` | text | No | URL to creator's avatar image |
| `tags` | array of text | No | Searchable tags (e.g. "rust", "defi", "security") |
| `prerequisites` | array of slugs | No | Course slugs that should be completed first |
| `modules` | array (min 1) | Yes | Ordered list of modules (see below) |

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

### Module (inline in Course)

A logical grouping of lessons. Displayed as accordion sections on the course detail page.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | text | Yes | Module heading |
| `description` | textarea | No | Brief summary of what the module covers |
| `order` | number | No | Sort position within the course (0-based) |
| `lessons` | array (min 1) | Yes | Ordered list of lessons |

### Lesson (inline in Module)

An individual learning unit. Set the `type` field to control which fields appear.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | text | Yes | Lesson name |
| `description` | textarea | No | One-line description |
| `type` | select | No | `content` (reading/video) or `challenge` (coding exercise) |
| `order` | number | No | Sort position within the module |
| `xpReward` | number | No | XP granted on completion |
| `duration` | text | No | Estimated time, e.g. "20 min" |
| `videoUrl` | text | No | YouTube/Vimeo embed URL (only shown for content lessons) |
| `content` | rich text (Lexical) | No | Rich text body with headings, code blocks, lists, links |
| `challenge` | group | No | Challenge fields (only shown for challenge lessons) |

### Challenge (group within Lesson)

Appears only when `type` is set to `challenge`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | rich text (Lexical) | No | The problem statement shown to the learner |
| `starterCode` | code | Yes | Pre-filled code in the editor |
| `language` | select | No | `rust`, `typescript`, or `json` |
| `hints` | array of text | No | Progressive hints revealed on request |
| `solution` | code | No | Reference solution (hidden until revealed) |
| `testCases` | array (min 1) | Yes | Each has `name` (required), `input`, `expectedOutput` (required) |

### Media

Upload collection for course images.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `alt` | text | Yes | Accessibility description for screen readers |

**Accepted formats:** PNG, JPEG, WebP, SVG, GIF

**Auto-generated sizes:** thumbnail (400x300), card (768x432), hero (1920px wide)

---

## Draft/Publish Workflow

Payload is configured with **versioning and drafts**:

- **Autosave** — Drafts save automatically every 2 seconds while editing
- **Versions** — Up to 50 versions are kept per course document
- **Draft vs Published** — Use the "Save Draft" button to save without publishing. Use "Publish" to make content live.
- **Version History** — Click the "Versions" tab on any course to view and restore previous versions

### Publishing Flow

1. Create or edit a course (it starts as a draft)
2. Preview your changes by checking the frontend (revalidation happens automatically on publish)
3. Click **Publish** when ready — the frontend will serve the new content immediately
4. To unpublish, use the **Unpublish** action from the document controls

### Revalidation

When a course is published or updated, the app automatically revalidates the relevant Next.js pages:
- `/courses` (course catalog)
- `/courses/[slug]` (the specific course page)
- `/` (landing page)

No manual cache clearing is needed.

---

## Course Creation Workflow

Since all content is inline (modules and lessons are nested inside the course document), creation is a single-document workflow:

### Step 1: Upload Media

1. Go to `/cms` > **Media** > **Create New**
2. Upload the course thumbnail image
3. Fill in the `alt` text (required)
4. Save

### Step 2: Create the Course

1. Go to `/cms` > **Courses** > **Create New**
2. Fill in the **title** — the slug auto-generates (read-only)
3. Add a **description** and select the **thumbnail** you uploaded
4. Set **difficulty** and estimated **duration**
5. Set **track** fields (`trackId`, `trackLevel`, `trackName`)
6. Fill in **creator** name and optional avatar URL

### Step 3: Add Modules

1. Scroll to the **Modules** section
2. Click **Add Module**
3. Enter the module **title** and optional description
4. Set the **order** number (0-based)

### Step 4: Add Lessons to Each Module

1. Inside a module, click **Add Lesson**
2. Enter the lesson **title**
3. Set the **type**:
   - **Content** — Write rich text in the content editor. Optionally add a video URL.
   - **Challenge** — Fill in the challenge group: prompt, starter code, language, test cases, hints, solution
4. Set the **XP reward** (the course's total XP auto-computes)
5. Set the **order** and estimated duration

### Step 5: Publish

1. Review all modules and lessons
2. Ensure `isActive` is checked
3. Click **Publish**
4. The course appears on the frontend immediately

---

## Rich Text Editor

The content editor uses [Lexical](https://lexical.dev/) with these features:

- **Headings** — H1, H2, H3
- **Formatting** — Bold, italic, underline, strikethrough, inline code
- **Lists** — Ordered and unordered
- **Blockquotes**
- **Links** — Internal and external
- **Horizontal rules**
- **Code blocks** — Full syntax-highlighted code blocks with language selection

Challenge prompts use a limited editor (H2/H3, bold, italic, inline code, lists, code blocks).

The frontend detects HTML output from Lexical and renders it directly. Markdown content (from older data) is rendered via ReactMarkdown.

---

## REST API

The Payload REST API is available at `/cms-api`. All standard CRUD operations are supported:

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cms-api/courses` | List all courses |
| GET | `/cms-api/courses?where[isActive][equals]=true` | List active courses |
| GET | `/cms-api/courses?where[slug][equals]=my-course` | Find course by slug |
| POST | `/cms-api/courses` | Create a new course |
| PATCH | `/cms-api/courses/:id` | Update a course |
| DELETE | `/cms-api/courses/:id` | Delete a course |
| GET | `/cms-api/media` | List all media |
| POST | `/cms-api/media` | Upload media (multipart form) |

All mutating endpoints require authentication. Pass the auth token as a cookie or `Authorization: JWT <token>` header.

### Authentication

```bash
# Login to get a token
curl -X POST http://localhost:3000/cms-api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your-password"}'

# Use the token
curl http://localhost:3000/cms-api/courses \
  -H "Authorization: JWT <token-from-login>"
```

---

## Seed Data

A seed script creates a demo course with modules, lessons, and challenges:

```bash
pnpm db:seed-payload
```

This creates the "Building on Solana: Hands-On" course with:
- 2 modules (Solana Fundamentals, Writing Programs with Anchor)
- 4 lessons (3 content + 1 challenge)
- Full Lexical rich-text content
- A coding challenge with starter code, hints, solution, and test cases

---

## Data Fallback Chain

The frontend data service (`src/lib/data-service.ts`) uses a three-tier fallback:

```
1. Payload CMS (primary) — queries via Payload Local API
       ↓ (if no results or error)
2. Prisma database — queries the app's PostgreSQL tables
       ↓ (if no results)
3. Mock data — static data from src/lib/mock-data.ts
```

This means the app is fully functional even without any CMS content configured.

---

## Media Storage (S3)

By default, media uploads are stored locally in `./public/cms-media`. For production (especially on Vercel where local storage is ephemeral), configure S3:

```bash
# In app/.env.local
S3_BUCKET=superteam-academy-media
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...
```

The plugin auto-enables when all four variables are set. When they're missing, it falls back to local storage — no code changes needed.

### S3-compatible providers

For Cloudflare R2, MinIO, DigitalOcean Spaces, or similar, also set `S3_ENDPOINT`:

```bash
# Cloudflare R2 example
S3_BUCKET=superteam-academy-media
S3_REGION=auto
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

### Bucket permissions

The S3 bucket needs to allow public read access for serving images. For AWS S3, disable "Block all public access" and add a bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::superteam-academy-media/*"
    }
  ]
}
```

---

## Troubleshooting

### "Cannot connect to database"
Ensure `DATABASE_URL` is set and the PostgreSQL server is running. Payload uses the same database as Prisma but in a separate `payload` schema.

### "Login page shows instead of dashboard"
This is expected — the admin panel requires authentication. Create your first user on the login screen.

### "Uploaded images disappear after deploy"
Set the S3 environment variables (see Media Storage section above). Without S3, uploads are stored in `./public/cms-media` which is ephemeral on Vercel.

### "Changes don't appear on frontend"
Course changes trigger automatic revalidation. If content is still stale, try a hard refresh or check that the course's `isActive` flag is enabled and the document is published (not draft).

### "XP total seems wrong"
`xpTotal` is auto-computed from lesson XP rewards on every save. Check that each lesson has the correct `xpReward` value.
