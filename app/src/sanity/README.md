# Sanity CMS Integration

This directory contains the Sanity CMS configuration and schema definitions for the Superteam Brazil LMS.

## 📁 Directory Structure

```
src/sanity/
├── env.ts              # Environment variables and validation
├── structure.ts        # Studio sidebar structure
├── lib/
│   ├── client.ts       # Sanity client configuration
│   ├── image.ts        # Image URL builder
│   └── live.ts         # Live queries (optional)
└── schemaTypes/
    ├── index.ts        # Schema registry
    ├── track.ts        # Learning track schema
    ├── instructor.ts   # Instructor schema
    ├── course.ts       # Course schema
    ├── lesson.ts       # Lesson schema
    └── achievement.ts  # Achievement schema
```

## 🚀 Quick Start

### Access Sanity Studio

Navigate to `/studio` in your browser to access the Sanity Studio interface for content management.

```
http://localhost:3000/studio
```

### Test Sanity Connection

Visit the test page to verify your Sanity integration:

```
http://localhost:3000/sanity-test
```

Or use the API endpoint:

```
GET /api/sanity/test
```

## 📝 Schema Types

### Track (Learning Track)

Represents learning paths like "Solana Development", "DeFi", etc.

**Fields:**

- `title`: Track name
- `slug`: URL-friendly identifier
- `description`: Track overview
- `icon`: Lucide icon name
- `color`: Tailwind color class
- `order`: Display order

### Instructor

Course instructors and educators.

**Fields:**

- `name`: Full name
- `slug`: URL identifier
- `avatar`: Profile image
- `bio`: Biography (rich text)
- `title`: Job title
- `company`: Company/organization
- `socialLinks`: Twitter, GitHub, LinkedIn, website

### Course

Complete courses with modules and lessons.

**Fields:**

- `title`: Course name
- `slug`: URL identifier
- `description`: Course overview
- `thumbnail`: Cover image
- `track`: Reference to learning track
- `difficulty`: beginner | intermediate | advanced
- `duration`: Time estimate
- `xpReward`: XP points earned
- `prerequisites`: Array of course references
- `learningObjectives`: What students will learn
- `tags`: Category tags
- `modules`: Array of module objects with lessons
- `published`: Visibility flag
- `featured`: Featured course flag
- `order`: Display order

### Lesson

Individual lesson content within courses.

**Fields:**

- `title`: Lesson name
- `slug`: URL identifier
- `course`: Reference to parent course
- `module`: Module key/identifier
- `type`: video | reading | challenge | quiz | interactive
- `duration`: Time in minutes
- `xpReward`: XP points
- `order`: Display order
- `content`: Rich text content (blocks, code, images)
- `hints`: Array of hint strings
- `challenge`: Code challenge configuration
- `quiz`: Quiz configuration

### Achievement

Gamification achievements.

**Fields:**

- `title`: Achievement name
- `slug`: URL identifier
- `description`: How to unlock
- `icon`: Lucide icon name
- `xpReward`: XP points
- `rarity`: common | rare | epic | legendary
- `category`: learning | streak | social | challenge
- `condition`: Unlock condition configuration

## 🔧 Usage Examples

### Client-Side (React Components)

```tsx
'use client';
import { useCourses, useCourse } from '@/lib/sanity';

export function CourseCatalog() {
  const { courses, isLoading, isError } = useCourses();

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

  return (
    <div>
      {courses?.map((course) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
}

export function CourseDetail({ slug }: { slug: string }) {
  const { course, isLoading } = useCourse(slug);

  return course ? <div>{course.title}</div> : <Loading />;
}
```

### Server-Side (Server Components)

```tsx
import { sanityFetch } from '@/lib/sanity/client';
import { courseBySlugQuery } from '@/lib/sanity/queries';

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await sanityFetch(courseBySlugQuery, { slug: params.slug });

  if (!course) return notFound();

  return <CourseDetail course={course} />;
}
```

### API Routes

```tsx
import { NextResponse } from 'next/server';
import { sanityFetch } from '@/lib/sanity/client';
import { allCoursesQuery } from '@/lib/sanity/queries';

export async function GET() {
  const courses = await sanityFetch(allCoursesQuery);
  return NextResponse.json({ courses });
}
```

### Image URLs

```tsx
import { urlFor } from '@/lib/sanity/client';

<img
  src={urlFor(course.thumbnail).width(800).height(600).format('webp').url()}
  alt={course.title}
/>;
```

## 🔍 GROQ Queries

GROQ is Sanity's query language. Here are some common patterns:

### Basic Query

```groq
*[_type == "course" && published == true]
```

### With Projections

```groq
*[_type == "course"] {
  _id,
  title,
  "slug": slug.current,
  description
}
```

### With References

```groq
*[_type == "course"] {
  title,
  "track": track->{ title, slug }
}
```

### With Filters and Ordering

```groq
*[_type == "course" && difficulty == "beginner"] | order(order asc) {
  title,
  difficulty
}
```

## 📚 Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [GROQ Reference](https://www.sanity.io/docs/groq)
- [Schema Types](https://www.sanity.io/docs/schema-types)
- [Content Studio](https://www.sanity.io/docs/sanity-studio)

## 🔐 Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=your-api-token
```

## 🛠️ CLI Commands

```bash
# Deploy schema to Sanity
npx sanity schema deploy

# Generate TypeScript types
npx sanity typegen generate

# Deploy Studio
npx sanity deploy

# Start local Studio
npx sanity start
```

## 📝 Content Creation Workflow

1. **Create Tracks** - Define learning paths
2. **Add Instructors** - Set up course teachers
3. **Create Courses** - Build course structure
4. **Add Lessons** - Create lesson content
5. **Set Achievements** - Define gamification rewards

## 🔄 Content Updates

Content in Sanity is real-time. When you update content in the Studio:

- Client-side components using SWR will automatically revalidate
- Server-side components will get fresh data on next render
- No deployment needed for content changes!
