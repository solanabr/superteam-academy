# Superteam Academy — CMS Guide

This guide explains how to manage course content through Sanity Studio.

## Quick Start

### 1. Log in to Sanity

```bash
cd app
npx sanity login
```

### 2. Create a Sanity Project (first time only)

```bash
npx sanity init --create-project "Superteam Academy" --dataset production
```

Copy the **Project ID** from the output.

### 3. Configure Environment

Add to `app/.env.local`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=<your-write-token>
```

To get an API token:
1. Go to [manage.sanity.io](https://manage.sanity.io)
2. Select your project → API → Tokens
3. Create a token with **Editor** permissions

### 4. Seed Sample Content

```bash
cd app
npx tsx scripts/seed-sanity.ts
```

This populates the CMS with 6 complete courses covering Solana development.

### 5. Access the Studio

Start the dev server and navigate to:

```
http://localhost:3000/studio
```

---

## Content Architecture

### Document Types

| Type | Purpose |
|------|---------|
| **Course** | Top-level container with metadata (track, difficulty, XP) |
| **Module** | Groups of lessons within a course |
| **Lesson** | Individual learning unit (content or challenge) |
| **Instructor** | Course creator profile |

### Relationships

```
Course
├── Instructor (reference)
├── Prerequisites (references to other courses)
└── Modules (ordered references)
    └── Lessons (ordered references)
```

### Tracks

| Track | Color | Description |
|-------|-------|-------------|
| rust | Green | Core Solana/Rust programming |
| anchor | Purple | Anchor framework development |
| frontend | Blue | React/Next.js dApp frontends |
| security | Red | Program auditing and security |
| defi | Orange | DeFi protocols and strategies |
| mobile | Cyan | React Native mobile dApps |

---

## Managing Content

### Adding a New Course

1. **Create the Instructor** (if new)
   - Go to Studio → Instructors → Create
   - Fill in name, bio, avatar, social links

2. **Create Lessons** (bottom-up)
   - Go to Studio → Lessons → Create
   - Choose type: **Content** (reading/video) or **Challenge** (interactive coding)
   - For content lessons: write in the rich text editor or paste markdown
   - For challenge lessons: fill in the challenge panel (prompt, starter code, solution, test cases, hints)
   - Set XP reward and estimated time

3. **Create Modules**
   - Go to Studio → Modules → Create
   - Set title, description, and order number
   - Add lesson references in the correct order

4. **Create the Course**
   - Go to Studio → Courses → Create
   - Fill in title, slug, description, track, difficulty
   - Set estimated hours and XP reward
   - Add module references in order
   - Set the instructor reference
   - Add prerequisites (if any)
   - Add learning outcomes
   - Set the display order
   - Toggle "Published" when ready

### Editing Existing Content

- All changes are saved as drafts until you click **Publish**
- Use the revision history to compare changes
- Unpublish a course by toggling the "Published" field to false

### Lesson Types

#### Content Lessons
- Use the **Markdown Content** field for code-heavy lessons
- Use the **Block Content** editor for rich text with embedded images
- Code blocks support syntax highlighting for: Rust, TypeScript, JavaScript, JSON, Bash, TOML

#### Challenge Lessons
When type is set to "Challenge", the challenge panel appears:

| Field | Purpose |
|-------|---------|
| Prompt | What the learner needs to accomplish |
| Language | Code editor language (Rust, TypeScript, JSON) |
| Starter Code | Pre-populated code template |
| Solution Code | Correct implementation (hidden until revealed) |
| Test Cases | Automated checks (name, input, expected output) |
| Hints | Progressive hints the learner can reveal |

---

## GROQ Queries

The frontend uses these queries to fetch content:

### All Courses (Catalog Page)
```groq
*[_type == "course" && published == true] | order(order asc) {
  _id, title, "slug": slug.current, description,
  track, difficulty, estimatedHours, xpReward,
  "lessonCount": count(modules[]->lessons[]),
  "instructor": instructor->{name, avatar, twitter},
}
```

### Single Course (Detail Page)
```groq
*[_type == "course" && slug.current == $slug][0] {
  ...,
  "modules": modules[]->{
    ..., "lessons": lessons[]->{...}
  } | order(order asc)
}
```

### Single Lesson
```groq
*[_type == "lesson" && slug.current == $lessonSlug][0] {
  ..., challenge
}
```

---

## Deployment

### Deploy Sanity Studio

The studio is embedded in the Next.js app at `/studio`. It deploys automatically with the frontend.

### CORS Configuration

Add your production domain to the Sanity CORS origins:

1. Go to [manage.sanity.io](https://manage.sanity.io) → API → CORS Origins
2. Add `https://your-domain.com` with credentials allowed
3. Add `http://localhost:3000` for local development

### CDN & Caching

