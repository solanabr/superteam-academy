# CMS Guide — Sanity

Course content is managed through [Sanity.io](https://sanity.io), a headless CMS. This guide explains how to create and manage courses, sections, and lessons.

## Access the CMS

1. Go to [https://sanity.io/manage](https://sanity.io/manage)
2. Sign in and open your project (ID: set in `NEXT_PUBLIC_SANITY_PROJECT_ID`)
3. Click **Studio** to open the content editor

Or run the Sanity Studio locally if you have it installed:
```bash
cd sanity-studio  # if your studio is a separate directory
npx sanity dev
```

## Content Types

### Course

The top-level content type. Each course maps to a database record via its slug.

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Course display name |
| `slug` | Slug | URL identifier — must match `onchainCourseId` pattern |
| `description` | Text | Short course description shown in the catalog |
| `difficulty` | Select | `beginner`, `intermediate`, or `advanced` |
| `track` | Select | `fundamentals`, `defi`, `nft`, `security`, `frontend` |
| `durationHours` | Number | Estimated completion time |
| `xpReward` | Number | Total XP awarded on completion |
| `thumbnail` | Image | Course card thumbnail (recommended: 1280×720) |
| `instructorName` | String | Instructor display name |
| `modules` | Reference[] | Ordered list of course modules |

### Module

Groups related lessons into a section.

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Module name (e.g., "Introduction to Accounts") |
| `order` | Number | Display order within the course |
| `lessons` | Reference[] | Ordered list of lessons |

### Lesson

An individual learning unit.

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Lesson title |
| `type` | Select | `video`, `reading`, `challenge` |
| `order` | Number | Display order within the module |
| `content` | Portable Text | Rich text lesson body |
| `xpReward` | Number | XP awarded for completing this lesson |
| `hints` | String[] | Optional hints for challenge lessons |
| `starterCode` | Code | Starting code for code challenges (Monaco editor) |
| `solution` | Code | Solution code (only visible to admins) |

## Creating a New Course

1. In Sanity Studio, click **Course** → **New document**
2. Fill in the title, slug, description, and metadata fields
3. Set difficulty and track — these map to on-chain values:
   - `beginner` → u8 `1`, `intermediate` → `2`, `advanced` → `3`
   - `fundamentals` → u8 `1`, `defi` → `2`, `nft` → `3`, `security` → `4`, `frontend` → `5`
4. Add modules and lessons in order
5. **Publish** the course when ready

## Syncing Course to the Database

After publishing in Sanity, the course needs an entry in the PostgreSQL database. The LMS reads content from Sanity but tracks enrollment and progress in PostgreSQL.

### Option A — Manual admin entry

Go to `/admin/courses/new` in the LMS and create the course there. The slug should match the Sanity slug exactly.

### Option B — Database seeding

Edit `scripts/seed-courses.ts` to include your new course and run:
```bash
npx tsx -r dotenv/config scripts/seed-courses.ts
```

## GROQ Queries

The LMS uses these GROQ queries to fetch content from Sanity:

**Single course by slug** (`src/lib/sanity.ts`):
```groq
*[_type == "course" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  description,
  difficulty,
  track,
  durationHours,
  xpReward,
  thumbnail,
  instructorName,
  "modules": modules[]-> {
    _id,
    title,
    order,
    "lessons": lessons[]-> {
      _id, title, type, order, content, xpReward, hints, starterCode, solution
    }
  }
}
```

**All courses** (for the catalog):
```groq
*[_type == "course"] {
  _id, title, "slug": slug.current, description,
  difficulty, track, durationHours, xpReward, thumbnail, instructorName
} | order(title asc)
```

## Image Handling

Use the `urlFor()` helper from `src/lib/sanity.ts` to generate optimized image URLs:

```tsx
import { urlFor } from "@/lib/sanity"

<img src={urlFor(course.thumbnail).width(640).url()} alt={course.title} />
```

## Content Permissions

| Role | Capabilities |
|------|-------------|
| Admin | Create, edit, publish, delete all content |
| Editor | Create and edit content; cannot delete |
| Viewer | Read-only access |

Set roles in Sanity's **Members** settings under your project.

## Webhooks (optional)

To automatically revalidate the LMS cache when content changes in Sanity, configure a webhook in Sanity → **API** → **Webhooks**:

- **URL:** `https://your-domain.com/api/revalidate`
- **Trigger:** On publish and unpublish
- **Secret:** Add `SANITY_WEBHOOK_SECRET` to your `.env`
