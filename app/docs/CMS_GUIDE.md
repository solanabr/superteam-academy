# CMS Integration Guide

This document explains how to set up and configure the Sanity CMS integration for Superteam Academy.

## Overview

Superteam Academy uses [Sanity](https://www.sanity.io/) as its headless CMS. The frontend is designed to:
- **Work without CMS**: Falls back to mock data if Sanity is not configured
- **Progressive migration**: Start with mock data, gradually move to CMS
- **Type-safe**: Full TypeScript support for CMS content

## Quick Start

### 1. Create a Sanity Project

```bash
# Install Sanity CLI
npm install -g @sanity/cli

# Create a new Sanity project
sanity init

# When prompted:
# - Project name: superteam-academy
# - Dataset: production
# - Output path: ./sanity-studio
```

### 2. Configure Environment Variables

Create or update `.env.local`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-api-token  # For preview/draft content
```

### 3. Deploy Schemas

Copy the schemas from `sanity/schemas/` to your Sanity Studio:

```bash
cp sanity/schemas/*.ts sanity-studio/schemas/
```

Update `sanity-studio/sanity.config.ts` to include the schemas:

```typescript
import { schemaTypes } from './schemas'

export default defineConfig({
  // ... other config
  schema: {
    types: schemaTypes,
  },
})
```

Deploy the studio:

```bash
cd sanity-studio
sanity deploy
```

## Content Schemas

### Course Schema

| Field | Type | Description |
|-------|------|-------------|
| title | string | Course title (required) |
| slug | slug | URL-friendly identifier |
| description | text | Short course description |
| level | enum | beginner, intermediate, advanced |
| duration | string | Estimated time (e.g., "4 hours") |
| lessonsCount | number | Total lesson count |
| xpReward | number | XP earned on completion |
| tags | array[string] | Searchable tags |
| featured | boolean | Show in featured section |
| lessons | array[reference] | References to Lesson documents |
| prerequisites | array[string] | Prerequisite knowledge |
| whatYouWillLearn | array[string] | Learning outcomes |

### Lesson Schema

| Field | Type | Description |
|-------|------|-------------|
| title | string | Lesson title (required) |
| slug | slug | URL-friendly identifier |
| content | array[block] | Rich text content (Portable Text) |
| codeTemplate | code | Starter code for exercises |
| solution | code | Reference solution (hidden) |
| testCases | array[object] | Input/output test cases |
| xpReward | number | XP earned on completion |
| hints | array[string] | Progressive hints |
| order | number | Position within course |

### Track Schema

| Field | Type | Description |
|-------|------|-------------|
| title | string | Track name |
| description | text | Track overview |
| icon | string | Lucide icon name |
| color | string | Theme color |
| courses | array[reference] | Courses in this track |
| credentialMetadata | object | NFT credential info |

## Data Fetching

The frontend uses a data layer (`src/lib/data/courses.ts`) that:

1. **Checks if Sanity is configured** via environment variables
2. **Fetches from Sanity** if configured
3. **Falls back to mock data** if not configured or on error

### Usage in Components

```typescript
import { getCourses, getCourseBySlug, getLessonById } from '@/lib/data/courses';

// Fetch all courses
const courses = await getCourses();

// Fetch single course
const course = await getCourseBySlug('solana-101');

// Fetch lesson
const lesson = await getLessonById('lesson-1');
```

### GROQ Queries

Queries are defined in `src/lib/sanity/queries.ts`:

```typescript
// Get all courses
export const coursesQuery = groq`
  *[_type == "course"] | order(featured desc, order asc) {
    _id,
    slug,
    title,
    // ...other fields
  }
`;
```

## Adding Content

### Via Sanity Studio

1. Open your Sanity Studio (usually at `your-project.sanity.studio`)
2. Navigate to **Course** or **Lesson** in the sidebar
3. Click **Create new document**
4. Fill in required fields
5. Click **Publish**

### Programmatically (Mutations)

```typescript
import { client } from '@/lib/sanity/client';

// Create a course
await client.create({
  _type: 'course',
  title: 'New Course',
  slug: { current: 'new-course' },
  level: 'beginner',
  // ...other fields
});
```

## Localization

Content can be localized using Sanity's locale string pattern:

1. Define localized fields in schemas:
```typescript
{
  name: 'title',
  type: 'object',
  fields: [
    { name: 'en', type: 'string' },
    { name: 'pt', type: 'string' },
    { name: 'es', type: 'string' },
  ]
}
```

2. Query with locale:
```typescript
const query = groq`
  *[_type == "course"] {
    "title": title[$locale]
  }
`;
```

## Preview Mode

For draft/preview content:

1. Set `SANITY_API_TOKEN` environment variable
2. Use `previewClient` instead of `client`
3. Configure preview routes in Next.js

## Troubleshooting

### CMS Not Loading

1. Verify environment variables are set
2. Check Sanity project ID is correct
3. Verify dataset name matches

### Content Not Updating

1. Clear Next.js cache: `rm -rf .next`
2. Check Sanity CDN caching (5-minute default)
3. Use `useCdn: false` for real-time updates

### Type Errors

1. Regenerate types from Sanity schemas
2. Update `src/lib/sanity/types.ts` to match schema changes

## Migration from Mock Data

To migrate from mock data to CMS:

1. Set up Sanity project and deploy schemas
2. Create content in Sanity matching mock data structure
3. Add environment variables
4. Test all pages load correctly
5. Remove mock data fallbacks (optional)

## Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [GROQ Query Language](https://www.sanity.io/docs/groq)
- [Portable Text](https://www.sanity.io/docs/presenting-block-text)
- [next-sanity Package](https://github.com/sanity-io/next-sanity)