- Production uses Sanity's CDN (`useCdn: true`) for fast reads
- Content updates propagate to CDN within ~60 seconds
- The frontend falls back to static data when Sanity is not configured

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Studio shows blank page | Check `NEXT_PUBLIC_SANITY_PROJECT_ID` in `.env.local` |
| Seed script fails | Ensure `SANITY_API_TOKEN` has Editor permissions |
| Content not updating | Clear CDN cache or wait ~60s for propagation |
| Missing lessons in course | Check module references point to correct lesson documents |
| Challenge panel hidden | Set lesson type to "Challenge" first |

---

## Schema Reference

Derived from the Sanity schema definitions in `app/src/sanity/schemas/`.

### Course

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Course title |
| `slug` | `slug` | Yes | URL-friendly identifier, auto-generated from title. Max 120 chars |
| `description` | `text` | Yes | Short description. Max 300 characters |
| `longDescription` | `blockContent` | No | Detailed course description with rich text formatting |
| `track` | `string` (enum) | Yes | One of: `rust`, `anchor`, `frontend`, `security`, `defi`, `mobile` |
| `difficulty` | `string` (enum) | Yes | One of: `beginner`, `intermediate`, `advanced` |
| `estimatedHours` | `number` | Yes | Expected completion time in hours. Range: 1-100 |
| `xpReward` | `number` | Yes | Total XP awarded on course completion. Min: 0 |
| `image` | `image` | No | Cover image with hotspot cropping |
| `instructor` | `reference` -> `instructor` | No | Reference to the course instructor |
| `modules` | `array` of `reference` -> `module` | No | Ordered list of modules in this course |
| `prerequisites` | `array` of `reference` -> `course` | No | Courses that should be completed first |
| `learningOutcomes` | `array` of `string` | No | What learners will be able to do after completion |
| `order` | `number` | No | Controls display order in course listings |
| `published` | `boolean` | No | Whether the course is visible. Default: `true` |

### Module

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Module title |
| `description` | `text` | No | Module description. 3-row text area |
| `order` | `number` | Yes | Display order within the parent course |
| `lessons` | `array` of `reference` -> `lesson` | No | Ordered list of lessons in this module |

### Lesson

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | Yes | Lesson title |
| `slug` | `slug` | Yes | URL-friendly identifier, auto-generated from title. Max 120 chars |
| `type` | `string` (enum) | Yes | One of: `content`, `challenge`. Default: `content` |
| `content` | `blockContent` | No | Rich text content (block text, code blocks, images) |
| `markdownContent` | `text` | No | Markdown alternative for code-heavy lessons. 30-row text area |
| `challenge` | `object` | No | Challenge data (only visible when `type` is `challenge`). See sub-fields below |
| `xpReward` | `number` | Yes | XP awarded on lesson completion. Min: 0. Default: `10` |
| `estimatedMinutes` | `number` | No | Approximate completion time in minutes. Min: 1 |
| `order` | `number` | Yes | Display order within the parent module |

#### Lesson Challenge Sub-fields

These fields exist inside the `challenge` object and are only visible when `type` is `"challenge"`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `challenge.prompt` | `text` | No | Description of what the learner must accomplish |
| `challenge.language` | `string` (enum) | No | Code editor language: `rust`, `typescript`, or `json` |
| `challenge.starterCode` | `text` | No | Pre-populated code template |
| `challenge.solutionCode` | `text` | No | Correct implementation (hidden from learners) |
| `challenge.testCases` | `array` of `object` | No | Automated checks. Each has `name` (required), `input`, `expectedOutput` (required) |
| `challenge.hints` | `array` of `text` | No | Progressive hints revealed on request |

### Instructor

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Instructor display name |
| `bio` | `text` | No | Short biography. 4-row text area |
| `avatar` | `image` | No | Profile image with hotspot cropping |
| `twitter` | `string` | No | Twitter handle (without the `@`) |
| `github` | `string` | No | GitHub username |

### blockContent (shared type)

Used by `course.longDescription` and `lesson.content`. An array that supports:

- **Block text** — Styles: Normal, H2, H3, H4, Blockquote. Lists: Bullet, Numbered. Marks: Bold, Italic, Inline Code. Annotations: URL links (http, https, mailto, relative).
- **Code blocks** — Languages: Rust, TypeScript, JavaScript, JSON, Bash, TOML. Supports filename display.
- **Images** — With hotspot cropping, required `alt` text, optional `caption`.

---

## Example Documents

### Course

