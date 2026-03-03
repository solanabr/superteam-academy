# Content Management System (CMS) Guide

This guide explains how content is managed in the Superteam Brazil Academy learning platform. The system is designed to seamlessly transition from static files during development to a headless CMS (like Sanity or Contentful) in production.

## Architecture

The CMS layer uses the Repository Pattern to abstract the data source from the application logic. 

**Core components:**
- `src/lib/cms.ts`: Defines the `ICmsService` interface and static implementation.
- `src/lib/courses.ts`: Contains the static fallback data and shared type definitions.
- `src/app/api/courses/route.ts` (Planned): API route for fetching content.

## Making the Switch (Static to Headless)

The application currently relies on a `StaticCmsService` that loads content from `src/lib/courses.ts`.

To integrate a headless CMS like Sanity, follow these steps:

### 1. Set Environment Variables
Add your Sanity project details to `.env.local`:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-03-01
```

### 2. Implement the Sanity Service
Create a new file `src/lib/sanity.ts` that implements the `ICmsService` interface:

```typescript
import { ICmsService } from "./cms";
import { Course, Lesson } from "./courses";
import { createClient } from "next-sanity";

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    useCdn: false, // Set to true in production for caching
});

export class SanityCmsService implements ICmsService {
    async getCourses(): Promise<Course[]> {
        return client.fetch(`*[_type == "course"]{...}`);
    }
    
    // ... Implement other interface methods
}
```

### 3. Update the Provider
Change the active CMS service in `src/lib/cms.ts`:

```typescript
// Replace this:
// export const cmsService: ICmsService = new StaticCmsService();

// With this:
import { SanityCmsService } from "./sanity";
export const cmsService: ICmsService = new SanityCmsService();
```

## Schema Recommendations

If setting up Sanity, use the following schema structure to match the frontend expectations:

**Course (`course.js`)**
```javascript
export default {
    name: 'course',
    type: 'document',
    title: 'Course',
    fields: [
        { name: 'slug', type: 'slug', title: 'Slug' },
        { name: 'title', type: 'string', title: 'English Title' },
        { name: 'titlePt', type: 'string', title: 'Portuguese Title' },
        { name: 'titleEs', type: 'string', title: 'Spanish Title' },
        { name: 'description', type: 'text', title: 'Description' },
        // ... Other fields like xpPerLesson, track, level, isActive
        { 
            name: 'lessons', 
            type: 'array', 
            of: [{ type: 'reference', to: [{ type: 'lesson' }] }] 
        }
    ]
}
```

**Lesson (`lesson.js`)**
```javascript
export default {
    name: 'lesson',
    type: 'document',
    title: 'Lesson',
    fields: [
        { name: 'id', type: 'number', title: 'Lesson Order ID' },
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'content', type: 'markdown', title: 'Markdown Content' }, // Or PortableText
        { name: 'hasCodeChallenge', type: 'boolean', title: 'Has Challenge' },
        // ... Add challenge fields
    ]
}
```

## Adding Translations

Currently, static data objects have optional fields matching languages:
- `title` (Default / English)
- `titlePt` (Portuguese)
- `titleEs` (Spanish)

When moving to a CMS, ensure your Headless CMS supports localized fields natively or use the multi-field approach described above. Update the usage in UI components using `if (locale === 'pt-BR') return course.titlePt || course.title;`.
