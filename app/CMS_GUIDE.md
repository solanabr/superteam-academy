# CMS Guide -- Superteam Academy

This guide covers how content is structured, how to add or modify it in the current MVP, and how to migrate to a headless CMS when the project outgrows static data.

---

## Table of Contents

1. [Content Architecture Overview](#1-content-architecture-overview)
2. [Adding Content (Current Approach)](#2-adding-content-current-approach)
3. [Content Schema Reference](#3-content-schema-reference)
4. [Recommended CMS Integration (Sanity)](#4-recommended-cms-integration-sanity)
5. [Alternative CMS Options](#5-alternative-cms-options)
6. [Content Localization](#6-content-localization)

---

## 1. Content Architecture Overview

### Content Hierarchy

```
Course
  |-- slug, title, description, level, track, xp_reward, ...
  |-- Curriculum Item[] (lesson stubs with title, xp, duration, free flag)
  |-- objectives[], prerequisites[], reviews[]
  |
  +-- Lesson (full content)
  |     |-- id, title, course reference
  |     |-- content (markdown string)
  |     |-- starterCode (code playground)
  |     |-- type: implied by presence of starterCode vs. video URL
  |     |-- xp, duration, completed flag
  |
  +-- Challenge (coding exercise)
        |-- id, title, difficulty, xp
        |-- description (markdown)
        |-- starterCode, solution
        |-- testCases[], hints[], examples[]
```

### Where Data Lives Today

The MVP uses **inline mock data** declared as constants directly inside page components. There is no shared data layer or API -- each page owns its content.

| Content type | File | Variable |
|---|---|---|
| Course catalog (listing page) | `app/[locale]/courses/page.tsx` | `MOCK_COURSES` |
| Course detail (single page) | `app/[locale]/courses/[slug]/page.tsx` | `MOCK_COURSES` (Record by slug) |
| Course reviews | `app/[locale]/courses/[slug]/page.tsx` | `REVIEWS` |
| Shared course cards | `lib/mock-data.ts` | `MOCK_COURSES` (typed `Course[]`) |
| Lessons | `app/[locale]/lessons/[id]/page.tsx` | `LESSONS` |
| Challenges | `app/[locale]/challenges/[id]/page.tsx` | `CHALLENGES` |
| Dashboard enrolled courses | `app/[locale]/dashboard/page.tsx` | `ENROLLED_COURSES` |
| Achievements | `lib/gamification.ts` | `ACHIEVEMENTS` |
| Leaderboard data | `lib/mock-data.ts` | `MOCK_LEADERBOARD` |
| Certificates | `lib/mock-data.ts` | `MOCK_CERTIFICATES` |
| Certificate detail | `app/[locale]/certificates/[id]/page.tsx` | `CERT_DATA` |
| Profile data | `app/[locale]/profile/[address]/page.tsx` | `CREDENTIALS`, `ACHIEVEMENTS`, `COURSES_COMPLETED`, `SKILLS` |

There are **two separate** `MOCK_COURSES` arrays: one in the courses listing page (simpler shape) and one in `lib/mock-data.ts` (typed `Course` interface with localized titles). The course detail page has its own expanded Record with curriculum, objectives, and prerequisites. These need to be unified in any CMS migration.

### Localization of Content

The `Course` interface in `lib/mock-data.ts` already supports localized `title` and `description` with keys `pt-BR`, `en`, and `es`. The lesson and challenge data, however, is currently Portuguese-only and hardcoded. UI strings are handled separately by `next-intl` with JSON message files in `messages/`.

---

## 2. Adding Content (Current Approach)

### Adding a New Course

**Step 1: Add to the catalog listing page.**

Open `app/[locale]/courses/page.tsx` and add an entry to the `MOCK_COURSES` array:

```typescript
// app/[locale]/courses/page.tsx
const MOCK_COURSES = [
  // ... existing courses
  {
    slug: 'solana-pay',
    title: 'Solana Pay & Commerce',
    desc: 'Integre pagamentos Solana em aplicacoes web e POS fisicos.',
    level: 'Iniciante',       // 'Iniciante' | 'Intermediario' | 'Avancado'
    xp: 800,
    lessons: 6,
    hours: 3,
    track: 'Solana',
    color: 'from-indigo-600 to-purple-600',  // Tailwind gradient classes
    students: 389,
    rating: 4.8,
  },
];
```

**Step 2: Add to the shared typed data.**

Open `lib/mock-data.ts` and add a corresponding `Course` entry:

```typescript
// lib/mock-data.ts
{
  id: 'solana-pay',
  slug: 'solana-pay',
  title: {
    'pt-BR': 'Solana Pay & Commerce',
    en: 'Solana Pay & Commerce',
    es: 'Solana Pay y Comercio',
  },
  description: {
    'pt-BR': 'Integre pagamentos Solana em aplicacoes web e POS.',
    en: 'Integrate Solana payments into web apps and POS systems.',
    es: 'Integra pagos de Solana en aplicaciones web y POS.',
  },
  level: 'beginner',
  track: 'solana',
  xp_reward: 800,
  lesson_count: 6,
  duration: '3h',
  thumbnail_color: 'from-indigo-600 to-purple-600',
  thumbnail_icon: '💳',
  enrollments: 389,
  tags: ['solana-pay', 'commerce', 'qr-codes'],
},
```

**Step 3: Add the course detail.**

Open `app/[locale]/courses/[slug]/page.tsx` and add a key to the `MOCK_COURSES` Record:

```typescript
// app/[locale]/courses/[slug]/page.tsx
'solana-pay': {
  slug: 'solana-pay',
  title: 'Solana Pay & Commerce',
  desc: 'Integre pagamentos Solana em aplicacoes web e POS fisicos. Checkout, QR codes e confirmacoes.',
  level: 'Iniciante',
  xp: 800,
  lessons: 6,
  hours: 3,
  track: 'Solana',
  color: 'from-indigo-600 to-purple-600',
  students: 389,
  rating: 4.8,
  objectives: [
    'Entender o protocolo Solana Pay',
    'Implementar checkout com QR codes',
    'Processar confirmacoes de pagamento',
  ],
  prerequisites: [
    'Conhecimento basico de JavaScript/TypeScript',
  ],
  curriculum: [
    { title: 'Introducao ao Solana Pay', xp: 100, duration: 25, free: true },
    { title: 'QR Codes e Deep Links', xp: 100, duration: 30, free: true },
    { title: 'Checkout no Browser', xp: 150, duration: 35, free: false },
    { title: 'POS Integration', xp: 150, duration: 40, free: false },
    { title: 'Confirmacoes e Webhooks', xp: 150, duration: 35, free: false },
    { title: 'Projeto: Mini Loja', xp: 150, duration: 45, free: false },
  ],
},
```

### Adding a New Lesson

Open `app/[locale]/lessons/[id]/page.tsx` and add an entry to the `LESSONS` array:

```typescript
{
  id: 'pay-1',
  title: 'Introducao ao Solana Pay',
  course: 'Solana Pay & Commerce',
  xp: 100,
  duration: 25,
  completed: false,
  content: `# Introducao ao Solana Pay

O Solana Pay e um protocolo aberto para pagamentos instantaneos...

## Como funciona

1. Comerciante gera um QR code com os dados da transacao
2. Cliente escaneia com a carteira Solana
3. Transacao e processada em ~400ms

\`\`\`typescript
import { createQR } from "@solana/pay";
const qr = createQR(url, 512, "transparent");
\`\`\`
`,
  starterCode: `import { Connection, PublicKey } from "@solana/web3.js";
import { createQR, encodeURL } from "@solana/pay";

// TODO: Gere uma URL de pagamento Solana Pay
const recipient = new PublicKey("...");

console.log("Solana Pay!");
`,
},
```

The lesson `id` must be unique across all lessons. It is used in the URL path (`/[locale]/aulas/[id]`).

### Adding a New Challenge

Open `app/[locale]/challenges/[id]/page.tsx` and add a key to the `CHALLENGES` Record:

```typescript
'create-payment': {
  id: 'create-payment',
  title: 'Criar Pagamento Solana Pay',
  difficulty: 'Iniciante',
  xp: 200,
  description: `## Criar Pagamento Solana Pay

Implemente a funcao \`createPayment\` que gera uma URL de pagamento Solana Pay.

### Requisitos
1. Aceitar recipient (PublicKey), amount (number), label (string)
2. Retornar a URL codificada
`,
  examples: [
    {
      input: 'recipient = pubkey, amount = 1.5, label = "Cafe"',
      output: 'solana:recipient?amount=1.5&label=Cafe',
      explanation: 'URL no formato Solana Pay Transfer Request',
    },
  ],
  starterCode: `import { PublicKey } from "@solana/web3.js";
import { encodeURL } from "@solana/pay";
import { BigNumber } from "bignumber.js";

export function createPayment(
  recipient: PublicKey,
  amount: number,
  label: string
): URL {
  // TODO: Use encodeURL para gerar a URL
  return new URL("solana:");
}
`,
  hints: [
    'Use encodeURL({ recipient, amount: new BigNumber(amount), label }).',
    'O retorno de encodeURL ja e um objeto URL.',
  ],
  testCases: [
    { name: 'URL contem recipient', input: 'recipient = pubkey', expected: 'URL contains pubkey string' },
    { name: 'Amount correto', input: 'amount = 1.5', expected: 'URL contains amount=1.5' },
    { name: 'Label codificado', input: 'label = "Cafe"', expected: 'URL contains label=Cafe' },
  ],
  solution: `export function createPayment(
  recipient: PublicKey,
  amount: number,
  label: string
): URL {
  return encodeURL({
    recipient,
    amount: new BigNumber(amount),
    label,
  });
}`,
},
```

### Important Notes

- The course listing page, course detail page, and `lib/mock-data.ts` all have their own copies of course data. When adding a course, update all three.
- Lessons and challenges are keyed by `id`. Make sure IDs do not collide.
- The `content` field in lessons uses markdown, but it is rendered by a simple line-by-line parser (not a full markdown library). Only `#`, `##`, `- `, `**bold**`, and triple-backtick code blocks are supported.
- Challenges have a mock test runner. The `testCases` array is displayed in the UI but tests are simulated, not actually executed against user code.

---

## 3. Content Schema Reference

### Course

```typescript
// lib/mock-data.ts -- shared typed version
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseTrack = 'solana' | 'defi' | 'nft' | 'web3' | 'anchor';

export interface CourseTitle {
  'pt-BR': string;
  en: string;
  es: string;
}

export interface Course {
  id: string;              // Unique identifier (e.g., 'solana-101')
  slug: string;            // URL-safe slug, usually same as id
  title: CourseTitle;      // Localized title
  description: CourseTitle; // Localized description
  level: CourseLevel;      // Difficulty level
  track: CourseTrack;      // Content track/category
  xp_reward: number;       // Total XP for completing the course
  lesson_count: number;    // Number of lessons
  duration: string;        // Human-readable duration (e.g., '6h')
  thumbnail_color: string; // Tailwind gradient classes (e.g., 'from-purple-600 to-blue-600')
  thumbnail_icon: string;  // Emoji icon for card display
  enrollments: number;     // Number of enrolled students
  tags: string[];          // Searchable tags
}
```

### Course Detail (extended, in page component)

```typescript
interface CourseDetail extends Omit<Course, 'title' | 'description'> {
  title: string;           // Single-language title (PT-BR in current MVP)
  desc: string;            // Single-language description
  hours: number;           // Duration in hours
  color: string;           // Gradient classes for header
  students: number;        // Enrollment count
  rating: number;          // Average rating (0-5)
  objectives: string[];    // Learning objectives
  prerequisites: string[]; // Required prior knowledge
  curriculum: CurriculumItem[];
}

interface CurriculumItem {
  title: string;           // Lesson title
  xp: number;             // XP reward for this lesson
  duration: number;        // Duration in minutes
  free: boolean;           // Whether the lesson is free/preview
}
```

### Lesson

```typescript
interface Lesson {
  id: string;              // Unique identifier (e.g., 'intro-1')
  title: string;           // Lesson title
  course: string;          // Parent course name (display only)
  xp: number;             // XP reward (10-200 range)
  duration: number;        // Duration in minutes
  completed: boolean;      // Completion state (mock, will be on-chain)
  content: string;         // Markdown content (simplified parser)
  starterCode: string;     // Code for the interactive playground
}
```

### Challenge

```typescript
interface Challenge {
  id: string;              // Unique identifier (e.g., 'transfer-sol')
  title: string;           // Challenge title
  difficulty: string;      // 'Iniciante' | 'Intermediario' | 'Avancado'
  xp: number;             // XP reward (25-500 range)
  description: string;     // Markdown description with requirements
  examples: Example[];     // Input/output examples
  starterCode: string;     // Boilerplate code for the editor
  hints: string[];         // Progressive hints (revealed one at a time)
  testCases: TestCase[];   // Test case definitions
  solution: string;        // Reference solution code
}

interface Example {
  input: string;           // Description of input
  output: string;          // Expected output
  explanation: string;     // Why the output is correct
}

interface TestCase {
  name: string;            // Human-readable test name
  input: string;           // Test input description
  expected: string;        // Expected result description
}
```

### Achievement

```typescript
// lib/gamification.ts
interface Achievement {
  id: string;              // Unique identifier (e.g., 'first_lesson')
  name: string;            // Display name
  description: string;     // How to unlock
  xp: number;             // Bonus XP when unlocked
  icon: string;            // Emoji icon
}
```

### Certificate / Credential

```typescript
// lib/mock-data.ts
interface MockCertificate {
  id: string;              // Internal ID (e.g., 'cert-001')
  courseId: string;         // Reference to course ID
  courseName: CourseTitle;  // Localized course name
  issuedDate: string;       // ISO date string
  credentialId: string;     // On-chain credential identifier
  txSignature: string;      // Solana transaction signature
  skills: string[];         // Skills validated by this certificate
}
```

### XP Configuration

```typescript
// lib/gamification.ts
const XP_CONFIG = {
  lesson: { min: 10, max: 50 },
  challenge: { min: 25, max: 100 },
  courseCompletion: { min: 500, max: 2000 },
  streak: { multiplier7: 1.25, multiplier30: 1.5, multiplier100: 2.0 },
};
```

Level calculation: `level = floor(sqrt(totalXP / 100))`.

---

## 4. Recommended CMS Integration (Sanity)

### Why Sanity

- **Real-time preview**: Sanity Studio provides live preview of content changes before publishing. Content editors can see exactly how a lesson or challenge will render.
- **Structured content**: GROQ queries return typed JSON that maps directly to the TypeScript interfaces above. No transformation layer needed.
- **Portable Text**: Rich text format that can embed code blocks, images, and custom components -- ideal for lesson content that mixes markdown, code, and interactive elements.
- **Solana-friendly**: No vendor lock-in on content storage. Content can be exported to Arweave for immutable on-chain references (matches the project's architecture that uses Arweave for course content storage).
- **Free tier**: Generous free plan (200K API CDN requests/month, 500K API requests/month, 20GB bandwidth) suitable for an education platform.
- **i18n support**: First-class document-level and field-level internationalization.

### Schema Definitions

Create a `sanity/` directory at the project root (sibling to `app/`):

```
sanity/
  sanity.config.ts
  sanity.cli.ts
  schemas/
    course.ts
    lesson.ts
    challenge.ts
    achievement.ts
    track.ts
```

#### `sanity/schemas/track.ts`

```typescript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'track',
  title: 'Track',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'color',
      title: 'Gradient Color Classes',
      type: 'string',
      description: 'Tailwind gradient classes, e.g. "from-purple-600 to-blue-600"',
    }),
    defineField({
      name: 'icon',
      title: 'Icon Emoji',
      type: 'string',
    }),
  ],
});
```

#### `sanity/schemas/course.ts`

```typescript
import { defineType, defineField, defineArrayMember } from 'sanity';

export default defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: [
        { name: 'ptBR', title: 'Portugues (BR)', type: 'string' },
        { name: 'en', title: 'English', type: 'string' },
        { name: 'es', title: 'Espanol', type: 'string' },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.en' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'object',
      fields: [
        { name: 'ptBR', title: 'Portugues (BR)', type: 'text', rows: 3 },
        { name: 'en', title: 'English', type: 'text', rows: 3 },
        { name: 'es', title: 'Espanol', type: 'text', rows: 3 },
      ],
    }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'track',
      title: 'Track',
      type: 'reference',
      to: [{ type: 'track' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'xpReward',
      title: 'Total XP Reward',
      type: 'number',
      validation: (Rule) => Rule.required().min(0).max(10000),
    }),
    defineField({
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'Human-readable, e.g. "6h" or "12h"',
    }),
    defineField({
      name: 'thumbnailColor',
      title: 'Thumbnail Gradient',
      type: 'string',
      description: 'Tailwind classes, e.g. "from-purple-600 to-blue-600"',
    }),
    defineField({
      name: 'thumbnailIcon',
      title: 'Thumbnail Icon',
      type: 'string',
      description: 'Emoji for the course card',
    }),
    defineField({
      name: 'objectives',
      title: 'Learning Objectives',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'lesson' }] })],
    }),
  ],
  preview: {
    select: { title: 'title.en', subtitle: 'level' },
  },
});
```

#### `sanity/schemas/lesson.ts`

```typescript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: [
        { name: 'ptBR', title: 'Portugues (BR)', type: 'string' },
        { name: 'en', title: 'English', type: 'string' },
        { name: 'es', title: 'Espanol', type: 'string' },
      ],
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.en' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'object',
      description: 'Lesson body in each language. Supports Portable Text or raw markdown.',
      fields: [
        { name: 'ptBR', title: 'Portugues (BR)', type: 'array', of: [{ type: 'block' }] },
        { name: 'en', title: 'English', type: 'array', of: [{ type: 'block' }] },
        { name: 'es', title: 'Espanol', type: 'array', of: [{ type: 'block' }] },
      ],
    }),
    defineField({
      name: 'type',
      title: 'Lesson Type',
      type: 'string',
      options: {
        list: [
          { title: 'Text', value: 'text' },
          { title: 'Video', value: 'video' },
          { title: 'Interactive', value: 'interactive' },
        ],
      },
      initialValue: 'text',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      hidden: ({ document }) => document?.type !== 'video',
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(180),
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      validation: (Rule) => Rule.required().min(10).max(500),
    }),
    defineField({
      name: 'free',
      title: 'Free Preview',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'starterCode',
      title: 'Starter Code',
      type: 'text',
      description: 'Code template for the interactive playground',
      rows: 15,
    }),
    defineField({
      name: 'codeLanguage',
      title: 'Code Language',
      type: 'string',
      options: {
        list: ['typescript', 'rust', 'javascript'],
      },
      initialValue: 'typescript',
    }),
  ],
  preview: {
    select: { title: 'title.en', subtitle: 'type' },
  },
});
```

#### `sanity/schemas/challenge.ts`

```typescript
import { defineType, defineField, defineArrayMember } from 'sanity';

export default defineType({
  name: 'challenge',
  title: 'Challenge',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: [
        { name: 'ptBR', title: 'Portugues (BR)', type: 'string' },
        { name: 'en', title: 'English', type: 'string' },
        { name: 'es', title: 'Espanol', type: 'string' },
      ],
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.en' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
      },
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      validation: (Rule) => Rule.required().min(25).max(1000),
    }),
    defineField({
      name: 'description',
      title: 'Description (Markdown)',
      type: 'object',
      fields: [
        { name: 'ptBR', title: 'Portugues (BR)', type: 'text', rows: 10 },
        { name: 'en', title: 'English', type: 'text', rows: 10 },
        { name: 'es', title: 'Espanol', type: 'text', rows: 10 },
      ],
    }),
    defineField({
      name: 'starterCode',
      title: 'Starter Code',
      type: 'text',
      rows: 20,
    }),
    defineField({
      name: 'solution',
      title: 'Reference Solution',
      type: 'text',
      rows: 20,
    }),
    defineField({
      name: 'hints',
      title: 'Hints',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'testCases',
      title: 'Test Cases',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'name', title: 'Name', type: 'string' },
            { name: 'input', title: 'Input', type: 'string' },
            { name: 'expected', title: 'Expected Output', type: 'string' },
          ],
        }),
      ],
    }),
    defineField({
      name: 'examples',
      title: 'Examples',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'input', title: 'Input', type: 'string' },
            { name: 'output', title: 'Output', type: 'string' },
            { name: 'explanation', title: 'Explanation', type: 'string' },
          ],
        }),
      ],
    }),
    defineField({
      name: 'parentLesson',
      title: 'Parent Lesson',
      type: 'reference',
      to: [{ type: 'lesson' }],
    }),
  ],
  preview: {
    select: { title: 'title.en', subtitle: 'difficulty' },
  },
});
```

#### `sanity/schemas/achievement.ts`

```typescript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'achievement',
  title: 'Achievement',
  type: 'document',
  fields: [
    defineField({
      name: 'achievementId',
      title: 'Achievement ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'object',
      fields: [
        { name: 'ptBR', title: 'Portugues (BR)', type: 'string' },
        { name: 'en', title: 'English', type: 'string' },
        { name: 'es', title: 'Espanol', type: 'string' },
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'object',
      fields: [
        { name: 'ptBR', title: 'Portugues (BR)', type: 'string' },
        { name: 'en', title: 'English', type: 'string' },
        { name: 'es', title: 'Espanol', type: 'string' },
      ],
    }),
    defineField({
      name: 'xp',
      title: 'XP Bonus',
      type: 'number',
    }),
    defineField({
      name: 'icon',
      title: 'Icon Emoji',
      type: 'string',
    }),
  ],
});
```

### Sanity Configuration

#### `sanity/sanity.config.ts`

```typescript
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

import course from './schemas/course';
import lesson from './schemas/lesson';
import challenge from './schemas/challenge';
import achievement from './schemas/achievement';
import track from './schemas/track';

export default defineConfig({
  name: 'superteam-academy',
  title: 'Superteam Academy CMS',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [course, lesson, challenge, achievement, track],
  },
});
```

#### `sanity/sanity.cli.ts`

```typescript
import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  },
});
```

### Environment Variables

Add to `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_read_token
```

### Sanity Client Setup

Create `lib/sanity.ts`:

```typescript
import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  useCdn: true,  // Enable CDN for read-heavy operations
  token: process.env.SANITY_API_TOKEN, // Only needed for draft content
});
```

### Querying Content with GROQ

#### Fetch all courses for the catalog page

```groq
*[_type == "course"] | order(xpReward desc) {
  _id,
  "slug": slug.current,
  title,
  description,
  level,
  xpReward,
  duration,
  thumbnailColor,
  thumbnailIcon,
  tags,
  "track": track->{ name, "slug": slug.current, color },
  "lessonCount": count(lessons),
}
```

#### Fetch a single course with its lessons

```groq
*[_type == "course" && slug.current == $slug][0] {
  _id,
  "slug": slug.current,
  title,
  description,
  level,
  xpReward,
  duration,
  thumbnailColor,
  objectives,
  prerequisites,
  "track": track->{ name, "slug": slug.current },
  lessons[]-> {
    _id,
    "slug": slug.current,
    title,
    type,
    duration,
    xpReward,
    free,
  }
}
```

#### Fetch a single lesson

```groq
*[_type == "lesson" && slug.current == $slug][0] {
  _id,
  "slug": slug.current,
  title,
  content,
  type,
  videoUrl,
  duration,
  xpReward,
  starterCode,
  codeLanguage,
}
```

#### Fetch a challenge

```groq
*[_type == "challenge" && slug.current == $slug][0] {
  _id,
  "slug": slug.current,
  title,
  difficulty,
  xpReward,
  description,
  starterCode,
  solution,
  hints,
  testCases,
  examples,
}
```

### Using Queries in Next.js Pages

Replace static data with fetched data in server components:

```typescript
// app/[locale]/courses/[slug]/page.tsx
import { sanityClient } from '@/lib/sanity';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { locale, slug } = await params;

  const course = await sanityClient.fetch(
    `*[_type == "course" && slug.current == $slug][0] {
      "slug": slug.current,
      title,
      description,
      level,
      xpReward,
      objectives,
      prerequisites,
      "track": track->name,
      thumbnailColor,
      lessons[]-> {
        _id,
        "slug": slug.current,
        title,
        duration,
        xpReward,
        free,
      }
    }`,
    { slug }
  );

  if (!course) return notFound();

  // Use locale to pick the right title/description
  const title = course.title[locale] ?? course.title['pt-BR'];
  const description = course.description[locale] ?? course.description['pt-BR'];

  // ... render
}
```

### Migration Path from Static Data to CMS

The migration can be done incrementally, one content type at a time:

**Phase 1 -- Extract data to shared files (no CMS yet)**

1. Create `lib/data/courses.ts`, `lib/data/lessons.ts`, `lib/data/challenges.ts`.
2. Move all inline `MOCK_*` constants into these files.
3. Create fetch functions: `getCourses()`, `getCourseBySlug(slug)`, `getLessonById(id)`, `getChallengeById(id)`.
4. Update all page components to import from these functions instead of using inline data.
5. This step unifies the duplicate `MOCK_COURSES` arrays into a single source of truth.

**Phase 2 -- Set up Sanity**

1. Run `npm create sanity@latest` in the `sanity/` directory.
2. Add the schemas from above.
3. Use the Sanity Studio to manually enter the existing mock data, or write a migration script:

```typescript
// scripts/migrate-to-sanity.ts
import { sanityClient } from '../lib/sanity';
import { MOCK_COURSES } from '../lib/data/courses';

async function migrate() {
  for (const course of MOCK_COURSES) {
    await sanityClient.create({
      _type: 'course',
      title: { ptBR: course.title['pt-BR'], en: course.title.en, es: course.title.es },
      slug: { current: course.slug },
      description: { ptBR: course.description['pt-BR'], en: course.description.en, es: course.description.es },
      level: course.level,
      xpReward: course.xp_reward,
      duration: course.duration,
      thumbnailColor: course.thumbnail_color,
      thumbnailIcon: course.thumbnail_icon,
      tags: course.tags,
    });
  }
}

migrate().then(() => console.log('Migration complete'));
```

**Phase 3 -- Switch fetch functions to Sanity**

Replace the static returns in `getCourses()`, etc. with GROQ queries. The page components do not need to change because they already use the fetch functions from Phase 1.

**Phase 4 -- Add preview mode**

Set up Sanity's `next-sanity` integration for draft preview:

```typescript
// app/api/draft/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');

  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 });
  }

  (await draftMode()).enable();
  redirect(slug ?? '/');
}
```

---

## 5. Alternative CMS Options

### Strapi (Self-Hosted)

**Pros:**
- Open source, self-hosted -- full control over data.
- Excellent REST and GraphQL APIs out of the box.
- Good i18n plugin with field-level translations (suitable for pt-BR/en/es).
- Admin panel available in Portuguese.
- Can be deployed alongside the app on the same server.

**Cons:**
- Requires hosting and maintenance (database, backups, updates).
- Heavier infrastructure than Sanity (needs PostgreSQL or MySQL).
- No real-time preview without custom implementation.

**When to choose:** If the team wants full data sovereignty, already has server infrastructure, or needs to run the CMS in a specific geographic region (e.g., Brazil for latency).

**Setup:**

```bash
npx create-strapi-app@latest sanity-cms --quickstart
# Configure content types to match the schemas in Section 3
# Enable the i18n plugin in the admin panel
```

### Contentful

**Pros:**
- Enterprise-grade, highly reliable CDN.
- Rich content modeling with localization built in.
- Good TypeScript SDK.
- Webhooks for triggering rebuilds on content change.

**Cons:**
- Expensive at scale (free tier limited to 5 users and 25K records).
- Vendor lock-in -- content export is possible but non-trivial.
- GROQ-like query language not available (REST/GraphQL only).

**When to choose:** If the project grows to have a dedicated content team with enterprise requirements, or if integrating with other enterprise tools.

### MDX Files (Simplest, Git-Based)

**Pros:**
- Zero infrastructure cost -- content lives in the repository.
- Version-controlled with full git history.
- Developers and technical writers can contribute via pull requests.
- Works seamlessly with Next.js via `@next/mdx` or `contentlayer`.
- Supports JSX components embedded in markdown (interactive code examples).

**Cons:**
- No admin UI for non-technical content editors.
- No real-time preview (requires deploy or local dev server).
- Content and code are coupled in the same repository.
- Search and filtering require custom implementation.

**When to choose:** If the team is all developers, content changes are infrequent, or you want the simplest possible setup with no external dependencies.

**Setup:**

```
content/
  courses/
    solana-101/
      index.mdx           # Course metadata as frontmatter
      lessons/
        01-what-is-solana.mdx
        02-accounts-lamports.mdx
      challenges/
        transfer-sol.mdx
    anchor-framework/
      index.mdx
      lessons/
        ...
```

Each MDX file uses frontmatter for structured data:

```mdx
---
title:
  pt-BR: "Solana 101: Fundamentos"
  en: "Solana 101: Fundamentals"
  es: "Solana 101: Fundamentos"
level: beginner
track: solana
xp_reward: 500
duration: "6h"
tags: [solana, blockchain, web3]
---

# O que e Solana?

Solana e uma blockchain de alta performance...
```

Install `contentlayer` or use Next.js built-in MDX support:

```bash
npm install @next/mdx @mdx-js/react gray-matter
```

### Comparison Summary

| Feature | Sanity | Strapi | Contentful | MDX Files |
|---|---|---|---|---|
| Setup effort | Low | Medium | Low | Very Low |
| Hosting cost | Free tier | Self-host | Free tier (limited) | None |
| Admin UI | Built-in Studio | Built-in Admin | Built-in Web App | None (git) |
| i18n support | Field-level | Plugin | Built-in | Frontmatter |
| Preview | Real-time | Custom | Webhooks | Local dev |
| Non-dev friendly | Yes | Yes | Yes | No |
| Solana ecosystem fit | Best | Good | Good | Good |

---

## 6. Content Localization

### Current i18n Architecture

The app uses `next-intl` with three locales defined in `i18n/routing.ts`:

```typescript
locales: ['pt-BR', 'en', 'es'],
defaultLocale: 'pt-BR',
```

**UI strings** (navigation, buttons, labels) are stored in JSON files:

```
messages/
  pt-BR.json
  en.json
  es.json
```

These are loaded by `NextIntlClientProvider` in the locale layout and accessed via `useTranslations('namespace')`.

**Content strings** (course titles, descriptions) use a different pattern. The `Course` interface in `lib/mock-data.ts` stores translations directly in the data:

```typescript
title: {
  'pt-BR': 'Solana 101: Fundamentos',
  en: 'Solana 101: Fundamentals',
  es: 'Solana 101: Fundamentos',
},
```

Components pick the right locale at render time:

```typescript
const title = course.title[locale] ?? course.title['pt-BR'];
```

### Where Translations Live

| Content type | Translation location | Current state |
|---|---|---|
| Nav, buttons, labels | `messages/*.json` | Translated (pt-BR, en, es) |
| Course title + description | `lib/mock-data.ts` (CourseTitle object) | Translated |
| Course detail (objectives, prerequisites, curriculum) | `app/[locale]/courses/[slug]/page.tsx` | PT-BR only |
| Lesson content | `app/[locale]/lessons/[id]/page.tsx` | PT-BR only |
| Challenge descriptions, hints | `app/[locale]/challenges/[id]/page.tsx` | PT-BR only |
| Achievements | `lib/gamification.ts` | PT-BR only |
| Certificate data | `app/[locale]/certificates/[id]/page.tsx` | PT-BR only |

### Approach A: Store Translated Content in CMS

This is the recommended approach for Sanity, Strapi, or Contentful.

Each content field that needs translation is an object with locale keys:

```typescript
// In Sanity schema
defineField({
  name: 'title',
  type: 'object',
  fields: [
    { name: 'ptBR', type: 'string' },
    { name: 'en', type: 'string' },
    { name: 'es', type: 'string' },
  ],
}),
```

In GROQ queries, you can project the locale dynamically:

```groq
// Fetch with specific locale
*[_type == "course"] {
  "title": title[$locale],
  "description": description[$locale],
  // fallback to pt-BR if translation missing
  "titleFallback": coalesce(title[$locale], title.ptBR),
}
```

**Advantages:**
- Content editors manage all translations in one place.
- No code changes needed when adding a new language.
- Translations are versioned and publishable independently.

**Disadvantages:**
- Content editors need to maintain N versions of each piece of content.
- Long-form content (lesson body, challenge descriptions) is expensive to translate.

### Approach B: Store Content in Code (MDX)

For the MDX-based approach, create separate files per locale:

```
content/
  courses/
    solana-101/
      lessons/
        01-what-is-solana.pt-BR.mdx
        01-what-is-solana.en.mdx
        01-what-is-solana.es.mdx
```

Or use a single MDX file with locale-keyed frontmatter and let the build system extract the right language.

### Approach C: Hybrid (Recommended for Current Stage)

1. **UI strings**: Keep in `messages/*.json` via `next-intl`. This is already working.
2. **Short content** (course titles, descriptions, achievement names): Store as locale-keyed objects in the CMS or in the shared data files. This is already the pattern used by `CourseTitle`.
3. **Long content** (lesson markdown, challenge descriptions): Initially keep in PT-BR only. Add translations as the platform grows, either by:
   - Adding locale-keyed fields to the CMS schemas.
   - Using a translation service API (e.g., DeepL) to auto-generate initial translations, then having editors refine them.

### Adding a New Language

1. Add the locale to `i18n/routing.ts`:

```typescript
locales: ['pt-BR', 'en', 'es', 'fr'],
```

2. Create `messages/fr.json` with all translated UI strings.

3. For CMS content, add a `fr` field to each localized object in the schema.

4. Update the `CourseTitle` type:

```typescript
interface CourseTitle {
  'pt-BR': string;
  en: string;
  es: string;
  fr?: string;  // Optional until all content is translated
}
```

5. The fallback chain in components already handles missing translations:

```typescript
const title = course.title[locale] ?? course.title['pt-BR'];
```

This means you can add a language incrementally without breaking anything -- untranslated content falls back to Portuguese.
