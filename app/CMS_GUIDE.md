# CMS Guide — Sanity Integration

## Overview

The app uses Sanity as a headless CMS for lesson content, quiz questions, and course metadata. **Sanity is optional** — the app falls back to hardcoded quiz data and shows a placeholder for lesson content when Sanity is not configured. Quiz security: `lib/quiz-questions.ts` (client, no answers) and `lib/quiz-data.ts` (server-only, has `correctIndex`) are separate files. Sanity quiz questions override both when available.

## Setup

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage)
2. Set env vars:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```
3. Run the Sanity Studio separately: `npx sanity dev` (requires a `sanity.cli.ts` in your Sanity project)

## Schemas

### Course
```
{
  courseId: string       // Must match on-chain courseId
  title: { en, ptBR, es }
  description: { en, ptBR, es }
  coverImage: image
  trackId: number
}
```

### Lesson
```
{
  course: reference → Course
  lessonIndex: number
  title: { en, ptBR, es }
  body: portableText[]  // Rich text with code blocks and images
  codeChallenge: {
    initialCode: string
    language: string
    expectedOutput: string
    instructions: string
  }
  quizQuestions: [{
    question: string
    options: string[]
    correctIndex: number
  }]
}
```

### Track
```
{
  trackId: number
  name: { en, ptBR, es }
  description: { en, ptBR, es }
}
```

## Content Workflow

1. Create courses in Sanity matching on-chain `courseId` values
2. Add lessons with `lessonIndex` matching on-chain lesson order (0-indexed)
3. Add quiz questions to lessons — these override both `lib/quiz-questions.ts` (client) and `lib/quiz-data.ts` (server)
4. Add rich text body content — rendered via PortableText on the lesson page
5. Add code challenges for interactive coding exercises

## Fallback Behavior

| Content | Sanity Available | Sanity Unavailable |
|---|---|---|
| Quiz questions | Fetched from Sanity (5min cache) | Falls back to `lib/quiz-data.ts` |
| Lesson body | Rendered via PortableText | Shows placeholder message |
| Code challenges | Rendered via Monaco editor | Not shown |
| Course metadata | Available for enrichment | Uses on-chain data only |

## Locale Handling

All text fields use a `{ en, ptBR, es }` object structure. The lesson page currently renders the `en` field. Locale-aware content selection is supported by the schema but not yet wired to the frontend — UI strings are fully translated via `next-intl`, while CMS content defaults to English.

## API Route Integration

`/api/complete-lesson` queries Sanity for quiz answers first:
1. Fetch quiz questions from Sanity (cached 5 minutes)
2. If Sanity returns questions, validate against `correctIndex`
3. If Sanity is unavailable, fall back to `lib/quiz-data.ts`
4. If no quiz data exists, accept empty answers (auto-complete)
