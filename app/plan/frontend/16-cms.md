# CMS Integration

## Overview

The CMS Integration manages course content, modules, and lessons using **Sanity** as the headless CMS. It supports:
- Visual content editor with markdown and code blocks
- Media management (images with hotspot cropping)
- Draft/publish workflow with live preview via Next.js `draftMode()`
- Course metadata (difficulty, duration, XP, track association)
- On-chain course ID mapping for linking CMS content to Solana program state
- A reusable mock course seed script for testing

## Content Structure

```
Course
├── onChainCourseId  ← maps to Solana Course PDA seed
├── Module 1
│   ├── Lesson 1 (Content — markdown + code blocks)
│   ├── Lesson 2 (Challenge — starter code + test cases)
│   └── Lesson 3 (Video — embedded URL)
├── Module 2
│   ├── Lesson 4 (Content)
│   └── Lesson 5 (Challenge)
└── Module 3
    └── Lesson 6 (Challenge)
```

---

## Sanity Schema

### 1. Course Schema

```typescript
// sanity/schemas/course.ts
import { defineType, defineField } from 'sanity';

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'onChainCourseId',
      title: 'On-Chain Course ID',
      type: 'string',
      description: 'Must match the course_id used in the Solana Course PDA seed. Example: "solana-basics"',
      validation: (Rule) => Rule.required().max(32),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'reference',
      to: [{ type: 'instructor' }],
    }),
    defineField({
      name: 'track',
      title: 'Track',
      type: 'reference',
      to: [{ type: 'track' }],
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty',
      type: 'string',
      options: {
        list: [
          { title: 'Easy', value: 'easy' },
          { title: 'Medium', value: 'medium' },
          { title: 'Hard', value: 'hard' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'xpPerLesson',
      title: 'XP Per Lesson',
      type: 'number',
      initialValue: 25,
      validation: (Rule) => Rule.required().min(10).max(100),
    }),
    defineField({
      name: 'estimatedDuration',
      title: 'Estimated Duration (minutes)',
      type: 'number',
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'module' }] }],
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'course' }] }],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'difficulty',
      media: 'thumbnail',
      isPublished: 'isPublished',
    },
    prepare({ title, subtitle, media, isPublished }) {
      return {
        title: `${isPublished ? '' : '📝 '}${title}`,
        subtitle: subtitle ? `${subtitle.charAt(0).toUpperCase()}${subtitle.slice(1)}` : '',
        media,
      };
    },
  },
});
```

### 2. Module Schema

```typescript
// sanity/schemas/module.ts
import { defineType, defineField } from 'sanity';

export const module = defineType({
  name: 'module',
  title: 'Module',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'lesson' }] }],
    }),
  ],
  orderings: [
    { title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', order: 'order' },
    prepare({ title, order }) {
      return { title: `Module ${order}: ${title}` };
    },
  },
});
```

### 3. Lesson Schema

```typescript
// sanity/schemas/lesson.ts
import { defineType, defineField } from 'sanity';

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Content', value: 'content' },
          { title: 'Challenge', value: 'challenge' },
          { title: 'Video', value: 'video' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      initialValue: 10,
    }),

    // --- Content lesson fields ---
    defineField({
      name: 'content',
      title: 'Content (Markdown)',
      type: 'markdown',
      hidden: ({ document }) => document?.type !== 'content',
    }),

    // --- Video lesson fields ---
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      hidden: ({ document }) => document?.type !== 'video',
    }),

    // --- Challenge lesson fields ---
    defineField({
      name: 'challenge',
      title: 'Challenge',
      type: 'object',
      hidden: ({ document }) => document?.type !== 'challenge',
      fields: [
        defineField({
          name: 'language',
          title: 'Language',
          type: 'string',
          options: {
            list: [
              { title: 'Rust', value: 'rust' },
              { title: 'TypeScript', value: 'typescript' },
              { title: 'JSON', value: 'json' },
            ],
          },
        }),
        defineField({
          name: 'instructions',
          title: 'Challenge Instructions (Markdown)',
          type: 'markdown',
        }),
        defineField({
          name: 'starterCode',
          title: 'Starter Code',
          type: 'code',
          options: { language: 'rust', withFilename: false },
        }),
        defineField({
          name: 'solutionCode',
          title: 'Solution Code',
          type: 'code',
          options: { language: 'rust', withFilename: false },
        }),
        defineField({
          name: 'testCases',
          title: 'Test Cases',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'name', type: 'string', title: 'Test Name' }),
                defineField({ name: 'input', type: 'text', title: 'Input' }),
                defineField({ name: 'expectedOutput', type: 'text', title: 'Expected Output' }),
                defineField({ name: 'isHidden', type: 'boolean', title: 'Hidden from student', initialValue: false }),
              ],
            },
          ],
        }),
      ],
    }),

    // --- Quiz (for any lesson type) ---
    defineField({
      name: 'quiz',
      title: 'Quiz',
      description: 'Optional end-of-lesson quiz',
      type: 'object',
      fields: [
        defineField({
          name: 'passThreshold',
          title: 'Pass Threshold (%)',
          type: 'number',
          initialValue: 70,
          validation: (Rule) => Rule.min(1).max(100),
        }),
        defineField({
          name: 'questions',
          title: 'Questions',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({ name: 'question', type: 'text', title: 'Question', validation: (Rule) => Rule.required() }),
                defineField({
                  name: 'options',
                  type: 'array',
                  title: 'Options',
                  of: [{ type: 'string' }],
                  validation: (Rule) => Rule.min(2).max(6),
                }),
                defineField({
                  name: 'correctIndex',
                  type: 'number',
                  title: 'Correct Option Index (0-based)',
                  validation: (Rule) => Rule.min(0),
                }),
              ],
            },
          ],
        }),
      ],
    }),

    // --- Hints & Solution (for content/challenge) ---
    defineField({
      name: 'hints',
      title: 'Hints',
      type: 'array',
      of: [{ type: 'text' }],
    }),
    defineField({
      name: 'xpReward',
      title: 'XP Reward',
      type: 'number',
      initialValue: 25,
    }),
  ],
  orderings: [
    { title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', type: 'type', order: 'order' },
    prepare({ title, type, order }) {
      const icon = type === 'content' ? '📄' : type === 'challenge' ? '💻' : '🎥';
      return { title: `${icon} ${order}. ${title}` };
    },
  },
});
```

