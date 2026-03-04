# Superteam Academy — CMS Guide (Sanity)

This guide explains how to create, edit, and publish courses using the Sanity CMS. Course creators (Professors) can manage content entirely from the in-app dashboard at `/teach/courses` — no need to use Sanity Studio directly unless you need advanced access.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Content Schema](#content-schema)
3. [Creating a Course Step by Step](#creating-a-course-step-by-step)
4. [Updating Existing Courses](#updating-existing-courses)
5. [Content Guidelines](#content-guidelines)
6. [Sanity Dataset Management](#sanity-dataset-management)
7. [API Integration](#api-integration)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Option A: In-App Course Management (Recommended for instructors)

All course creation and editing is available directly inside the platform:

1. Log in at the deployed app URL
2. Your account must have the `professor` or `admin` role (ask the admin to set this via Prisma Studio or Supabase Table Editor)
3. Navigate to **Teach → My Courses** (`/teach/courses`)
4. Click **Create Course** to start a new course, or click an existing course to edit it

### Option B: Sanity Studio (For admins and advanced editing)

The embedded Sanity Studio is accessible at `/studio`:

```
https://aves-superteam-academy.vercel.app/studio
```

Or run it locally:

```bash
cd app
pnpm dev
# Open http://localhost:3000/studio
```

> [!NOTE]
> The `/studio` route bypasses i18n middleware to ensure the CMS loads correctly without locale prefixes. You must be logged into your Sanity account with `editor` or `administrator` access.

---

## Content Schema

### Content Hierarchy

```
Course
 └── Module (group of lessons)
      ├── Lesson (content or challenge)
      │    └── Challenge (interactive coding, optional)
      └── Quiz (end-of-module assessment, optional)
```

### Course Fields

| Field | Type | Description |
|---|---|---|
| `title` | String | Course name shown on the catalog and card |
| `slug` | Slug | URL-friendly identifier (e.g. `anchor-framework-deepdive`) |
| `description` | Text | Short description shown on course cards |
| `instructor` | String | Instructor display name |
| `difficulty` | Select | `beginner`, `intermediate`, or `advanced` |
| `track` | Select | `rust`, `anchor`, `security`, `solana`, `other` |
| `duration` | String | Human-readable duration (e.g. `4 hours`) |
| `image` | Image | Course cover (recommended: 1280×720px) |
| `xpReward` | Number | XP awarded on course completion (suggested: 500/1000/2000) |
| `published` | Boolean | Only `true` courses appear on `/courses` |
| `programAddress` | String | On-chain Course PDA address (Devnet) |
| `modules[]` | Array | Ordered list of modules |

### Module Fields

| Field | Type | Description |
|---|---|---|
| `title` | String | Module name (e.g. "Module 1: PDAs") |
| `sortOrder` | Number | Display order |
| `lessons[]` | Array | Ordered list of lessons |
| `quiz` | Quiz | Optional end-of-module quiz (see Quiz Schema below) |

### Lesson Fields

| Field | Type | Description |
|---|---|---|
| `title` | String | Lesson name |
| `lessonType` | Select | `content` (reading/video) or `challenge` (interactive code) |
| `content` | Portable Text | Lesson body — supports Markdown, code blocks, images |
| `videoUrl` | URL | (Optional) YouTube or video embed URL |
| `estimatedTime` | Number | Estimated time in minutes |
| `xpReward` | Number | XP awarded when this lesson is completed (default: 100) |
| `resources[]` | Array | Optional external links (title + URL) |

### Challenge Fields (for `lessonType: challenge`)

| Field | Type | Description |
|---|---|---|
| `starterCode` | Code | Pre-populated code when student opens the editor |
| `language` | Select | `rust`, `typescript`, `javascript` |
| `testCases[]` | Array | Each has `name`, `input`, and `expectedOutput` |

### Quiz Schema (per Module)

Each module can have one optional quiz. Quizzes are multiple-choice and attached at the **module level**, not the lesson level.

| Field | Type | Description |
|---|---|---|
| `title` | String | Quiz title (default: `"Module Quiz"`) |
| `passingScore` | Number | Minimum score to pass, as a percentage (default: `70`) |
| `questions[]` | Array | List of questions (minimum 1 required) |

Each question has:

| Sub-field | Type | Description |
|---|---|---|
| `question` | Text | The question text |
| `options[]` | String array | Answer choices — minimum 2, maximum 6 |
| `correctIndex` | Number | Zero-based index of the correct answer (e.g. `0` = first option) |
| `explanation` | Text | (Optional) Shown to the student after they submit. Explains why the correct answer is right. |

> [!IMPORTANT]
> `correctIndex` is **zero-based**. If the correct answer is option 3, set `correctIndex` to `2`.


---

## Creating a Course Step by Step

### Step 1 — Create the Course

In `/teach/courses`, click **New Course**.

Fill in:
- **Title**: Descriptive and specific (e.g. `Fuzz Testing Solana Programs with Trident`)
- **Slug**: Auto-generated from title. **Do NOT change after students enroll** — enrollments are tied to the slug.
- **Difficulty**: `beginner`, `intermediate`, or `advanced`
- **XP Reward**: Suggested amounts:
  - Beginner: 500 XP
  - Intermediate: 1,000 XP
  - Advanced: 2,000 XP
- **Thumbnail**: Upload a 1280×720px image

### Step 2 — Add Modules

Modules group related lessons. Click **Add Module** and fill:
- **Title**: e.g. `Module 1: Introduction to Fuzzing`
- **Sort Order**: Determines display order (lowest = first)

### Step 3 — Add Lessons

Within each module, click **Add Lesson**. Choose the lesson type:

**Content Lesson** (reading/video):
1. Set `lessonType` to `content`
2. Write the body using the Portable Text editor
3. Add code blocks using the language-tagged block:
   ````
   ```rust
   pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
       Ok(())
   }
   ```
   ````
4. Optionally add a `videoUrl` for embedded video
5. Set XP reward (default: 100 XP)

**Challenge Lesson** (interactive coding):
1. Set `lessonType` to `challenge`
2. Write the **Challenge Prompt** in the content field
3. Create a linked **Challenge** document with:
   - `starterCode`: What the student sees on first load
   - `language`: `rust`, `typescript`, or `javascript`
   - `testCases[]`: Each test needs `name`, `input`, and `expectedOutput`

### Step 4 — Add a Module Quiz (Optional)

Each module can have one end-of-module quiz to test student understanding. This is configured directly in the in-app course editor using the **Quiz Builder** panel, visible at the bottom of each module.

1. In the module section, click **"Add Quiz"** (or enable the quiz toggle if present)
2. Set the **Passing Score** (default: 70%) — percentage the student must score to pass
3. Click **"Add Question"** for each question and fill in:
   - **Question text**: The actual question (e.g. "What does PDA stand for?")
   - **Options**: 2–6 answer choices 
   - **Correct answer**: Click the circle next to the correct option — it turns green ✅
   - **Explanation** (optional): Shown after the student submits. Explain WHY the answer is correct.
4. Add as many questions as needed (minimum 1)
5. Click **Save**

> [!IMPORTANT]
> `correctIndex` is **zero-based** in the underlying data. This is handled automatically in the UI — just click the correct option in the Quiz Builder and it's saved correctly.

> [!NOTE]
> Quizzes are attached to the **module**, not individual lessons. A student must pass the quiz before the module is marked complete. If you don't want a quiz for a module, simply leave it empty.

### Step 5 — Preview

Use the **Preview** button to see how the course looks on the live site before publishing.

### Step 6 — Publish

1. Toggle **Published** to `true`
2. Click **Save**
3. The course will appear on `/courses` immediately

> [!IMPORTANT]
> The course must also have a `programAddress` to activate **on-chain enrollment**. Without it, enrollment records only progress off-chain in the database. Ask the admin to run `createCourse` on Devnet and paste the resulting Course PDA address here.


---

## Updating Existing Courses

- **Adding new lessons** to a live course is safe — existing enrolled students will see new lessons in their progress tracker
- **Editing lesson content** (text, code) is always safe
- **Never change the Course slug** after students have enrolled
- **Never remove a lesson** from a published course — this would shift lesson bitmap indexes and corrupt existing progress data
- **Reordering lessons** is safe only before the first student enrolls (changes bit indices)

---

## Content Guidelines

### Writing Lesson Content

- Use **short paragraphs** (3-4 sentences max) for readability
- Begin each module with a **"What You'll Learn"** bullet list
- Use **code blocks** for ALL code — never put code inline in prose
- End challenge lessons with a clear description of what passing tests look like

### Supported Code Block Languages

Always specify the language in the code block for proper syntax highlighting:

| Language | Identifier |
|---|---|
| Rust | `rust` |
| TypeScript | `typescript` |
| JavaScript | `javascript` |
| JSON | `json` |
| Bash / Shell | `bash` |
| TOML | `toml` |
| YAML | `yaml` |

### Images

- Upload images directly to Sanity (drag-and-drop in the editor)
- Sanity serves images via `cdn.sanity.io` — no external hosting needed
- Recommended max width: `800px` for lesson images

### XP Strategy

| Action | Suggested XP |
|---|---|
| Complete content lesson | 50–100 XP |
| Complete challenge lesson | 100–200 XP |
| Complete full course | 500–2,000 XP |

---

## Sanity Dataset Management

### Environments

| Dataset | Use |
|---|---|
| `production` | Live site — be careful when editing |
| `staging` (optional) | Create a second dataset for safe testing |

### Exporting a Backup

```bash
cd app
npx sanity dataset export production backup.tar.gz
```

### Importing Data

```bash
npx sanity dataset import sample-courses.ndjson production
```

---

## API Integration

The Sanity client and schema types are in `src/sanity/`. Key files:

| File | Purpose |
|---|---|
| `src/sanity/client.ts` | Read-only Sanity client for public queries |
| `src/sanity/schemaTypes/` | TypeScript types for Course, Module, Lesson, Challenge |
| `src/sanity/lib/queries.ts` | GROQ queries used by API routes |

**Fetching courses** uses a 5-minute cache via Upstash Redis:

```typescript
const courses = await getCached(
  `${locale}:sanity:courses`,
  () => getCourses(locale),
  { ttl: 300 }
);
```

**GROQ query example** (course with all modules and lessons):

```groq
*[_type == "course" && slug.current == $slug && published == true][0] {
  _id,
  title,
  description,
  difficulty,
  xpReward,
  programAddress,
  modules[] {
    title,
    sortOrder,
    lessons[] {
      _key,
      title,
      lessonType,
      xpReward,
      estimatedTime,
      content,
      videoUrl,
      challenge-> {
        starterCode,
        language,
        testCases[]
      }
    }
  }
}
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Course not showing on `/courses` | `published` is not `true` | Set `published = true` in Sanity and save |
| Enrollment button not working | `programAddress` missing | Add the on-chain Course PDA address |
| Lesson content not rendering | Missing language on code block | Add language identifier to all code blocks |
| Images not loading in production | Domain not allowlisted | Ensure `cdn.sanity.io` is in `next.config.ts` under `images.remotePatterns` |
| Studio showing blank screen | Not logged in to Sanity | Run `sanity login` in terminal |
| "Title must be unique" error | Duplicate course title | Change the title — Sanity validates uniqueness in real-time |
