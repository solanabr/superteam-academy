# CMS Guide — Superteam Academy

How to manage course content using Sanity CMS or the built-in mock data system.

## Content Architecture

```
Course
├── title, slug, description, trackId, difficulty, xpReward
├── modules[]
│   ├── id, title, description
│   └── lessons[]
│       ├── id, title, type (content | challenge), xp, duration
│       ├── content (HTML)
│       └── challenge? { starterCode, solution, testCases[], language }
├── prerequisite? (slug of prerequisite course)
└── metadata (instructor, whatYouLearn[], thumbnail)
```

## Option A: Sanity CMS (recommended for production)

### Setup

1. Create a Sanity project at [sanity.io/manage](https://sanity.io/manage)
2. Set environment variables:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your-write-token
   ```
3. Deploy schemas:
   ```bash
   cd app
   npx sanity deploy
   ```

### Content Schemas

Schemas are defined in `src/lib/sanity/schemas/`:

| Schema | Fields |
|--------|--------|
| **course** | title, slug, description, trackId, difficulty, modules, xpReward, prerequisite, thumbnail, instructor |
| **module** | id, title, description, lessons |
| **lesson** | id, title, type, xp, duration, content (portable text), challenge |
| **challenge** | starterCode, solution, testCases, language, hints |

### Creating a Course

1. Open Sanity Studio at `your-project.sanity.studio`
2. Create a new **Course** document
3. Fill required fields: title, slug, description, trackId (1-5), difficulty
4. Add modules with lessons
5. For challenge lessons, add starter code, solution, and test cases
6. Test cases use `expectedOutput` as a required keyword/pattern the learner's code must contain (validated server-side via `POST /api/challenges/run`)
7. Mark sensitive test cases as `hidden: true` — their patterns are never exposed to the browser
8. Publish the document

### GROQ Queries

The app uses GROQ queries defined in `src/lib/sanity/queries.ts`:

```groq
// All courses
*[_type == "course"] | order(trackId asc) {
  title, slug, description, trackId, difficulty, xpReward,
  "lessonCount": count(modules[].lessons[]),
  "thumbnail": thumbnail.asset->url
}

// Single course with full content
*[_type == "course" && slug.current == $slug][0] {
  ...,
  modules[] {
    ...,
    lessons[] { ... }
  }
}
```

## Option B: Mock Data (development / demo)

When `NEXT_PUBLIC_SANITY_PROJECT_ID` is empty, the app automatically uses the built-in mock course service.

### Mock Courses

6 courses are included in `src/services/implementations/mock-course-service.ts`:

| # | Course | Track | Difficulty | Lessons |
|---|--------|-------|------------|---------|
| 1 | Introduction to Solana | Fundamentals | Beginner | 8 |
| 2 | Anchor Fundamentals | Smart Contracts | Beginner | 10 |
| 3 | Token-2022 Extensions | Smart Contracts | Intermediate | 6 |
| 4 | Metaplex Core NFTs | Smart Contracts | Intermediate | 5 |
| 5 | DeFi on Solana | DeFi | Advanced | 8 |
| 6 | Solana Mobile (Saga) | Mobile | Intermediate | 6 |

### Adding Mock Courses

Edit `mock-course-service.ts` and add entries to the `MOCK_COURSES` array:

```typescript
{
  courseId: "unique-id",
  title: "My Course",
  slug: "my-course",
  description: "Course description",
  trackId: 1, // 1=Fundamentals, 2=Smart Contracts, 3=DeFi, 4=Frontend, 5=Mobile
  difficulty: "beginner",
  xpReward: 500,
  lessonCount: 5,
  enrolledCount: 0,
  isActive: true,
  prerequisite: null,
  modules: [
    {
      id: "mod-1",
      title: "Module 1",
      lessons: [
        {
          id: "lesson-1",
          title: "Lesson Title",
          type: "content", // or "challenge"
          xp: 100,
          duration: "10 min",
          content: "<h2>HTML content here</h2><p>Supports full HTML.</p>",
        },
      ],
    },
  ],
}
```

## Publishing Workflow

1. **Draft** → Content is being written (not visible to learners)
2. **Published** → Live on the platform (`isActive: true`)
3. **Archived** → Hidden from catalog but existing enrollments preserved

## Content Best Practices

- Use progressive disclosure: start simple, build complexity
- Every content lesson should be 5-15 minutes
- Every challenge should have clear test cases with helpful messages
- `expectedOutput` is the keyword/pattern the learner's code must include (e.g., `checked_add`, `findProgramAddressSync`)
- Use `hidden: true` for test cases whose patterns should not be visible to learners
- Comments in user code are stripped before validation — patterns inside comments won't pass
- Include code examples with syntax highlighting (`<pre><code>`)
- Use the `whatYouLearn` field to set expectations
- Set realistic `duration` estimates