### 4. Track Schema

```typescript
// sanity/schemas/track.ts
import { defineType, defineField } from 'sanity';

export const track = defineType({
  name: 'track',
  title: 'Learning Track',
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
    }),
    defineField({
      name: 'onChainTrackId',
      title: 'On-Chain Track ID',
      type: 'number',
      description: 'Numeric ID matching lib/course/tracks.ts TRACKS array',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Emoji or icon name',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'Hex color for this track',
    }),
    defineField({
      name: 'collectionAddress',
      title: 'Collection Address',
      type: 'string',
      description: 'Metaplex Core collection address for credentials',
    }),
  ],
});
```

### 5. Instructor Schema

```typescript
// sanity/schemas/instructor.ts
import { defineType, defineField } from 'sanity';

export const instructor = defineType({
  name: 'instructor',
  title: 'Instructor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'walletAddress',
      title: 'Wallet Address',
      type: 'string',
      description: 'Solana wallet for creator rewards',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        defineField({ name: 'twitter', type: 'url', title: 'Twitter/X' }),
        defineField({ name: 'github', type: 'url', title: 'GitHub' }),
        defineField({ name: 'linkedin', type: 'url', title: 'LinkedIn' }),
      ],
    }),
  ],
});
```

### 6. Schema Index

```typescript
// sanity/schemas/index.ts
export { course } from './course';
export { module } from './module';
export { lesson } from './lesson';
export { track } from './track';
export { instructor } from './instructor';
```

---

## Sanity Studio Configuration

```typescript
// sanity.config.ts (project root)
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { markdownSchema } from 'sanity-plugin-markdown';
import { codeInput } from '@sanity/code-input';
import { course, module, lesson, track, instructor } from './sanity/schemas';

export default defineConfig({
  name: 'superteam-academy',
  title: 'Superteam Academy CMS',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [
    structureTool(),
    markdownSchema(),
    codeInput(),
  ],
  schema: {
    types: [course, module, lesson, track, instructor],
  },
});
```

---

## Sanity Client (with Preview Support)

