# Sanity CMS Guide

Content management for Superteam Academy courses, tracks, modules, lessons.

## Sanity Studio Access

**Development:**
```bash
cd app
pnpm sanity dev
```

Open [http://localhost:3333](http://localhost:3333)

**Production:**
Access via [sanity.io/studio](https://www.sanity.io/studio) (managed studio)

## Schema Overview

```
Track
├── Course 1
│   ├── Module 1
│   │   ├── Lesson 1.1
│   │   └── Lesson 1.2
│   └── Module 2
│       ├── Lesson 2.1
│       └── Lesson 2.2
└── Course 2
    └── ...
```

### Schemas

| Schema | Fields | Purpose |
|--------|--------|---------|
| **track** | trackId, title, description, collectionAddress | Learning track (e.g., "Solana Fundamentals") |
| **course** | courseId, trackId, title, xpPerLesson, lessonCount, modules | Single course within a track |
| **module** | title, description, lessons, order | Group of related lessons |
| **lesson** | title, content, videoUrl, codeChallenge, order | Individual lesson |
| **instructor** | name, bio, avatar, socialLinks | Course instructor |

## Field Reference

### Track

```typescript
{
  _type: 'track',
  trackId: 'solana-101',           // CRITICAL: Must match on-chain trackId
  title: 'Solana Fundamentals',
  slug: { current: 'solana-101' },
  description: '...',
  collectionAddress: 'ABC...xyz',  // Metaplex Core collection for credentials
  image: { asset: { _ref: '...' } },
  difficulty: 'beginner',          // beginner | intermediate | advanced
  tags: ['blockchain', 'solana'],
  published: true
}
```

**CRITICAL**: `trackId` must match the on-chain trackId used in program instructions.

### Course

```typescript
{
  _type: 'course',
  courseId: 'intro-solana',         // CRITICAL: Must match on-chain courseId
  trackId: 'solana-101',            // CRITICAL: Must match parent track
  title: 'Introduction to Solana',
  slug: { current: 'intro-solana' },
  description: '...',
  xpPerLesson: 100,                 // CRITICAL: Must match on-chain Course.xp_per_lesson
  lessonCount: 8,                   // CRITICAL: Must match on-chain Course.lesson_count
  modules: [                        // Reference to module documents
    { _ref: 'module-1-ref' },
    { _ref: 'module-2-ref' }
  ],
  instructor: { _ref: 'instructor-ref' },
  difficulty: 'beginner',
  estimatedHours: 4,
  prerequisites: [],
  published: true
}
```

**CRITICAL FIELDS** for on-chain alignment:
- `courseId`: Matches `Course.course_id` in program
- `trackId`: Matches `Course.track_id` in program
- `xpPerLesson`: Matches `Course.xp_per_lesson` (controls XP minting)
- `lessonCount`: Matches `Course.lesson_count` (validates completion)

### Module

```typescript
{
  _type: 'module',
  title: 'Getting Started',
  slug: { current: 'getting-started' },
  description: '...',
  order: 1,                         // Display order within course
  lessons: [                        // Reference to lesson documents
    { _ref: 'lesson-1-ref' },
    { _ref: 'lesson-2-ref' }
  ]
}
```

### Lesson

```typescript
{
  _type: 'lesson',
  title: 'What is Solana?',
  slug: { current: 'what-is-solana' },
  order: 1,                         // Display order within module
  videoUrl: 'https://youtube.com/watch?v=...',
  duration: 15,                     // Minutes
  content: [                        // Portable Text (rich text)
    {
      _type: 'block',
      children: [{ _type: 'span', text: '...' }]
    }
  ],
  codeChallenge: {
    title: 'Create a Keypair',
    instructions: '...',
    starterCode: 'import { Keypair } from "@solana/web3.js";\n\n// Your code here',
    solution: '...',                // Hidden from frontend
    testCases: [                    // Validation logic
      {
        input: '...',
        expectedOutput: '...'
      }
    ]
  },
  published: true
}
```

### Instructor

```typescript
{
  _type: 'instructor',
  name: 'John Doe',
  slug: { current: 'john-doe' },
  bio: '...',
  avatar: { asset: { _ref: '...' } },
  twitter: 'johndoe',
  github: 'johndoe',
  website: 'https://johndoe.com'
}
```

## Creating a Course Workflow

### 1. Create Track

1. Navigate to "Tracks" in Sanity Studio
2. Click "Create new Track"
3. Fill in fields:
   - **trackId**: Short kebab-case ID (e.g., `solana-101`)
   - **title**: Display name
   - **collectionAddress**: Metaplex Core collection for credentials (created on-chain first)
   - **difficulty**: Beginner/Intermediate/Advanced
4. Publish

### 2. Create Instructor

1. Navigate to "Instructors"
2. Create instructor profile
3. Upload avatar image
4. Publish

### 3. Create Course

1. Navigate to "Courses"
2. Click "Create new Course"
3. Fill in fields:
   - **courseId**: Short kebab-case ID (e.g., `intro-solana`)
   - **trackId**: Must match parent track (select from dropdown or type)
   - **xpPerLesson**: XP awarded per lesson (e.g., 100)
   - **lessonCount**: Total number of lessons (must match actual count)
   - **instructor**: Select instructor
4. Leave modules empty for now
5. Publish

### 4. Create Lessons

1. Navigate to "Lessons"
2. For each lesson:
   - **title**: Clear, descriptive
   - **order**: 1, 2, 3, ... (within module)
   - **videoUrl**: YouTube/Vimeo embed URL
   - **content**: Write in rich text editor (supports markdown-like syntax)
   - **codeChallenge**: Optional hands-on exercise
3. Publish each lesson

### 5. Create Modules

1. Navigate to "Modules"
2. For each module:
   - **title**: Module name
   - **order**: 1, 2, 3, ... (within course)
   - **lessons**: Select lessons via reference picker
3. Publish each module

### 6. Link Modules to Course

1. Return to course document
2. Select modules via reference picker
3. Ensure module order is correct
4. Verify lessonCount matches total lessons across all modules
5. Publish

### 7. Sync On-Chain

Before course goes live, create on-chain Course PDA:

```bash
# In onchain-academy directory
anchor run create-course -- \
  --course-id intro-solana \
  --track-id solana-101 \
  --xp-per-lesson 100 \
  --lesson-count 8
```

This creates the `Course` PDA that enrollments reference.

## Content Tips

### Video

- Host on YouTube/Vimeo
- Use embed URLs (not watch URLs)
- Enable captions
- Keep videos under 20 minutes

### Written Content

Portable Text supports:
- **Headings**: H2, H3, H4
- **Text formatting**: Bold, italic, code
- **Lists**: Ordered, unordered
- **Links**: External, internal
- **Code blocks**: With syntax highlighting
- **Images**: Inline images

Example:
```
## Introduction

This lesson covers **Solana accounts**. You'll learn:
- What accounts are
- How to create accounts
- Account ownership

Check the [Solana docs](https://docs.solana.com) for more.
```

### Code Challenges

Structure:
1. **Title**: Clear goal (e.g., "Create a Keypair")
2. **Instructions**: Step-by-step guidance
3. **Starter Code**: Boilerplate with `// Your code here` comment
4. **Solution**: Hidden, used for validation hints
5. **Test Cases**: Input/output pairs for automated validation

Example:
```typescript
// starterCode
import { Keypair } from "@solana/web3.js";

export function generateKeypair() {
  // Your code here
}

// solution
export function generateKeypair() {
  return Keypair.generate();
}

// testCases
[
  {
    description: "Returns a valid Keypair",
    test: "typeof result.publicKey === 'object'"
  }
]
```

## Publishing Flow

**Draft → Review → Publish → Webhook → Revalidate**

1. **Draft**: Edit content, keep `published: false`
2. **Review**: Preview in staging environment
3. **Publish**: Set `published: true`, click Publish
4. **Webhook**: Sanity sends webhook to `/api/webhooks/sanity`
5. **Revalidate**: Next.js revalidates affected pages

Webhook payload includes document type and ID, triggering targeted revalidation:
- Track change → revalidate catalog + track page
- Course change → revalidate course page
- Lesson change → revalidate lesson page

## Seeding Data

Script at `scripts/seed-sanity.ts`:

```bash
pnpm tsx scripts/seed-sanity.ts
```

Creates:
- 2 tracks
- 4 courses
- 12 modules
- 48 lessons
- 4 instructors

Useful for development, testing, demos.

## GROQ Queries

Sanity queries use GROQ (Graph-Relational Object Queries).

### Fetch Course with Modules and Lessons

```groq
*[_type == "course" && courseId == $courseId][0] {
  _id,
  courseId,
  trackId,
  title,
  description,
  xpPerLesson,
  lessonCount,
  instructor->{
    name,
    avatar
  },
  modules[]->{
    _id,
    title,
    order,
    lessons[]->{
      _id,
      title,
      slug,
      order,
      duration,
      videoUrl
    }
  }
}
```

### Fetch All Published Courses

```groq
*[_type == "course" && published == true] | order(title asc) {
  courseId,
  trackId,
  title,
  description,
  difficulty,
  estimatedHours,
  lessonCount,
  "moduleCount": count(modules)
}
```

### Fetch Lesson Content

```groq
*[_type == "lesson" && slug.current == $slug][0] {
  title,
  content,
  videoUrl,
  codeChallenge,
  duration
}
```

## Data Validation

**Pre-publish checklist:**

- [ ] `courseId` unique across all courses
- [ ] `trackId` matches parent track
- [ ] `xpPerLesson` > 0
- [ ] `lessonCount` equals total lessons in modules
- [ ] All lessons have `order` field
- [ ] All modules have `order` field
- [ ] Video URLs are valid embeds
- [ ] Code challenges have test cases
- [ ] Instructor assigned
- [ ] `published: true` only when ready

Validation errors shown in Sanity Studio. Fix before publishing.

## Content Localization

For multi-language support, use Sanity's internationalization plugin:

```typescript
{
  title: {
    en: 'Introduction to Solana',
    'pt-BR': 'Introdução ao Solana',
    es: 'Introducción a Solana'
  }
}
```

Frontend queries based on user locale:
```typescript
const locale = useLocale(); // 'en' | 'pt-BR' | 'es'
const title = course.title[locale] || course.title.en;
```

## Troubleshooting

**Course not showing in catalog:**
- Check `published: true`
- Verify `trackId` matches existing track
- Clear Next.js cache: delete `.next` folder, restart dev server

**Lesson count mismatch:**
- Count lessons across all modules
- Update `lessonCount` field to match
- Republish course

**Video not embedding:**
- Use embed URL format:
  - YouTube: `https://www.youtube.com/embed/VIDEO_ID`
  - Vimeo: `https://player.vimeo.com/video/VIDEO_ID`
- Check video privacy settings (must be public)

**Webhook not triggering:**
- Verify `SANITY_WEBHOOK_SECRET` in env vars
- Check webhook configuration in Sanity project settings
- Test webhook manually via Sanity dashboard

**ISR not revalidating:**
- Check Next.js logs for revalidation errors
- Verify API route `/api/webhooks/sanity` is accessible
- Manually revalidate: visit `/_next/revalidate?secret=...`

---

See [ARCHITECTURE.md](./ARCHITECTURE.md) for data flow and [README.md](./README.md) for setup.
