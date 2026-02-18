# 📝 CMS Guide — Superteam Academy

## Overview

Superteam Academy supports headless CMS integration for course content management. The current implementation uses a local data file (`src/lib/courses-data.ts`) as a mock CMS, designed to be swapped with Sanity, Strapi, or Contentful.

## Content Schema

### Course
```typescript
{
  slug: string;           // URL-friendly identifier
  title: string;          // Course title
  description: string;    // Short description
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;       // e.g., "8 horas"
  xp: number;             // Total XP for completing course
  track: string;          // Learning track (e.g., "Solana Fundamentals")
  thumbnail?: string;     // Course card image URL
  instructor?: string;    // Instructor name
  modules: Module[];      // Ordered list of modules
}
```

### Module
```typescript
{
  id: string;
  title: string;
  lessons: Lesson[];
}
```

### Lesson
```typescript
{
  id: string;
  title: string;
  type: 'content' | 'challenge';
  content: string;        // Markdown with code blocks
  difficulty: number;     // 1-5, affects XP reward
  xp: number;             // XP awarded on completion
  quiz?: Quiz;            // Optional quiz at end
  challenge?: Challenge;  // For type='challenge'
  hints?: string[];       // Progressive hints
  solution?: string;      // Solution code (toggle reveal)
}
```

### Quiz
```typescript
{
  questions: {
    text: string;
    options: string[];
    correctIndex: number;
  }[];
  passingScore: number;   // 0-100, default 70
}
```

### Challenge
```typescript
{
  prompt: string;         // Challenge description
  objectives: string[];   // Clear success criteria
  starterCode: string;    // Pre-populated code
  language: 'rust' | 'typescript' | 'json';
  testCases: {
    input: string;
    expectedOutput: string;
    description: string;
  }[];
}
```

## Creating a Course

### Using Local Data (Development)

Edit `src/lib/courses-data.ts`:

```typescript
export const courses: Course[] = [
  {
    slug: 'my-new-course',
    title: 'Meu Novo Curso',
    description: 'Aprenda algo incrível sobre Solana',
    difficulty: 'beginner',
    duration: '4 horas',
    xp: 500,
    track: 'Solana Fundamentals',
    modules: [
      {
        id: 'mod-1',
        title: 'Módulo 1: Introdução',
        lessons: [
          {
            id: 'lesson-1',
            title: 'O que é Solana?',
            type: 'content',
            content: `# O que é Solana?\n\nSolana é uma blockchain de alto desempenho...`,
            difficulty: 1,
            xp: 25,
          },
        ],
      },
    ],
  },
];
```

### Using Sanity (Recommended for Production)

1. Create a Sanity project: `npx sanity@latest init`
2. Define schemas matching the types above
3. Create a `src/lib/cms/sanity-client.ts`:

```typescript
import { createClient } from '@sanity/client';

export const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: 'production',
  useCdn: true,
  apiVersion: '2024-01-01',
});

export async function getCourses() {
  return sanity.fetch(`*[_type == "course"] | order(title asc)`);
}
```

4. Replace imports in page components from `courses-data.ts` to the CMS client.

## Publishing Workflow

1. **Draft** → Author creates/edits course content in CMS
2. **Review** → Content reviewer checks accuracy, formatting, quiz correctness
3. **Publish** → Content goes live, visible in course catalog
4. **Update** → Edit published content, changes reflect immediately (CMS CDN)

## Content Formatting

Lessons use Markdown with extended syntax:

- Standard Markdown (headers, lists, bold, italic, links)
- Fenced code blocks with language tags (```rust, ```typescript)
- Tables for comparison content
- Callout blocks using blockquotes (> ⚠️ Warning: ...)
- Embedded images and diagrams

## Sample Course

The repository includes 6 mock courses with real Solana/Web3 educational content in Portuguese:

1. **Introdução ao Solana** — PoH, wallets, SPL tokens, first transaction
2. **Smart Contracts com Anchor** — Setup, program anatomy, testing
3. **DeFi na Prática** — AMM implementation (x*y=k)
4. **Marketplace de NFTs** — Metaplex standards, listing, buying
5. **Frontend Web3** — wallet-adapter, transaction signing
6. **Tokenomics e Design** — Supply models, distribution curves

These serve as templates for creating new courses.
