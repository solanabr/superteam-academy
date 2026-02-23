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
