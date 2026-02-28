# Superteam Academy - CMS Guide (Sanity)

Course content — courses, modules, lessons, and instructors — is managed through Sanity CMS. The Sanity Studio is embedded directly in the Next.js app at the `/studio` route.

## Initial Setup

### Step 1 - Create a Sanity Project

1. Go to [sanity.io](https://sanity.io) and sign in (free account is sufficient).
2. Click **Create new project**.
3. Name it `superteam-academy` and choose the `production` dataset.
4. Note your **Project ID** from the project dashboard (looks like `abc12def`).

### Step 2 - Set Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production
# Optional: write token for seeding via script
SANITY_API_TOKEN=your_token_here
```

To get `SANITY_API_TOKEN`:
1. Sanity dashboard → your project → **API** tab → **Tokens**
2. Add token → name it `next-editor` → set permissions to **Editor**
3. Copy the token value immediately (shown only once)

### Step 3 - Configure CORS for Sanity Studio

1. Sanity dashboard → your project → **API** tab → **CORS Origins**
2. Add `http://localhost:3000` for development
3. Add your production URL (e.g. `https://your-app.vercel.app`) for production
4. Check **Allow credentials** for both

### Step 4 - Open the Studio

Start the dev server (`npm run dev`) and navigate to:
```
http://localhost:3000/studio
```

The embedded Sanity Studio will load. On first visit it may ask you to authorize with your Sanity account.

## Schema Overview

The content model follows a three-level hierarchy:

```
course
  ├── title (string, required)
  ├── slug (auto-generated from title)
  ├── description (string, max 300 chars — used in cards)
  ├── longDescription (portable text — shown on detail page)
  ├── difficulty ("beginner" | "intermediate" | "advanced")
  ├── durationHours (number)
  ├── xpReward (number — total XP for completing all lessons)
  ├── trackId (number — must match TRACKS constant, see Track IDs below)
  ├── thumbnail (image)
  ├── instructor (reference → instructor document)
  ├── modules[] (references → module documents, ordered)
  ├── tags[] (string array)
  ├── prerequisiteSlug (string — slug of required prior course)
  ├── onChainCourseId (string — must match courseId in Anchor program)
  └── publishedAt (datetime — null = draft, set to publish)

module
  ├── title (string)
  ├── description (string)
  ├── order (number — used for sorting within course)
  └── lessons[] (references → lesson documents, ordered)

lesson
  ├── title (string)
  ├── type ("content" | "challenge")
  ├── order (number)
  ├── xpReward (number)
  ├── estimatedMinutes (number)
  │
  ├── [type = "content"]
  │   └── content (Portable Text — rich text with code blocks + images)
  │
  └── [type = "challenge"]
      ├── starterCode (string — shown to learner in Monaco Editor)
      ├── solutionCode (string — reference only, never shown to learner)
      └── testCases[]
          ├── description (string — shown as test name)
          ├── input (string)
          └── expectedOutput (string)

instructor
  ├── name (string)
  ├── bio (string)
  ├── avatar (image)
  ├── twitterHandle (string — without @)
  └── githubHandle (string — without @)
```

## Creating a Course — Step by Step

### Step 1 - Create the Instructor (if new)

1. Studio sidebar → **Instructor** → **+ Create**
2. Fill in name, bio (2-3 sentences), upload avatar
3. Add Twitter and GitHub handles (optional, shown on course page)
4. Click **Publish**

### Step 2 - Create Lessons

Create all lessons before creating modules. This lets you reuse lessons across modules.

1. Studio sidebar → **Lesson** → **+ Create**
2. Set **Type**:
   - `content` — for reading/video lessons
   - `challenge` — for coding exercises in Monaco Editor
3. For **content lessons**:
   - Write in the rich text editor (Portable Text)
   - Insert code blocks: click the code icon → select language (Rust, TypeScript, JSON, Bash, Shell)
   - Add images inline for diagrams
   - Use **H2** for major sections, **H3** for subsections
4. For **challenge lessons**:
   - **Starter Code**: what the learner sees (should compile with a placeholder return value)
   - **Solution Code**: reference answer (never exposed to learner)
   - **Test Cases**: add 2-5 cases, each with a description, input, and expected output
5. Set **XP Reward** (typically 50-200 per lesson) and **Estimated Minutes** (5-30)
6. Set **Order** number (1, 2, 3... within the module)
7. Click **Publish**

### Step 3 - Create Modules

1. Studio sidebar → **Module** → **+ Create**
2. Set title (e.g. "Introduction to Accounts") and description
3. Set **Order** number (1, 2, 3... within the course)
4. Click the **Lessons** field → **Add item** → search for your lessons
5. Arrange lessons in the desired order
6. Click **Publish**

### Step 4 - Create the Course

1. Studio sidebar → **Course** → **+ Create**
2. Fill in **Title** — the slug is auto-generated (edit if needed)
3. **Description**: 1-2 sentences for course cards (max 300 chars)
4. **Long Description**: detailed overview using rich text
5. Set **Difficulty**: beginner / intermediate / advanced
6. **Duration Hours**: total estimated time
7. **XP Reward**: total XP for completing the course (sum of all lesson XP rewards)
8. **Track ID**: number matching the TRACKS constant (see table below)
9. Upload a **Thumbnail** (recommended: 1200x675 jpg, dark background)
10. Select **Instructor** from the dropdown
11. **Modules**: Add all modules in order
12. **On-Chain Course ID**: must match the `courseId` string used when registering the course in the Anchor program (e.g. `anchor-101`). This is used for PDA derivation.
13. **Prerequisite Slug** (optional): slug of a course that must be completed first
14. Set **Published At** to today's date to make the course visible
15. Click **Publish**

## Track IDs

The `trackId` field on a course must exactly match one of these IDs defined in `src/types/index.ts`:

| ID | Track Name | Description | Accent Color |
|---|---|---|---|
| 1 | Solana Basics | Core Solana concepts and development | `#14F195` |
| 2 | Anchor Framework | Build on-chain programs with Anchor | `#9945FF` |
| 3 | DeFi | Decentralized finance protocols | `#00D4FF` |
| 4 | NFTs & Digital Assets | Metaplex and digital collectibles | `#F5A623` |
| 5 | Full-Stack Solana | End-to-end dApp development | `#FF4444` |

To add a new track, see `CUSTOMIZATION.md > Adding a Track`.

## On-Chain Course ID Mapping

The `onChainCourseId` field must match the `course_id` string used in the Anchor `initialize_course` instruction. This creates the link between Sanity content and the on-chain course PDA:

```
Sanity: onChainCourseId = "solana-basics-01"
           ↕ must match
Anchor PDA: ["course", "solana-basics-01"] → Course account
```

If these don't match, enrollment and progress tracking will fail silently.

## Content Formatting Guide

### For Content Lessons

- **Structure**: Start with a 1-2 sentence objective, then concepts, then examples, then a summary
- **Headings**: H2 for major sections (`##`), H3 for subsections (`###`)
- **Code blocks**: Always set the language. Supported: `rust`, `typescript`, `javascript`, `json`, `bash`, `shell`, `toml`
- **Inline code**: Use backticks for file names, function names, variable names
- **Keep it focused**: Aim for 5-15 minutes reading time per lesson
- **Images**: Add diagrams for account relationship explanations, transaction flows

### For Challenge Lessons

- **Starter code**: Must be syntactically valid. Use `todo!()` in Rust or `throw new Error("implement me")` in TypeScript as placeholders
- **Solution code**: The reference implementation. Not shown to learners
- **Test cases**: Be specific. Bad: "should work". Good: "Given input [1, 2, 3], returns sum 6"
- **Number of tests**: 2-5 tests. More is not always better — each test should verify a distinct behavior
- **Test input/output**: Strings representing the values. The frontend test runner compares output as strings

### Code Block Example (Rich Text)

When editing in Portable Text, click the code icon and write:

```rust
// ✓ Good: clear, annotated example
let lamports = 1_000_000; // 0.001 SOL
let transaction = Transaction::new_signed_with_payer(
    &[instruction],
    Some(&payer.pubkey()),
    &[&payer],
    recent_blockhash,
);
```

## Publishing Workflow

1. **Draft**: Document exists in Studio but `publishedAt` is not set → hidden from frontend
2. **Published**: `publishedAt` is set to a past date → visible to all learners
3. **Unpublish**: Click **Unpublish** in Studio → removes from frontend immediately
4. **Delete**: Removes the document permanently. Unlink from modules/courses first

Edits to published content are live immediately (Sanity CDN serves the latest revision within seconds).

## Sample Course JSON (for Seeding via Script)

```json
{
  "_type": "course",
  "title": "Solana Basics",
  "slug": { "current": "solana-basics" },
  "description": "Learn the fundamentals of Solana: accounts, programs, transactions, and the Solana programming model.",
  "difficulty": "beginner",
  "durationHours": 3,
  "xpReward": 500,
  "trackId": 1,
  "onChainCourseId": "solana-basics-01",
  "tags": ["solana", "basics", "accounts", "programs"],
  "publishedAt": "2026-01-01T00:00:00Z"
}
```

## Troubleshooting

**Studio shows "Unauthorized"**: Ensure your sanity.io login has access to the project. Add your email under project settings > Members.

**Course not showing on frontend**: Check that `publishedAt` is set to a past date and the document is published (not draft).

**Lesson XP not matching**: The `xpReward` on the Course document is informational. Actual XP minted on-chain is set in the Anchor program's `initialize_course` instruction as `xp_per_lesson`. Keep them in sync.

**OnChainCourseId mismatch**: If enrollment works but progress does not show, the `onChainCourseId` in Sanity doesn't match the `course_id` in the deployed program account. Verify with `solana account [CoursePDA]`.
