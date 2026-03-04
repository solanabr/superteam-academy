# CMS Guide — Sanity

Superteam Academy uses [Sanity](https://sanity.io) as its headless CMS for all course content: courses, modules, lessons, code challenges, and instructors. This guide covers accessing the Studio, understanding the content model, authoring content, and managing the multilingual catalog.

---

## Accessing Sanity Studio

The Sanity Studio is embedded directly in the Next.js app at the `/studio` route.

| Environment | URL |
|---|---|
| Development | `http://localhost:3000/studio` |
| Production | `https://your-domain.com/studio` |

You must be logged in to your Sanity account. The Studio page is rendered by `src/app/studio/[[...tool]]/page.tsx`, which dynamically imports `NextStudio` with SSR disabled.

The Studio configuration lives in `sanity.config.ts` at the project root:

```typescript
export default defineConfig({
  name: "superteam-academy",
  title: "Superteam Academy",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  basePath: "/studio",
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [
      courseSchema, moduleSchema, lessonSchema, challengeSchema,
      instructorSchema, codeBlockSchema, calloutSchema,
    ],
  },
});
```

**Plugins included:**
- `structureTool()` — standard document editor
- `visionTool()` — GROQ playground for testing queries interactively

---

## Content Model Reference

All schemas are defined in `src/lib/sanity/schemas/` and re-exported from `src/lib/sanity/schemas/index.ts`.

### Document Types

```
course (document)
  ├── title (string, required)
  ├── slug (slug, auto-generated from title)
  ├── description (text)
  ├── thumbnail (image, with hotspot)
  ├── difficulty (number: 1 | 2 | 3)
  ├── trackId (number)
  ├── onChainCourseId (string)          ← bridges CMS to blockchain
  ├── xpPerLesson (number)
  ├── tags (string[])
  ├── prerequisites (string[])
  ├── instructor (reference → instructor)
  ├── lessons (reference[] → lesson)    ← ordered list
  ├── status ("draft" | "published")
  └── locale ("pt-BR" | "en" | "es")

module (document)
  ├── title (string, required)
  ├── slug (slug)
  ├── description (text)
  └── lessons (reference[] → lesson)    ← ordered list

lesson (document)
  ├── title (string, required)
  ├── slug (slug)
  ├── lessonIndex (number)              ← maps to on-chain bitmap bit
  ├── content (Portable Text array)
  │     ├── block (rich text with bold, italic, code marks)
  │     ├── codeBlock (object: language + code)
  │     ├── callout (object: type + text)
  │     └── image (with hotspot)
  ├── videoUrl (url)
  ├── estimatedMinutes (number)
  └── challenge (reference → challenge)

challenge (document)
  ├── title (string, required)
  ├── language ("ts" | "rust")
  ├── starterCode (text)
  ├── solutionCode (text)
  ├── testCode (text)
  ├── hints (string[])
  └── difficulty (number: 1 | 2 | 3)

instructor (document)
  ├── name (string, required)
  ├── avatar (image)
  ├── bio (text)
  ├── socialLinks (object[]: { platform, url })
  └── walletAddress (string)            ← Solana pubkey for creator XP rewards
```

### Embedded Object Types

These are used inline within Portable Text content — they are not standalone documents:

```
codeBlock (object)
  ├── language ("typescript" | "rust" | "javascript" | "bash" | "json")
  └── code (text)

callout (object)
  ├── type ("info" | "warning" | "error" | "tip")
  └── text (text)
```

---

## Schema Details

### Course (`src/lib/sanity/schemas/course.ts`)

The top-level content unit. Each course maps to one on-chain `Course` PDA.

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Display name of the course |
| `slug` | slug | Yes | URL-safe identifier (auto-generated from title) |
| `description` | text | No | Plain-text course summary |
| `thumbnail` | image | No | Cover image served via Sanity CDN; hotspot enabled |
| `difficulty` | number | No | `1` = Beginner, `2` = Intermediate, `3` = Advanced |
| `trackId` | number | No | Numeric track identifier for grouping courses |
| `onChainCourseId` | string | **Critical** | Must exactly match the `courseId` used in the on-chain `create_course` instruction |
| `xpPerLesson` | number | No | XP per lesson (informational; actual XP is set on-chain) |
| `tags` | string[] | No | Free-form tags for filtering (e.g., "DeFi", "NFT", "Beginner") |
| `prerequisites` | string[] | No | Array of `onChainCourseId` values that must be completed first |
| `instructor` | reference | No | Reference to an `instructor` document |
| `lessons` | reference[] | Yes | Ordered array of references to `lesson` documents |
| `status` | string | Yes | `"draft"` or `"published"` |
| `locale` | string | Yes | `"pt-BR"`, `"en"`, or `"es"` |

### Lesson (`src/lib/sanity/schemas/lesson.ts`)

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Lesson display name |
| `slug` | slug | Yes | URL-safe identifier (auto-generated from title) |
| `lessonIndex` | number | **Critical** | 0-based index; must match the on-chain bitmap bit position |
| `content` | Portable Text | No | Rich lesson body |
| `videoUrl` | url | No | Video embed URL (YouTube, Loom, etc.) |
| `estimatedMinutes` | number | No | Estimated reading/viewing time |
| `challenge` | reference | No | Optional reference to a `challenge` document |

**Critical constraint:** `lessonIndex` is the bit position in the on-chain enrollment bitmap. Lesson 0 = bit 0, lesson 1 = bit 1. Never skip or duplicate indices within a course.

### Challenge (`src/lib/sanity/schemas/challenge.ts`)

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Challenge display name |
| `language` | string | Yes | `"ts"` (TypeScript) or `"rust"` |
| `starterCode` | text | No | Code shown when the challenge loads |
| `solutionCode` | text | No | Reference solution (hidden from learners) |
| `testCode` | text | No | Test harness executed against the learner's solution |
| `hints` | string[] | No | Progressive hints shown one at a time |
| `difficulty` | number | No | `1`, `2`, or `3` |

### Instructor (`src/lib/sanity/schemas/instructor.ts`)

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Full display name |
| `avatar` | image | No | Profile photo |
| `bio` | text | No | Short biography |
| `socialLinks` | object[] | No | Array of `{ platform: string, url: string }` pairs |
| `walletAddress` | string | No | Solana wallet address for creator XP rewards |

The `walletAddress` is used by `BackendSignerService.finalizeCourse()` to credit the creator ATA with reward XP when a learner finalizes the course.

---

## Creating a New Course — Step by Step

### Step 1: Create the on-chain Course account

Before creating content in Sanity, you need an on-chain `Course` PDA. Use the Anchor program's `create_course` instruction:

```typescript
await program.methods
  .createCourse(
    "intro-to-solana",   // courseId — becomes onChainCourseId in Sanity
    trackId,             // u8 track number
    totalLessons,        // u16 total lesson count
    xpPerLesson,         // u64 XP per lesson
    completionBonus,     // u64 bonus XP on finalize
    creatorReward,       // u64 XP reward to creator on finalize
    prerequisiteCourseId // Option<String>
  )
  .accounts({ ... })
  .rpc();
```

Note the `courseId` string — you will need it in step 3.

### Step 2: Create the Instructor document

1. In Studio, navigate to **Instructor** in the left sidebar.
2. Click **+ New**.
3. Fill in `name`, `avatar`, `bio`, and optionally `walletAddress`.
4. Click **Publish**.

### Step 3: Create the Course document

1. Navigate to **Course** in the sidebar.
2. Click **+ New**.
3. Fill in all fields:
   - `onChainCourseId`: paste the exact `courseId` string from step 1 — this is the most critical field
   - `slug`: click **Generate** to auto-fill from title
   - `trackId`: must match the on-chain value used in `create_course`
   - `locale`: set to `pt-BR`, `en`, or `es`
   - `status`: leave as `draft` until lessons are added
4. Save the document (do not publish yet).

### Step 4: Create Lesson documents

For each lesson in order:

1. Navigate to **Lesson** in the sidebar.
2. Click **+ New**.
3. Fill in:
   - `lessonIndex`: `0` for the first lesson, `1` for the second, etc. — must be sequential with no gaps
   - `slug`: auto-generate or type manually
   - `content`: write using the rich text editor
4. **Publish** each lesson before proceeding.

### Step 5: Create Challenge documents (optional)

1. Navigate to **Code Challenge** in the sidebar.
2. Fill in all fields: `title`, `language`, `starterCode`, `solutionCode`, `testCode`, `hints`, `difficulty`.
3. Publish the challenge.
4. Open the relevant Lesson document and set its `challenge` field to reference this document.

### Step 6: Add lessons to the Course and publish

1. Open the Course document from step 3.
2. In the `lessons` field, click **Add item** and select each lesson in order.
3. Verify the array order matches the `lessonIndex` values (0, 1, 2, ...).
4. Change `status` to `"published"`.
5. Click **Publish**.

The course will appear in the app within 60 seconds (ISR revalidation interval for the courses page).

---

## Adding Lessons with Code Challenges

A code challenge is an in-browser coding exercise powered by the Monaco editor. To attach one to a lesson:

### 1. Author the challenge document

```
starterCode:
  // Complete the function to transfer SOL between accounts
  export async function transferSol(
    connection: Connection,
    from: Keypair,
    to: PublicKey,
    amount: number
  ): Promise<string> {
    // your code here
  }

solutionCode:
  export async function transferSol(...) {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: amount,
      })
    );
    return sendAndConfirmTransaction(connection, tx, [from]);
  }

testCode:
  // executed by the Monaco runner
  const sig = await transferSol(connection, from, to, LAMPORTS_PER_SOL / 10);
  assert(typeof sig === "string" && sig.length > 0);
```

### 2. Write progressive hints

```json
[
  "Import SystemProgram from @solana/web3.js",
  "Use SystemProgram.transfer() to build the transfer instruction",
  "Wrap the instruction in a Transaction and send with sendAndConfirmTransaction"
]
```

### 3. Link to the lesson

Open the lesson document, set the `challenge` reference field to your new challenge document, and re-publish.

---

## Content Publishing Workflow

Sanity has two document states: **draft** and **published**.

| State | Visibility |
|---|---|
| Draft | Studio only — not returned by GROQ queries |
| Published | Live on the frontend after ISR revalidation |

### Workflow

1. Create/edit documents in `draft` status.
2. Preview in Studio using the built-in preview or the Vision tool.
3. Change `status` to `"published"` and click **Publish**.
4. Content appears on the frontend within the ISR window:
   - 60 seconds for course list and detail pages
   - 3600 seconds for lesson content pages

### Unpublishing

Set `status` back to `"draft"` and re-publish. The GROQ query filters `status == "published"` so the content will be removed from the frontend after the next ISR revalidation.

---

## Image and Asset Management

All images uploaded to Sanity are served via the Sanity CDN (`cdn.sanity.io`). This domain is whitelisted in `next.config.ts`.

The `thumbnail` field on Course and `avatar` on Instructor support Sanity's hotspot feature for smart cropping.

### Recommended image sizes

| Image | Recommended size | Format |
|---|---|---|
| Course thumbnail | 1200 × 630 px | JPG or PNG |
| Instructor avatar | 400 × 400 px | JPG or PNG |
| Lesson inline images | Max 1600 px wide | JPG, PNG, or GIF |

### Uploading images

In the Studio image field, click the upload icon or drag and drop a file. After upload, click **Crop & hotspot** to set the focal point for responsive cropping.

### External video

The `videoUrl` field on Lesson accepts any URL. The frontend renders it as an `<iframe>` embed. Supported platforms: YouTube, Vimeo (whitelisted in the CSP `frame-src` directive in `next.config.ts`).

---

## GROQ Query Reference

All frontend queries are defined in `src/lib/sanity/queries.ts`.

### `getAllCourses(locale)`

Returns all published courses for a given locale with full field expansion:

```groq
*[_type == "course" && status == "published" && locale == $locale] {
  _id, title, "slug": slug.current, description,
  thumbnail { asset-> { url } },
  difficulty, trackId, onChainCourseId, xpPerLesson, tags, prerequisites,
  instructor-> { _id, name, avatar { asset-> { url } }, bio, socialLinks, walletAddress },
  "lessons": lessons[]-> {
    _id, title, "slug": slug.current, lessonIndex, estimatedMinutes, videoUrl,
    challenge-> { _id, title, language, starterCode, solutionCode, testCode, hints, difficulty }
  } | order(lessonIndex asc),
  status, locale
}
```

### `getCourseBySlug(slug, locale)`

```groq
*[_type == "course" && slug.current == $slug && locale == $locale][0] {
  ...courseFields
}
```

### `getLessonBySlug(courseSlug, lessonSlug, locale)`

```groq
*[_type == "course" && slug.current == $courseSlug && locale == $locale][0]
  .lessons[@->slug.current == $lessonSlug][0]-> {
    _id, title, "slug": slug.current, lessonIndex, content, videoUrl,
    estimatedMinutes, challenge-> { ... }
  }
```

### `getFeaturedCourses(locale, limit)`

```groq
*[_type == "course" && status == "published" && locale == $locale]
  | order(_createdAt desc) [0...$limit] { ...courseFields }
```

### Testing queries

Use the **Vision** plugin in Studio (toolbar) to test GROQ queries against your dataset interactively. Set `$locale` to `"pt-BR"` in the query parameters panel.

---

## Managing Locales

Each course document has a `locale` field. To publish a course in multiple languages, create separate documents for each locale sharing the same `slug` and `onChainCourseId`.

### Locale strategy

```
Course: "Intro to Solana" (locale: "pt-BR", slug: "intro-to-solana")
Course: "Intro to Solana" (locale: "en",    slug: "intro-to-solana")
Course: "Intro to Solana" (locale: "es",    slug: "intro-to-solana")
```

All three share the same `slug` and `onChainCourseId`. The GROQ query filters by locale:

```groq
*[_type == "course" && status == "published" && locale == $locale]
```

### Creating localized content

1. Create the course and all lessons in the primary locale (`pt-BR`).
2. For each additional locale, create a new `Course` document with the same `slug`, `onChainCourseId`, `trackId`, and `difficulty`. Set `locale` to the target locale.
3. Create new `Lesson` documents with translated content, **same `lessonIndex` values, and the same slugs**.
4. Reference the translated lessons in the translated course's `lessons` array.

**Critical:** `onChainCourseId` and `lessonIndex` must be identical across all locales. Only text, titles, and descriptions should differ.

---

## Linking CMS Content to On-Chain Program

Two fields bridge CMS and blockchain:

| CMS Field | On-Chain Usage |
|---|---|
| `course.onChainCourseId` | PDA seeds: `["course", onChainCourseId]` and `["enrollment", onChainCourseId, learner]` |
| `lesson.lessonIndex` | Bitmap bit position in the Enrollment account; argument to `complete_lesson(lessonIndex)` |

### Runtime flow

1. Frontend reads `lesson.lessonIndex` from the Sanity lesson document.
2. `LearningProgressService` sends `{ courseId: course.onChainCourseId, lessonIndex }` to `/api/progress/complete-lesson`.
3. The API route passes `lessonIndex` to `BackendSignerService.completeLesson()`.
4. The Anchor program sets bit `lessonIndex` in the enrollment bitmap on-chain.

**A mismatch between CMS `lessonIndex` and the on-chain bitmap causes incorrect progress tracking.** Always verify consistency when adding or reordering lessons.

### Adding or reordering lessons

- **Adding a lesson:** Assign the next available `lessonIndex`. The on-chain `lessonCount` must also be updated via `update_course`.
- **Reordering display order:** Change the order in the course's `lessons` array, but do **not** change `lessonIndex` values. Array order controls display; `lessonIndex` controls the on-chain bit.
- **Never reuse a `lessonIndex`** that was previously assigned to a different lesson — existing learners may have already completed that bit.

---

## Sanity Client Architecture

Two clients are used:

| Client | File | Token | CDN | Usage |
|---|---|---|---|---|
| `publicClient` | `src/lib/sanity/client.ts` | None | Yes (production) | Server Components, GROQ reads |
| `sanityClient` | `src/lib/sanity/server-client.ts` | `SANITY_API_TOKEN` | No | Server-only writes, draft access |

The server client is guarded by `import "server-only"`, so importing it in a client component causes a build-time error and never exposes the token to the browser.

---

## Seed Script

`scripts/seed-sanity.mjs` populates the dataset with demo courses for all three locales.

```bash
node scripts/seed-sanity.mjs
```

The script is idempotent — it uses `createOrReplace` with deterministic document IDs and is safe to run multiple times. It creates two complete courses with lessons in all 3 locales.

Configure credentials via environment variables:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-write-token
```

---

## Troubleshooting

### `"placeholder"` appears as project ID

Set `NEXT_PUBLIC_SANITY_PROJECT_ID` in `.env.local`. Get your project ID from [sanity.io/manage](https://sanity.io/manage).

### Courses not appearing after publishing

1. Check `status` is `"published"`.
2. Check `locale` matches the app's current locale.
3. Wait 60 seconds for ISR revalidation.
4. Verify `NEXT_PUBLIC_SANITY_DATASET` matches your dataset.

### Lesson progress not tracking correctly

1. Verify `lessonIndex` in CMS matches the expected bit position on-chain.
2. Verify `onChainCourseId` exactly matches the course PDA's `courseId` seed.
3. Verify the on-chain `lessonCount` is >= the highest `lessonIndex` + 1.

### CORS errors in Studio

Add your domain to Sanity CORS origins at [sanity.io/manage](https://sanity.io/manage) → API → CORS origins. Include `http://localhost:3000` and your production URL. Check "Allow credentials" for each.