```typescript
// lib/cms/sanity.ts
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = '2024-01-01';

/** Production client — uses CDN, only sees published documents */
export const client = createClient({
  projectId,
  dataset,
  useCdn: true,
  apiVersion,
});

/** Preview client — skips CDN, sees draft documents (requires token) */
export const previewClient = createClient({
  projectId,
  dataset,
  useCdn: false,
  apiVersion,
  token: process.env.SANITY_API_TOKEN,
  perspective: 'previewDrafts',
});

/** Returns the correct client based on draft mode */
export function getClient(preview = false) {
  return preview ? previewClient : client;
}

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export const cms = {
  async getCourses(preview = false) {
    const c = getClient(preview);
    const publishedFilter = preview ? '' : '&& isPublished == true';
    return c.fetch(`
      *[_type == "course" ${publishedFilter}] | order(publishedAt desc) {
        _id,
        title,
        slug,
        description,
        thumbnail,
        difficulty,
        xpPerLesson,
        estimatedDuration,
        onChainCourseId,
        isPublished,
        "instructor": instructor->{ name, avatar },
        "track": track->{ name, slug, color, onChainTrackId },
        "moduleCount": count(modules),
        "lessonCount": count(modules[]->lessons[])
      }
    `);
  },

  async getCourse(slug: string, preview = false) {
    const c = getClient(preview);
    return c.fetch(`
      *[_type == "course" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        description,
        thumbnail,
        difficulty,
        xpPerLesson,
        estimatedDuration,
        onChainCourseId,
        isPublished,
        "instructor": instructor->{ name, bio, avatar, walletAddress, socialLinks },
        "track": track->{ name, slug, color, collectionAddress, onChainTrackId },
        "prerequisites": prerequisites[]->{ title, slug },
        "modules": modules[]->{
          _id,
          title,
          description,
          order,
          "lessons": lessons[]->{
            _id,
            title,
            slug,
            type,
            order,
            duration,
            xpReward
          } | order(order asc)
        } | order(order asc),
        tags
      }
    `, { slug });
  },

  async getLesson(lessonSlug: string, preview = false) {
    const c = getClient(preview);
    return c.fetch(`
      *[_type == "lesson" && slug.current == $lessonSlug][0] {
        _id,
        title,
        slug,
        type,
        order,
        duration,
        content,
        videoUrl,
        challenge,
        quiz,
        hints,
        xpReward
      }
    `, { lessonSlug });
  },

  async getTracks(preview = false) {
    const c = getClient(preview);
    return c.fetch(`
      *[_type == "track"] | order(name asc) {
        _id,
        name,
        slug,
        description,
        icon,
        color,
        onChainTrackId,
        "courseCount": count(*[_type == "course" && track._ref == ^._id && isPublished == true])
      }
    `);
  },
};
```

---

## Draft/Publish Workflow

Sanity natively stores unpublished changes as draft documents (prefixed `drafts.`). The workflow integrates with Next.js App Router `draftMode()`:

### Preview API Route (enable/disable draft mode)

```typescript
// app/api/preview/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const slug = request.nextUrl.searchParams.get('slug');
  const type = request.nextUrl.searchParams.get('type') || 'course';

  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response('Invalid secret', { status: 401 });
  }

  (await draftMode()).enable();

  const redirectPath = type === 'course' && slug
    ? `/courses/${slug}`
    : '/courses';

  redirect(redirectPath);
}
```

```typescript
// app/api/preview/disable/route.ts
import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  (await draftMode()).disable();
  return NextResponse.json({ preview: false });
}
```

### Draft Banner Component

```typescript
// components/cms/DraftBanner.tsx
'use client';

export function DraftBanner() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-yellow-400 text-black text-center py-2 text-sm font-medium">
      Draft Mode — You are viewing unpublished content.{' '}
      <a href="/api/preview/disable" className="underline font-bold">
        Exit Preview
      </a>
    </div>
  );
}
```

### Usage in Pages

```typescript
// app/[locale]/courses/page.tsx (example usage)
import { draftMode } from 'next/headers';
import { cms } from '@/lib/cms/sanity';
import { DraftBanner } from '@/components/cms/DraftBanner';

export default async function CoursesPage() {
  const { isEnabled: preview } = await draftMode();
  const courses = await cms.getCourses(preview);

  return (
    <>
      {preview && <DraftBanner />}
      {/* render courses */}
    </>
  );
}
```

### Sanity Studio → Preview Button

In the Sanity Studio desk structure, add a preview URL resolver:

```typescript
// sanity/deskStructure.ts
import { DefaultDocumentNodeResolver } from 'sanity/structure';
import { Iframe } from 'sanity-plugin-iframe-pane';

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, { schemaType }) => {
  if (schemaType === 'course') {
    return S.document().views([
      S.view.form(),
      S.view
        .component(Iframe)
        .options({
          url: (doc: { slug?: { current?: string } }) =>
            doc?.slug?.current
              ? `${process.env.SANITY_STUDIO_PREVIEW_URL}/api/preview?secret=${process.env.SANITY_STUDIO_PREVIEW_SECRET}&slug=${doc.slug.current}&type=course`
              : `${process.env.SANITY_STUDIO_PREVIEW_URL}/api/preview?secret=${process.env.SANITY_STUDIO_PREVIEW_SECRET}&type=course`,
          reload: { button: true },
        })
        .title('Preview'),
    ]);
  }
  return S.document().views([S.view.form()]);
};
```

---

## API Routes

```typescript
// app/api/courses/route.ts
import { NextResponse } from 'next/server';
import { draftMode } from 'next/headers';
import { cms } from '@/lib/cms/sanity';

export async function GET() {
  const { isEnabled: preview } = await draftMode();
  const courses = await cms.getCourses(preview);
  return NextResponse.json(courses);
}
```

