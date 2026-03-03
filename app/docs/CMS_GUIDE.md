# CMS Integration Guide — Superteam Academy

## Overview

Superteam Academy uses **Sanity** as its headless CMS for managing course content. Currently, comprehensive mock data is provided for development. This guide explains how to connect a live Sanity instance.

## Sanity Schema Design

### Course Document

```typescript
// schemas/course.ts
export default defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'description', type: 'text' }),
    defineField({ name: 'longDescription', type: 'text' }),
    defineField({ name: 'difficulty', type: 'string', options: {
      list: ['beginner', 'intermediate', 'advanced']
    }}),
    defineField({ name: 'track', type: 'string' }),
    defineField({ name: 'trackColor', type: 'string' }),
    defineField({ name: 'courseId', type: 'string', description: 'On-chain course account ID' }),
    defineField({ name: 'duration', type: 'number', description: 'Total duration in minutes' }),
    defineField({ name: 'xpReward', type: 'number' }),
    defineField({ name: 'xpPerLesson', type: 'number' }),
    defineField({ name: 'prerequisites', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'objectives', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'thumbnail', type: 'image' }),
    defineField({ name: 'instructor', type: 'reference', to: [{ type: 'instructor' }] }),
    defineField({ name: 'modules', type: 'array', of: [{ type: 'reference', to: [{ type: 'module' }] }] }),
  ]
})
```

### Module Document

```typescript
export default defineType({
  name: 'module',
  title: 'Module',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'order', type: 'number' }),
    defineField({ name: 'lessons', type: 'array', of: [{ type: 'reference', to: [{ type: 'lesson' }] }] }),
  ]
})
```

### Lesson Document

```typescript
export default defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'type', type: 'string', options: {
      list: ['reading', 'video', 'challenge', 'quiz']
    }}),
    defineField({ name: 'content', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'duration', type: 'number' }),
    defineField({ name: 'xpReward', type: 'number' }),
    defineField({ name: 'challenge', type: 'object', fields: [
      { name: 'language', type: 'string', options: { list: ['rust', 'typescript', 'json'] }},
      { name: 'starterCode', type: 'text' },
      { name: 'solution', type: 'text' },
      { name: 'prompt', type: 'text' },
      { name: 'objectives', type: 'array', of: [{ type: 'string' }] },
      { name: 'hints', type: 'array', of: [{ type: 'string' }] },
      { name: 'testCases', type: 'array', of: [{ type: 'object', fields: [
        { name: 'name', type: 'string' },
        { name: 'input', type: 'text' },
        { name: 'expected', type: 'text' },
      ]}]},
    ]}),
  ]
})
```

## Connecting Sanity

### 1. Create Sanity Project

```bash
npx sanity@latest init --project-name "superteam-academy"
```

### 2. Environment Variables

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-api-token
```

### 3. Update CourseService

Replace mock data calls in `src/services/index.ts` with Sanity GROQ queries:

```typescript
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: true,
});

export const CourseService = {
  async getAllCourses(): Promise<Course[]> {
    return client.fetch(`*[_type == "course"]{ 
      ..., 
      instructor->, 
      modules[]->{..., lessons[]->} 
    }`);
  },
  // ...
};
```

## Content Localization

Sanity supports field-level localization. Add locale variants for each text field:

```typescript
defineField({
  name: 'title',
  type: 'object',
  fields: [
    { name: 'en', type: 'string', title: 'English' },
    { name: 'pt_BR', type: 'string', title: 'Português' },
    { name: 'es', type: 'string', title: 'Español' },
  ]
})
```
