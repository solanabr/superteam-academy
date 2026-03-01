# CMS Integration Guide

How to create and edit courses, the content schema, and the publishing workflow. Also covers migrating from local data to a headless CMS.

## 1. Current Content Architecture

Course content is managed through a local data pipeline:

```
REFERENCE_COURSE_CATALOG.ts   (source of truth - rich course definitions)
        |
        v
src/lib/data/mock-courses.ts  (normalizes into app Course model)
        |
        v
src/lib/services/*Service     (interface boundary - hooks consume these)
```

This separation makes CMS migration low-risk: replace the data source behind service interfaces without touching UI code.

## 2. Content Schema

### Course

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `slug` | string | URL-friendly identifier |
| `title` | string | Display title |
| `subtitle` | string | Short tagline |
| `description` | string | Full description |
| `difficulty` | `beginner` / `intermediate` / `advanced` | Difficulty level |
| `duration` | string | Estimated time (e.g. "6 hours") |
| `tags` | string[] | Searchable tags |
| `modules` | Module[] | Ordered list of modules |
| `category` | string | Course category |
| `gradient` | string | Tailwind gradient classes for card styling |

### Module

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique within course |
| `title` | string | Module title |
| `lessons` | Lesson[] | Ordered list of lessons |

### Lesson

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique within module |
| `title` | string | Lesson title |
| `kind` | `content` / `challenge` | Content-only or code challenge |
| `duration` | string | Estimated time |
| `markdown` | string | Lesson body (Markdown) |
| `challenge` | ChallengeConfig? | For `kind: challenge` only |

### ChallengeConfig

| Field | Type | Description |
|-------|------|-------------|
| `starterCode` | string | Initial code in editor |
| `language` | string | `typescript` or `rust` |
| `tests` | TestCase[] | Validation tests |
| `solution` | string | Reference solution |

## 3. Creating a New Course

### Step 1: Define in REFERENCE_COURSE_CATALOG.ts

Add a new course object to the `courses` array:

```typescript
{
  title: "Your Course Title",
  slug: "your-course-slug",
  subtitle: "Short description",
  description: "Full course description...",
  difficulty: "beginner",
  duration: "4 hours",
  tags: ["solana", "rust"],
  category: "Development",
  modules: [
    {
      title: "Module 1",
      lessons: [
        {
          title: "Lesson 1",
          kind: "content",
          duration: "15 min",
          markdown: "# Lesson content in Markdown..."
        },
        {
          title: "Challenge 1",
          kind: "challenge",
          duration: "20 min",
          markdown: "# Challenge instructions...",
          challenge: {
            starterCode: "// Write your code here",
            language: "typescript",
            tests: [
              { input: "test input", expected: "expected output", description: "Test description" }
            ]
          }
        }
      ]
    }
  ]
}
```

### Step 2: Validate

1. Restart dev server (or wait for HMR)
2. Check `/courses` - course appears in catalog
3. Check `/courses/your-course-slug` - detail page renders
4. Walk through lessons at `/courses/your-course-slug/lessons/0`

### Step 3: On-Chain Registration

For on-chain enrollment/completion to work, the course must also be registered on the Solana program via `create_course` instruction. See the on-chain program docs for details.

## 4. Editing Existing Courses

1. Find the course in `REFERENCE_COURSE_CATALOG.ts`
2. Modify title, description, modules, or lessons
3. The changes propagate through `mock-courses.ts` -> services -> UI automatically

## 5. Service Interface Contracts

These are the boundaries for CMS migration. Replace the `Local*` classes with CMS-backed implementations.

### CourseService (`src/lib/services/course-service.ts`)

```typescript
interface CourseService {
  getAllCourses(): Promise<Course[]>
  getCourseBySlug(slug: string): Promise<Course | null>
  searchCourses(query: string, difficulty?: string): Promise<Course[]>
  enrollInCourse(signer: WalletEnrollmentSigner, courseId: string): Promise<string>
}
```

### LearningProgressService (`src/lib/services/learning-progress.ts`)

```typescript
interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<CourseProgress>
  completeLesson(userId: string, courseId: string, lessonId: string): Promise<void>
  getXpBalance(walletAddress: string): Promise<number>
  getStreakData(userId: string): Promise<StreakData>
  getLeaderboard(timeframe: string, limit?: number): Promise<LeaderboardEntry[]>
  getCredentials(walletAddress: string): Promise<Credential[]>
}
```

### Other Services

- `AchievementService` - `listAchievements(userId)`, `claimAchievement(userId, id)`
- `LeaderboardService` - `getEntries(timeframe)`
- `CredentialService` - `getCredentialsByWallet(wallet)`, `issueCredential(courseId, wallet)`

## 6. CMS Migration Strategy

### Recommended Approach

1. Keep all service interfaces unchanged
2. Create CMS-backed classes (e.g. `SanityCourseService`) implementing the same interface
3. Swap the exported singleton (e.g. `export const courseService = new SanityCourseService()`)
4. Hooks and routes remain untouched

### Adapter Example (Sanity)

```typescript
class SanityCourseService implements CourseService {
  async getAllCourses(): Promise<Course[]> {
    const docs = await sanityClient.fetch('*[_type == "course"]');
    return docs.map(mapSanityToCourse);
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    const doc = await sanityClient.fetch(
      '*[_type == "course" && slug.current == $slug][0]',
      { slug }
    );
    return doc ? mapSanityToCourse(doc) : null;
  }

  async searchCourses(query: string, difficulty?: string): Promise<Course[]> {
    const all = await this.getAllCourses();
    return all.filter(c => {
      const byQuery = !query || c.title.toLowerCase().includes(query.toLowerCase());
      const byDiff = !difficulty || c.difficulty === difficulty;
      return byQuery && byDiff;
    });
  }
}
```

### Suggested CMS Document Types

| CMS Type | Maps To |
|----------|---------|
| `course` | `Course` |
| `module` | `Module` |
| `lesson` | `Lesson` |
| `credential` | `Credential` |
| `achievement` | `Achievement` |

### Migration Checklist

- [ ] Implement CMS-backed service classes
- [ ] Add Zod runtime validation at service boundary
- [ ] Configure CMS endpoint/token env vars
- [ ] Verify all routes render with CMS data
- [ ] Keep fallbacks for null/empty states
- [ ] Progressively move read-heavy views to server components

## 7. Lesson Rendering

Current rendering expects Markdown strings (`Lesson.markdown`). The renderer is in:

- `src/app/courses/[slug]/lessons/[id]/page.tsx` - Lesson route
- `src/components/course/lesson-content.tsx` - Markdown renderer

If your CMS stores rich text blocks, convert to Markdown in the service adapter or replace the renderer with a rich text component.