```typescript
// app/api/courses/[slug]/route.ts
import { NextResponse } from 'next/server';
import { draftMode } from 'next/headers';
import { cms } from '@/lib/cms/sanity';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { isEnabled: preview } = await draftMode();
  const course = await cms.getCourse(slug, preview);

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  return NextResponse.json(course);
}
```

---

## Mock Course Seed Script (Reusable Template)

This script seeds a complete course with modules and lessons of all types (content, video, challenge with test cases, and quizzes). It serves as a **template** — duplicate and modify the data objects to create new test courses.

```typescript
// scripts/seed-mock-course.ts
/**
 * Seed a complete mock course into Sanity for testing.
 *
 * Usage:
 *   npx tsx scripts/seed-mock-course.ts
 *
 * Prereqs:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, and
 *   SANITY_API_TOKEN must be set in .env.local (token needs write access).
 *
 * This creates:
 *   1 Track, 1 Instructor, 6 Lessons, 2 Modules, 1 Course
 *   Total: 11 documents
 *
 * To add more courses, duplicate this file and modify the data constants below.
 */

import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN!,
});

// ─── DATA: Modify these to create different courses ───────────────────

const TRACK = {
  _type: 'track' as const,
  name: 'Anchor Developer',
  slug: { _type: 'slug' as const, current: 'anchor-developer' },
  onChainTrackId: 1,
  description: 'Build Solana programs with Anchor',
  icon: '⚓',
  color: '#9945FF',
};

const INSTRUCTOR = {
  _type: 'instructor' as const,
  name: 'Ana Solana',
  bio: 'Solana core contributor and educator. Building on-chain since 2021.',
  walletAddress: 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
  socialLinks: {
    twitter: 'https://twitter.com/example',
    github: 'https://github.com/example',
  },
};

const LESSONS = [
  // Module 1 — Lesson 1: Content (reading)
  {
    _type: 'lesson' as const,
    title: 'What is Solana?',
    slug: { _type: 'slug' as const, current: 'what-is-solana' },
    type: 'content',
    order: 1,
    duration: 15,
    xpReward: 25,
    content: `# What is Solana?\n\nSolana is a high-performance blockchain supporting thousands of transactions per second.\n\n## Key Features\n\n- **Proof of History** — cryptographic clock for ordering\n- **Tower BFT** — PoH-optimized consensus\n- **Gulf Stream** — mempool-less transaction forwarding\n- **Sealevel** — parallel smart contract runtime\n\n## Architecture\n\n\`\`\`\nValidator Node\n├── TPU (Transaction Processing Unit)\n├── TVU (Transaction Validation Unit)\n└── Blockstore\n\`\`\`\n\nSolana programs are stateless and written in Rust or C.`,
    quiz: {
      passThreshold: 70,
      questions: [
        {
          question: 'What consensus mechanism does Solana use alongside PoH?',
          options: ['Proof of Work', 'Tower BFT', 'Nakamoto Consensus', 'Tendermint'],
          correctIndex: 1,
        },
        {
          question: 'What language are Solana programs primarily written in?',
          options: ['JavaScript', 'Python', 'Rust', 'Go'],
          correctIndex: 2,
        },
      ],
    },
  },

  // Module 1 — Lesson 2: Video
  {
    _type: 'lesson' as const,
    title: 'Setting Up Your Dev Environment',
    slug: { _type: 'slug' as const, current: 'dev-environment-setup' },
    type: 'video',
    order: 2,
    duration: 20,
    xpReward: 25,
    videoUrl: 'https://www.youtube.com/watch?v=placeholder',
    hints: [
      'Make sure you have Rust 1.82+ installed',
      'Install Solana CLI with: sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"',
      'Install Anchor with: cargo install --git https://github.com/coral-xyz/anchor avm --force',
    ],
  },

  // Module 1 — Lesson 3: Challenge
  {
    _type: 'lesson' as const,
    title: 'Your First Anchor Program',
    slug: { _type: 'slug' as const, current: 'first-anchor-program' },
    type: 'challenge',
    order: 3,
    duration: 30,
    xpReward: 50,
    challenge: {
      language: 'rust',
      instructions: '# Your First Anchor Program\n\nCreate a simple counter program that initializes a counter account and increments it.\n\n## Requirements\n\n1. Define a `Counter` account with a `count: u64` field\n2. Implement `initialize` to set count to 0\n3. Implement `increment` to add 1 to count\n4. Use checked arithmetic',
      starterCode: {
        _type: 'code',
        language: 'rust',
        code: 'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod counter {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // TODO: Initialize the counter\n        Ok(())\n    }\n\n    pub fn increment(ctx: Context<Increment>) -> Result<()> {\n        // TODO: Increment the counter\n        Ok(())\n    }\n}\n\n// TODO: Define account structs',
      },
      solutionCode: {
        _type: 'code',
        language: 'rust',
        code: 'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod counter {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        let counter = &mut ctx.accounts.counter;\n        counter.count = 0;\n        counter.bump = ctx.bumps.counter;\n        Ok(())\n    }\n\n    pub fn increment(ctx: Context<Increment>) -> Result<()> {\n        let counter = &mut ctx.accounts.counter;\n        counter.count = counter.count.checked_add(1).ok_or(ErrorCode::Overflow)?;\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize<\'info> {\n    #[account(init, payer = payer, space = 8 + Counter::INIT_SPACE, seeds = [b"counter"], bump)]\n    pub counter: Account<\'info, Counter>,\n    #[account(mut)]\n    pub payer: Signer<\'info>,\n    pub system_program: Program<\'info, System>,\n}\n\n#[derive(Accounts)]\npub struct Increment<\'info> {\n    #[account(mut, seeds = [b"counter"], bump = counter.bump)]\n    pub counter: Account<\'info, Counter>,\n}\n\n#[account]\n#[derive(InitSpace)]\npub struct Counter {\n    pub count: u64,\n    pub bump: u8,\n}\n\n#[error_code]\npub enum ErrorCode {\n    #[msg("Arithmetic overflow")]\n    Overflow,\n}',
      },
      testCases: [
        { name: 'Counter initializes to 0', input: 'initialize()', expectedOutput: 'counter.count == 0', isHidden: false },
        { name: 'Increment adds 1', input: 'increment()', expectedOutput: 'counter.count == 1', isHidden: false },
        { name: 'Double increment', input: 'increment(); increment()', expectedOutput: 'counter.count == 2', isHidden: true },
      ],
    },
  },

  // Module 2 — Lesson 4: Content
  {
    _type: 'lesson' as const,
    title: 'Understanding PDAs',
    slug: { _type: 'slug' as const, current: 'understanding-pdas' },
    type: 'content',
    order: 4,
    duration: 20,
    xpReward: 25,
    content: '# Program Derived Addresses (PDAs)\n\nPDAs are deterministic addresses derived from a program ID and a set of seeds.\n\n## Why PDAs?\n\n- No private key — only the program can sign for them\n- Deterministic — same seeds always produce the same address\n- Used for all program-owned accounts in Anchor\n\n## How They Work\n\n```rust\nlet (pda, bump) = Pubkey::find_program_address(\n    &[b"seed", user.key().as_ref()],\n    &program_id,\n);\n```\n\nThe `bump` is the canonical bump — always store it to save ~1500 CU per access.',
    quiz: {
      passThreshold: 70,
      questions: [
        {
          question: 'Why should you store the PDA bump on-chain?',
          options: ['For security', 'Saves ~1500 CU per access', 'Required by Anchor', 'It cannot be recalculated'],
          correctIndex: 1,
        },
      ],
    },
  },

  // Module 2 — Lesson 5: Challenge
  {
    _type: 'lesson' as const,
    title: 'Build a Vault Program',
    slug: { _type: 'slug' as const, current: 'build-vault-program' },
    type: 'challenge',
    order: 5,
    duration: 45,
    xpReward: 75,
    challenge: {
      language: 'rust',
      instructions: '# Build a Vault Program\n\nCreate a vault that stores SOL for a user, using a PDA as the vault authority.\n\n## Requirements\n\n1. `initialize` — create vault PDA with authority and bump\n2. `deposit` — transfer SOL from user to vault\n3. `withdraw` — transfer SOL from vault to user (authority only)\n4. Store and reuse the canonical bump',
      starterCode: {
        _type: 'code',
        language: 'rust',
        code: 'use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod vault {\n    use super::*;\n\n    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {\n        // TODO\n        Ok(())\n    }\n\n    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {\n        // TODO\n        Ok(())\n    }\n\n    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        // TODO\n        Ok(())\n    }\n}\n\n// TODO: Define account structs',
      },
      solutionCode: {
        _type: 'code',
        language: 'rust',
        code: '// Full vault solution — see Anchor rules for patterns',
      },
      testCases: [
        { name: 'Vault initializes', input: 'initialize()', expectedOutput: 'vault.authority == user', isHidden: false },
        { name: 'Deposit 1 SOL', input: 'deposit(1_000_000_000)', expectedOutput: 'vault balance == 1 SOL', isHidden: false },
        { name: 'Withdraw 0.5 SOL', input: 'withdraw(500_000_000)', expectedOutput: 'vault balance == 0.5 SOL', isHidden: false },
        { name: 'Unauthorized withdraw fails', input: 'withdraw(1) with wrong signer', expectedOutput: 'Error: Unauthorized', isHidden: true },
      ],
    },
  },

  // Module 2 — Lesson 6: Video
  {
    _type: 'lesson' as const,
    title: 'Testing with LiteSVM',
    slug: { _type: 'slug' as const, current: 'testing-with-litesvm' },
    type: 'video',
    order: 6,
    duration: 25,
    xpReward: 25,
    videoUrl: 'https://www.youtube.com/watch?v=placeholder',
    quiz: {
      passThreshold: 70,
      questions: [
        {
          question: 'What is the advantage of LiteSVM over solana-test-validator?',
          options: ['It uses mainnet', 'Faster execution without a full validator', 'It supports more languages', 'Free RPC access'],
          correctIndex: 1,
        },
      ],
    },
  },
];

