# CMS Guide — Superteam Academy

## Sanity CMS Setup

### 1. Create Sanity Project

```bash
npm create sanity@latest -- --project superteam-academy --dataset production
```

Copy the project ID to `.env.local`:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
```

### 2. Install Sanity Studio

```bash
cd studio
npm install
npm run dev
```

Access at http://localhost:3333

### 3. Deploy Studio

```bash
sanity deploy
```

## Content Schema

### Document Types

#### Track
Learning tracks group courses by topic:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | "Solana Fundamentals" |
| `slug` | slug | URL-friendly identifier |
| `description` | text | Short description |
| `color` | string | Hex color (e.g., `#9945FF`) |
| `icon` | string | Emoji icon |
| `order` | number | Display order |

#### Course
Main course document:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Course title |
| `slug` | slug | URL slug (auto from title) |
| `shortDescription` | string | Card preview text (140 chars) |
| `description` | text | Full description |
| `thumbnail` | image | Course thumbnail |
| `instructor` | reference | Instructor document |
| `track` | reference | Learning track |
| `difficulty` | string | beginner/intermediate/advanced/expert |
| `duration` | number | Total minutes |
| `lessonCount` | number | Total lessons |
| `xpReward` | number | XP for course completion |
| `xpPerLesson` | number | XP per lesson |
| `tags` | array | ["anchor", "rust", "defi"] |
| `language` | string | "en", "pt-BR", "es" |
| `isActive` | boolean | Published and accessible |
| `courseId` | string | On-chain course ID (e.g., "anchor-101") |
| `trackId` | number | On-chain track ID |
| `modules` | array | References to Module documents |

#### Module
Groups related lessons:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | "Introduction to Solana" |
| `description` | text | Module overview |
| `order` | number | Position in course |
| `lessons` | array | References to Lesson documents |

#### Lesson
Individual learning unit:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Lesson title |
| `type` | string | content/challenge/video/quiz |
| `duration` | number | Minutes |
| `lessonIndex` | number | Bitmap index (0-255), must be unique per course |
| `xpReward` | number | XP for completing this lesson |
| `content` | portable text | Rich text content with code blocks |
| `challenge` | reference | Challenge document (for type=challenge) |
| `videoUrl` | url | Video URL (for type=video) |

#### Challenge (Code Challenge)

| Field | Type | Description |
|-------|------|-------------|
| `prompt` | text | Challenge instructions |
| `language` | string | rust/typescript/json/bash |
| `starterCode` | text | Pre-populated editor code |
| `solution` | text | Hidden solution code |
| `testCases` | array | Pass/fail test cases |
| `hints` | array | Progressive hints |

## Creating Content

### Sample Course Flow

1. **Create Track**: Platform → Tracks → New  
   Name: "Solana Fundamentals", Color: "#9945FF", Icon: "⚡"

2. **Create Instructor**: Platform → Instructors → New  
   Fill name, bio, avatar, social links

3. **Create Challenges** (for coding lessons): Content → Challenges → New  
   Set prompt, starter code, solution, test cases, hints

4. **Create Lessons** in order:
   - Lesson 0: "What is Solana?" (content, 15min, 75 XP, index: 0)
   - Lesson 1: "Proof of History" (content, 20min, 75 XP, index: 1)  
   - Lesson 2: "PDA Derivation" (challenge, 30min, 100 XP, index: 2, challenge: ref)

5. **Create Module**: "Introduction to Solana"  
   Add lessons in order

6. **Create Course**: "Solana Fundamentals"  
   Set all metadata, reference track/instructor/modules  
   Set `courseId: "solana-101"` to match on-chain course

### Publishing Workflow

1. Create draft content
2. Preview changes at `/api/preview?slug=...`
3. Publish when ready
4. Content appears live (Sanity CDN, ~1s delay)

### Lesson Index Assignment

**Critical**: Each lesson's `lessonIndex` must be unique within its course (0-255).  
These map to the on-chain bitmap in the Enrollment PDA.

```
Course "anchor-101":
  Module 1:
    Lesson 0: index 0
    Lesson 1: index 1
    Lesson 2: index 2
  Module 2:
    Lesson 3: index 3
    ...
```

## Rich Text Content

The content field supports:
- Headings (H1-H3)
- Paragraphs
- Bold/italic/code
- Images with alt text
- Custom code blocks (with language selection)
- Bullet/numbered lists

### Code Block Example

```json
{
  "_type": "codeBlock",
  "language": "rust",
  "code": "use anchor_lang::prelude::*;\n\n#[program]\npub mod academy { ... }"
}
```

## Localization

For multilingual content:
1. Create separate lesson documents for each language
2. Set the lesson's `language` field
3. Reference appropriate language lesson in the module

## Fetching Content

The frontend fetches content from Sanity using GROQ queries in `src/lib/sanity/queries.ts`.  
Data is cached via TanStack Query with 60s stale time.
