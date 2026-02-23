# CMS Integration Guide

This guide explains the current local/mock data architecture and how to replace it with Sanity or any headless CMS while preserving existing UI contracts.

## 1) Current Data Pattern

The frontend currently uses local data + service interfaces:

- `src/lib/data/mock-courses.ts`
  - Generates `mockCourses`, `mockLeaderboard`, `mockProfiles`, `mockAchievements`, `mockCredentials`.
  - Uses `REFERENCE_COURSE_CATALOG.ts` as source and maps into app types.

- `src/lib/services/*`
  - Service interfaces define stable contracts.
  - `Local*Service` classes return local/mock values.

This separation is the key reason backend migration is low-risk.

## 2) Service Interface Contracts

Use these contracts as your CMS adapter boundary.

### `CourseService` (`src/lib/services/course-service.ts`)

- `getAllCourses(): Promise<Course[]>`
- `getCourseBySlug(slug: string): Promise<Course | null>`
- `searchCourses(query: string, difficulty?: Course["difficulty"]): Promise<Course[]>`
- `enrollInCourse(signer, courseId): Promise<string>`

### `LearningProgressService` (`src/lib/services/learning-progress.ts`)

- `getProgress(userId, courseId): Promise<CourseProgress>`
- `completeLesson(userId, courseId, lessonId): Promise<void>`
- `getXpBalance(walletAddress): Promise<number>`
- `getStreakData(userId): Promise<StreakData>`
- `getLeaderboard(timeframe, limit?): Promise<LeaderboardEntry[]>`
- `getCredentials(walletAddress): Promise<Credential[]>`

### `AchievementService` (`src/lib/services/achievement-service.ts`)

- `listAchievements(userId): Promise<Achievement[]>`
- `claimAchievement(userId, achievementId): Promise<Achievement | null>`

### `LeaderboardService` (`src/lib/services/leaderboard-service.ts`)

- `getEntries(timeframe): Promise<LeaderboardEntry[]>`

### `CredentialService` (`src/lib/services/credential-service.ts`)

- `getCredentialsByWallet(walletAddress): Promise<Credential[]>`
- `issueCredential(courseId, walletAddress): Promise<Credential>`

## 3) Swap Strategy (Recommended)

1. Keep all interfaces unchanged.
2. Replace each `Local*Service` class with a CMS-backed class (REST/GraphQL/SDK).
3. Preserve exported singleton names (`courseService`, `learningProgressService`, etc.) so hooks/routes remain untouched.
4. Add runtime validation (recommended: `zod`) at service boundary.
5. Keep fallbacks for null/empty states.

## 4) Sanity Example Mapping

### Suggested Sanity document types

- `course`
- `module`
- `lesson`
- `credential`
- `achievement`
- `profile`
- `leaderboardSnapshot`

### Suggested field mapping

- Sanity `course.slug.current` -> app `Course.slug`
- Sanity `course.title` -> app `Course.title`
- Sanity `course.modules[]` -> app `Course.modules`
- Sanity `lesson.body` -> app `Lesson.markdown`
- Sanity `lesson.kind` -> app `Lesson.kind`

### Adapter skeleton (conceptual)

```ts
class SanityCourseService implements CourseService {
  async getAllCourses(): Promise<Course[]> {
    const docs = await sanityClient.fetch("*");
    return docs.map(mapSanityCourseToCourse);
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    const doc = await sanityClient.fetch("*[_type == 'course' && slug.current == $slug][0]", { slug });
    return doc ? mapSanityCourseToCourse(doc) : null;
  }

  async searchCourses(query: string, difficulty?: Course["difficulty"]): Promise<Course[]> {
    const docs = await sanityClient.fetch("*");
    return docs
      .map(mapSanityCourseToCourse)
      .filter((course) => {
        const q = query.toLowerCase();
        const byQuery = !q || course.title.toLowerCase().includes(q) || course.tags.some((t) => t.toLowerCase().includes(q));
        const byDifficulty = difficulty ? course.difficulty === difficulty : true;
        return byQuery && byDifficulty;
      });
  }

  async enrollInCourse(signer: WalletEnrollmentSigner, courseId: string): Promise<string> {
    // keep current Solana tx path or replace with program instruction flow
    return "tx-signature";
  }
}
```

## 5) Generic Headless CMS (Contentful, Strapi, Hygraph, etc.)

The same adapter model applies:

- Fetch CMS documents.
- Map to app domain types from `src/types/index.ts`.
- Return data through existing service interfaces.
- Do not leak CMS-specific models into route components.

## 6) Lessons + Rich Text Handling

Current lesson rendering expects plain markdown strings (`Lesson.markdown`).

If CMS stores rich text blocks:

1. Convert rich text to markdown in service adapter, or
2. Replace renderer in lesson route/components with rich text renderer.

Current affected files:

- `src/app/courses/[slug]/lessons/[id]/page.tsx`
- `src/components/course/lesson-content.tsx`

## 7) Caching and Revalidation Considerations

Because much of the app is currently client-driven:

- You can start with client fetches in services.
- For SEO/performance, progressively move read-heavy views to server components and fetch on server with revalidation.

Potential first candidates:

- Course catalog page
- Course detail page
- Public profile page

## 8) Migration Checklist

1. Implement CMS-backed service classes.
2. Keep contract compatibility with current hooks/routes.
3. Add typed mappers for each domain entity.
4. Validate data with `zod` in adapters.
5. Add env config for CMS endpoint/token.
6. Verify routes:
   - `/courses`
   - `/courses/[slug]`
   - `/courses/[slug]/lessons/[id]`
   - `/dashboard`
   - `/profile/[username]`
7. Remove or reduce direct `mock*` imports from route files as backend parity improves.