const MODULES = [
  {
    _type: 'module' as const,
    title: 'Solana Fundamentals',
    description: 'Learn the core concepts of the Solana blockchain and set up your development environment.',
    order: 1,
    // lessons 1-3 will be linked by ref
  },
  {
    _type: 'module' as const,
    title: 'Building with Anchor',
    description: 'Write, test, and deploy Solana programs using the Anchor framework.',
    order: 2,
    // lessons 4-6 will be linked by ref
  },
];

const COURSE = {
  _type: 'course' as const,
  title: 'Solana Basics',
  slug: { _type: 'slug' as const, current: 'solana-basics' },
  onChainCourseId: 'solana-basics',
  description: 'A comprehensive introduction to Solana blockchain development. Learn the fundamentals, set up your environment, and build your first Anchor programs.',
  difficulty: 'easy',
  xpPerLesson: 25,
  estimatedDuration: 155,
  isPublished: true,
  publishedAt: new Date().toISOString(),
  tags: ['solana', 'anchor', 'rust', 'beginner'],
};

// ─── SEEDING LOGIC (do not modify unless changing structure) ──────────

async function seed() {
  console.log('🌱 Seeding mock course into Sanity...\n');

  // 1. Create track
  const trackDoc = await client.create(TRACK);
  console.log(`  ✅ Track: ${trackDoc._id} (${TRACK.name})`);

  // 2. Create instructor
  const instructorDoc = await client.create(INSTRUCTOR);
  console.log(`  ✅ Instructor: ${instructorDoc._id} (${INSTRUCTOR.name})`);

  // 3. Create lessons
  const lessonDocs = [];
  for (const lesson of LESSONS) {
    const doc = await client.create(lesson);
    lessonDocs.push(doc);
    console.log(`  ✅ Lesson ${lesson.order}: ${doc._id} (${lesson.title})`);
  }

  // 4. Create modules with lesson references
  const moduleDocs = [];
  const lessonsPerModule = [
    lessonDocs.slice(0, 3),  // Module 1: lessons 1-3
    lessonDocs.slice(3, 6),  // Module 2: lessons 4-6
  ];
  for (let i = 0; i < MODULES.length; i++) {
    const mod = {
      ...MODULES[i],
      lessons: lessonsPerModule[i].map((l) => ({
        _type: 'reference' as const,
        _ref: l._id,
        _key: l._id,
      })),
    };
    const doc = await client.create(mod);
    moduleDocs.push(doc);
    console.log(`  ✅ Module ${mod.order}: ${doc._id} (${mod.title})`);
  }

  // 5. Create course with all references
  const courseData = {
    ...COURSE,
    instructor: { _type: 'reference' as const, _ref: instructorDoc._id },
    track: { _type: 'reference' as const, _ref: trackDoc._id },
    modules: moduleDocs.map((m) => ({
      _type: 'reference' as const,
      _ref: m._id,
      _key: m._id,
    })),
  };
  const courseDoc = await client.create(courseData);
  console.log(`  ✅ Course: ${courseDoc._id} (${COURSE.title})`);

  console.log('\n🎉 Seed complete! Created 11 documents.');
  console.log(`\n   Course slug: ${COURSE.slug.current}`);
  console.log(`   On-chain ID: ${COURSE.onChainCourseId}`);
  console.log(`   View at: https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.sanity.studio/desk/course;${courseDoc._id}`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
```

---

## Environment Variables

```env
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=sk-xxx                    # Write access for seed script + preview client
SANITY_PREVIEW_SECRET=a-random-secret-string  # Shared between Studio and Next.js

# Sanity Studio (if embedded or running separately)
SANITY_STUDIO_PREVIEW_URL=http://localhost:3000
SANITY_STUDIO_PREVIEW_SECRET=a-random-secret-string
```

---

## Dependencies

```
npm install @sanity/client @sanity/image-url sanity sanity-plugin-markdown @sanity/code-input sanity-plugin-iframe-pane
npm install -D dotenv
```

---

## Privacy Considerations

- Course content is public — no PII in Sanity documents
- Preview mode requires a secret token — never expose `SANITY_API_TOKEN` client-side
- Draft documents are only visible server-side via the preview client

---

## Migration Strategy — Arweave → Sanity

This section covers all changes needed to transition the content layer from Arweave to Sanity, cross-verified against every module plan and the actual codebase.

### Cross-Verification Summary

> [!CAUTION]
> **Previous claim was WRONG**: `lib/course/content.ts` and `lib/course/tracks.ts` were marked as "dead code." They are **actively imported and used** by 5 files.

**Live code dependencies** (verified via audit and grep):

```
hooks/useCourseDetails.ts:8
  └─ imports fetchCourseContent, contentTxIdToString from '@/lib/course/content'

components/course/CourseCard.tsx:10
  └─ imports getTrackName, getTrackColor from '@/lib/course/tracks'

components/course/CourseHeader.tsx:9
  └─ imports getTrackName, getTrackColor from '@/lib/course/tracks'

components/course/CourseSidebar.tsx:10
  └─ imports getTrackColor from '@/lib/course/tracks'

components/course/CourseFilters.tsx:7
  └─ imports TRACKS from '@/lib/course/tracks'
```

**Real code affected** (3 source files + 5 consuming files):

| File | Status | Consumers |
|------|--------|-----------|
| `lib/course/content.ts` | **LIVE** | `hooks/useCourseDetails.ts` |
| `lib/course/tracks.ts` | **LIVE** | `CourseCard`, `CourseHeader`, `CourseSidebar`, `CourseFilters` |
| `types/course.ts` | **LIVE** | Multiple — needs Sanity types added |


### Impact on On-Chain Program & SPEC

| Area | Affected? | Details |
|------|-----------|---------|
| On-chain program | ❌ No | `content_tx_id` is storage-only — no instruction logic reads or parses it |
| SPEC.md | ❌ No | Describes `content_tx_id` as a field, doesn't mandate Arweave |
| Credential metadata URIs | ❌ No | Passed as instruction params — still Arweave for immutable metadata |
| Backend 02-09 (services) | ❌ No | All work with on-chain data, not content |
| Frontend 04-06 (enrollment/XP/credential) | ❌ No | Work with on-chain data only |

### Affected Plan Files (10 files)

These plan files reference Arweave/contentTxId and define future code that should use Sanity instead:

| Plan File | What References Arweave | Action When Implementing |
|-----------|-------------------------|--------------------------|
| `frontend/03-course.md` | `useCourseDetails` fetches from `arweave.net/contentTxId`; `CourseWithDetails`; hardcoded `TRACKS[5]` | Build using `cms.getCourse()` / `cms.getLesson()` instead |
| `backend/02-lesson-validation.md` | `LessonValidationRequest.contentTxId`; "Content transaction exists on Arweave" validation rule | Replace content verification with Sanity slug-based lookup |
| `backend/03-course-management.md` | `contentTxId: string // Arweave content transaction`; `fetchCourseContent` from Arweave | Use `onChainCourseId` to map Sanity → on-chain; pass zero `contentTxId` |
| `frontend/07-editor.md` | `CodeEditor` reads `starterCode` / `testCases` (planned source: Arweave) | Read from Sanity `challenge.starterCode.code` / `challenge.testCases` |
| `backend/00-architecture.md` | `ARWEAVE_GATEWAY=https://arweave.net` env var | Remove or keep only for credential metadata |
| `backend/05-credential.md` | `metadataUri: string // Arweave JSON` | **No change** — credentials still use Arweave for immutable metadata |
| `backend/06-achievement.md` | `metadataUri: string // Arweave JSON` | **No change** — achievements still use Arweave for metadata |
| `plan/MASTER-PLAN.md` | "Storage: Arweave (content)" | Update to "Sanity CMS (content), Arweave (credential metadata)" |
| `plan/SUMMARY.md` | "Course content (Arweave)" and "Storage | Arweave" | Update both lines |
| `plan/DEPLOYMENT.md` | "Course Content | Arweave" in deployment checklist | Update to Sanity |

### Affected Documentation Files (2 files)

| Doc File | Line | Change |
|----------|------|--------|
| `docs/ARCHITECTURE.md` | 42 | "Arweave — course content, credential metadata JSON" → "Sanity — course content. Arweave — credential metadata JSON" |
| `docs/INTEGRATION.md` | 272 | Add note: Sanity-managed courses pass `contentTxId: Array(32).fill(0)` |
| `docs/INTEGRATION.md` | 643 | Add note: "Course browsing uses Sanity CMS; enrollment/progress uses on-chain data" |

### 1. Phased Migration (NOT Dead Code)

> [!WARNING]
> Do NOT delete these files — they are actively imported by 5 files.

| File | Consumers | Migration Action |
|------|-----------|------------------|
| `lib/course/content.ts` | `hooks/useCourseDetails.ts` | **Phase 1**: Keep. **Phase 2**: Update `useCourseDetails` to use Sanity. **Phase 3**: Deprecate, then delete |
| `lib/course/tracks.ts` | `CourseCard`, `CourseHeader`, `CourseSidebar`, `CourseFilters` | **Phase 1**: Keep as fallback. **Phase 2**: Add `cms.getTracks()`. **Phase 3**: Update components. **Phase 4**: Delete |

### 2. Type System Updates

`types/course.ts` changes:

- Keep `Course` interface (on-chain PDA type) — unchanged except comment on `contentTxId`
- Remove `CourseWithDetails` (Arweave-based) — replaced by `SanityCourse`
- Update `Lesson` interface — Arweave `contentTxId: string` → Sanity `slug: { current: string }`
- Add: `SanityCourse`, `SanityLesson`, `SanityModule`, `SanityChallenge` types matching GROQ shapes
- Keep: `Quiz`, `QuizQuestion`, `Track`, `Difficulty` — they're reusable

### 3. On-Chain `content_tx_id` Handling

**Decision: zero out.** When creating courses via Sanity CMS:
- Pass `contentTxId: Array(32).fill(0)` in `create_course`
- The field remains on the Course PDA (no program upgrade needed)
- Existing courses with real Arweave tx IDs continue to work

For credential/achievement metadata URIs:
- **Still use Arweave** — immutable and permanent, independent of course content

### 4. API Route Refactoring

| Route | Current | After CMS | Action |
|-------|---------|-----------|--------|
| `GET /api/courses` | Not yet implemented (plan only) | Sanity `cms.getCourses()` | Build with Sanity from start |
| `GET /api/courses/[slug]` | Not yet implemented (plan only) | Sanity `cms.getCourse(slug)` | Build with Sanity from start |
| `POST /api/lessons/complete` | Implemented (on-chain bitmap) | On-chain (unchanged) | **No change** |

### 5. Hook Updates

| Hook | Status | Change |
|------|--------|--------|
| `useCourseDetails` | **LIVE** — uses Arweave `fetchCourseContent` | Migrate to Sanity `cms.getCourse()` — most critical migration |
| `useCourses` | **LIVE** — fetches on-chain | Add Sanity title/description enrichment |
| `useLessonCompletion` | Implemented | **No change** — lesson index mapped from Sanity `order` field |
| `useEnrollment` | Implemented | **No change** — on-chain PDA |
| `useXpBalance` | Implemented | **No change** — on-chain Token-2022 ATA |

### 6. Frontend Editor Integration

`CodeEditor` component (plan only, not implemented):
- Build to read from Sanity `challenge.starterCode.code` / `challenge.solutionCode.code`
- Sanity `code` type wraps string in `{ _type: 'code', language, code }` — extract `.code`
- Test cases come from `challenge.testCases[]` array

### 7. Backend Lesson Validation Adaptation

`validateLessonCompletion` (plan only, not implemented):
- Original plan validates "Content transaction exists on Arweave"
- With Sanity: validate that `lessonSlug` exists in Sanity and resolve `order` → `lessonIndex` for on-chain bitmap
- Quiz validation remains the same — just source of quiz data changes to Sanity

### Implementation Order

**Phase 1 — Foundation (no breaking changes):**
1. Install Sanity deps + create schema files
2. Create Sanity Studio config (`sanity.config.ts`)
3. Add `SanityCourse` / `SanityLesson` types to `types/course.ts`
4. Create `lib/cms/sanity.ts` (production + preview clients, GROQ queries)
5. Create preview API routes (`/api/preview`, `/api/preview/disable`) + `DraftBanner`
6. Run seed script to populate test course

**Phase 2 — Hook migration (swap data source):**
7. Update `hooks/useCourseDetails.ts` → fetch from Sanity instead of Arweave
8. Update `hooks/useCourses.ts` → enrich with Sanity content
9. Mark `fetchCourseContent` and `contentTxIdToString` as `@deprecated`

**Phase 3 — Component migration (track data from Sanity):**
10. Update `CourseCard`, `CourseHeader`, `CourseSidebar`, `CourseFilters` → use Sanity track data
11. Mark `getTrackName`, `getTrackColor`, `TRACKS` as `@deprecated`

**Phase 4 — Cleanup + docs:**
12. Delete `lib/course/content.ts` (all consumers migrated)
13. Delete `lib/course/tracks.ts` (all consumers migrated)
14. Remove deprecated types (`CourseWithDetails`)
15. Update docs: `ARCHITECTURE.md`, `INTEGRATION.md`, `MASTER-PLAN.md`, `SUMMARY.md`, `DEPLOYMENT.md`
16. Build verification