```json
{
  "_type": "course",
  "title": "Solana Program Development with Anchor",
  "slug": { "current": "solana-program-development-with-anchor" },
  "description": "Build production-ready Solana programs using the Anchor framework.",
  "track": "anchor",
  "difficulty": "intermediate",
  "estimatedHours": 12,
  "xpReward": 500,
  "image": {
    "_type": "image",
    "asset": { "_ref": "image-abc123-1200x630-png", "_type": "reference" }
  },
  "instructor": { "_ref": "instructor-doc-id", "_type": "reference" },
  "modules": [
    { "_ref": "module-doc-id-1", "_type": "reference", "_key": "m1" },
    { "_ref": "module-doc-id-2", "_type": "reference", "_key": "m2" }
  ],
  "prerequisites": [
    { "_ref": "course-rust-fundamentals-id", "_type": "reference", "_key": "p1" }
  ],
  "learningOutcomes": [
    "Write and deploy Anchor programs to devnet",
    "Implement PDAs, CPIs, and token operations",
    "Write comprehensive tests with Anchor's TypeScript client"
  ],
  "order": 3,
  "published": true
}
```

### Module

```json
{
  "_type": "module",
  "title": "Account Design Patterns",
  "description": "Learn how to structure on-chain accounts for efficiency and upgradability.",
  "order": 2,
  "lessons": [
    { "_ref": "lesson-doc-id-1", "_type": "reference", "_key": "l1" },
    { "_ref": "lesson-doc-id-2", "_type": "reference", "_key": "l2" },
    { "_ref": "lesson-doc-id-3", "_type": "reference", "_key": "l3" }
  ]
}
```

### Lesson (Content)

```json
{
  "_type": "lesson",
  "title": "Understanding PDAs",
  "slug": { "current": "understanding-pdas" },
  "type": "content",
  "markdownContent": "# Program Derived Addresses\n\nPDAs are deterministic addresses derived from a program ID and a set of seeds...",
  "xpReward": 15,
  "estimatedMinutes": 20,
  "order": 1
}
```

### Lesson (Challenge)

```json
{
  "_type": "lesson",
  "title": "Create a Counter Program",
  "slug": { "current": "create-a-counter-program" },
  "type": "challenge",
  "challenge": {
    "prompt": "Implement an Anchor program with initialize and increment instructions. The counter account should store a u64 count value.",
    "language": "rust",
    "starterCode": "use anchor_lang::prelude::*;\n\ndeclare_id!(\"...\");\n\n#[program]\nmod counter {\n    // TODO: implement initialize and increment\n}",
    "solutionCode": "use anchor_lang::prelude::*;\n\ndeclare_id!(\"...\");\n\n#[program]\nmod counter {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        ctx.accounts.counter.count = 0;\n        Ok(())\n    }\n\n    pub fn increment(ctx: Context<Increment>) -> Result<()> {\n        ctx.accounts.counter.count += 1;\n        Ok(())\n    }\n}",
    "testCases": [
      {
        "name": "Initialize sets count to 0",
        "input": "initialize",
        "expectedOutput": "count == 0",
        "_key": "tc1"
      },
      {
        "name": "Increment increases count by 1",
        "input": "increment",
        "expectedOutput": "count == 1",
        "_key": "tc2"
      }
    ],
    "hints": [
      "Start by defining the Counter account struct with a single u64 field.",
      "Use #[account(init, payer = user, space = 8 + 8)] for the initialize context.",
      "The increment instruction just needs a mutable reference to the counter account."
    ]
  },
  "xpReward": 25,
  "estimatedMinutes": 30,
  "order": 2
}
```

### Instructor

```json
{
  "_type": "instructor",
  "name": "Maria Santos",
  "bio": "Solana core contributor and educator. Building open-source tools for the Superteam ecosystem since 2023.",
  "avatar": {
    "_type": "image",
    "asset": { "_ref": "image-def456-400x400-jpg", "_type": "reference" }
  },
  "twitter": "mariasantos",
  "github": "mariasantos"
}
```

---

## Advanced Queries

### Courses Filtered by Track

Fetch all published courses for a specific track, with instructor info and lesson counts.

```groq
*[_type == "course" && published == true && track == $track] | order(order asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  difficulty,
  estimatedHours,
  xpReward,
  "lessonCount": count(modules[]->lessons[]),
  "instructor": instructor->{name, avatar, twitter}
}
```

Pass `$track` as a parameter (e.g. `"anchor"`, `"security"`).

### Lessons with Challenge Data

Fetch all challenge-type lessons across the platform, with their test case count and language.

```groq
*[_type == "lesson" && type == "challenge"] | order(order asc) {
  _id,
  title,
  "slug": slug.current,
  xpReward,
  estimatedMinutes,
  "language": challenge.language,
  "prompt": challenge.prompt,
  "testCaseCount": count(challenge.testCases),
  "hintCount": count(challenge.hints)
}
```

### Recently Updated Content

Fetch the 20 most recently updated documents across all content types. Useful for editorial dashboards.

```groq
*[_type in ["course", "module", "lesson", "instructor"]] | order(_updatedAt desc) [0...20] {
  _id,
  _type,
  _updatedAt,
  title,
  "slug": slug.current
}
```
