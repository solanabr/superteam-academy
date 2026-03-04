/**
 * Sanity CMS Schema Definitions
 *
 * These TypeScript types mirror the schemas configured in Sanity Studio.
 * Create these schemas in your Sanity Studio project (efj5r9bz).
 *
 * To set up the Studio, run:
 *   npx sanity@latest init --project efj5r9bz --dataset production
 *
 * Then copy the schema definitions below into your Studio's schema files.
 */

// ============================================================
// TypeScript interfaces for the CMS content
// ============================================================

export interface PortableTextBlock {
  _type: string;
  _key?: string;
  style?: string;
  children?: Array<{ _type: string; text: string; marks?: string[] }>;
  code?: string;
  language?: string;
  [key: string]: unknown;
}

export interface Track {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  icon: string;
  order: number;
  courseCount?: number;
}

export interface Course {
  _id: string;
  onChainCourseId?: string;
  title: string;
  slug: { current: string };
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  xpReward: number;
  thumbnail?: SanityImage;
  track?: Pick<Track, "_id" | "title" | "slug">;
  prerequisites?: string[];
  tags?: string[];
  modules?: Module[];
  moduleCount?: number;
  lessonCount?: number;
}

export interface Module {
  _id: string;
  title: string;
  order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  _id: string;
  title: string;
  slug: { current: string };
  type: "content" | "challenge";
  body?: PortableTextBlock[]; // Portable Text blocks
  estimatedMinutes?: number;
  xpReward: number;
  order: number;
  language?: string; // e.g. "rust", "typescript", "javascript"
  starterCode?: string;
  solutionCode?: string;
  expectedOutput?: string;
  hints?: string[];
  module?: {
    _id: string;
    title: string;
    order: number;
    course?: Pick<Course, "_id" | "title" | "slug">;
  };
}

export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
}

// ============================================================
// Sanity Studio Schema Definitions (for reference)
// Copy these into your Sanity Studio schemaTypes/ folder.
// ============================================================

/*
// schemaTypes/track.ts
export default {
  name: 'track',
  title: 'Learning Track',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (Rule) => Rule.required() },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'icon', title: 'Icon Name', type: 'string', description: 'Lucide icon name' },
    { name: 'order', title: 'Sort Order', type: 'number', validation: (Rule) => Rule.required() },
  ],
}

// schemaTypes/course.ts
export default {
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (Rule) => Rule.required() },
    { name: 'description', title: 'Description', type: 'text', validation: (Rule) => Rule.required() },
    { name: 'difficulty', title: 'Difficulty', type: 'string', options: { list: ['beginner', 'intermediate', 'advanced'] } },
    { name: 'duration', title: 'Duration', type: 'string', description: 'e.g. "4 hours"' },
    { name: 'xpReward', title: 'Total XP Reward', type: 'number' },
    { name: 'thumbnail', title: 'Thumbnail', type: 'image', options: { hotspot: true } },
    { name: 'track', title: 'Track', type: 'reference', to: [{ type: 'track' }] },
    { name: 'prerequisites', title: 'Prerequisites', type: 'array', of: [{ type: 'string' }] },
    { name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] },
    { name: 'modules', title: 'Modules', type: 'array', of: [{ type: 'reference', to: [{ type: 'module' }] }] },
    { name: 'order', title: 'Sort Order', type: 'number' },
  ],
}

// schemaTypes/module.ts
export default {
  name: 'module',
  title: 'Module',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
    { name: 'order', title: 'Sort Order', type: 'number', validation: (Rule) => Rule.required() },
    { name: 'lessons', title: 'Lessons', type: 'array', of: [{ type: 'reference', to: [{ type: 'lesson' }] }] },
  ],
}

// schemaTypes/lesson.ts
export default {
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (Rule) => Rule.required() },
    { name: 'type', title: 'Type', type: 'string', options: { list: ['content', 'challenge'] }, validation: (Rule) => Rule.required() },
    { name: 'body', title: 'Content', type: 'array', of: [{ type: 'block' }, { type: 'code' }, { type: 'image' }] },
    { name: 'estimatedMinutes', title: 'Estimated Minutes', type: 'number' },
    { name: 'xpReward', title: 'XP Reward', type: 'number' },
    { name: 'order', title: 'Sort Order', type: 'number', validation: (Rule) => Rule.required() },
    { name: 'starterCode', title: 'Starter Code', type: 'text', description: 'For challenge-type lessons' },
    { name: 'solutionCode', title: 'Solution Code', type: 'text' },
    { name: 'expectedOutput', title: 'Expected Output', type: 'text' },
    { name: 'hints', title: 'Hints', type: 'array', of: [{ type: 'string' }] },
  ],
}

// schemaTypes/landingPage.ts
export default {
  name: 'landingPage',
  title: 'Landing Page',
  type: 'document',
  fields: [
    { name: 'heroTitle', title: 'Hero Title', type: 'string' },
    { name: 'heroSubtitle', title: 'Hero Subtitle', type: 'text' },
    { name: 'features', title: 'Feature Highlights', type: 'array', of: [{ type: 'object', fields: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'text' },
      { name: 'icon', type: 'string' },
    ]}]},
    { name: 'testimonials', title: 'Testimonials', type: 'array', of: [{ type: 'object', fields: [
      { name: 'name', type: 'string' },
      { name: 'role', type: 'string' },
      { name: 'quote', type: 'text' },
      { name: 'avatar', type: 'image' },
    ]}]},
    { name: 'stats', title: 'Stats', type: 'array', of: [{ type: 'object', fields: [
      { name: 'label', type: 'string' },
      { name: 'value', type: 'string' },
    ]}]},
  ],
}
*/
