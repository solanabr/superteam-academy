/**
 * Content schema for Headless CMS (Sanity / Strapi / Contentful).
 * Courses → Modules → Lessons. Each lesson is content (reading/video) or challenge (coding).
 */

export interface CourseMeta {
  slug: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  xpTotal: number;
  trackId?: number;
  thumbnailUrl?: string;
  instructor?: { name: string; avatarUrl?: string };
  status: 'draft' | 'published';
}

export interface LessonContent {
  type: 'content';
  title: string;
  order: number;
  markdown: string;
  videoUrl?: string;
}

export interface LessonChallenge {
  type: 'challenge';
  title: string;
  order: number;
  prompt: string;
  starterCode: string;
  language: 'rust' | 'typescript' | 'json';
  testCases: { input: string; expectedOutput: string }[];
  xpReward: number;
}

export type Lesson = LessonContent | LessonChallenge;

export interface Module {
  title: string;
  order: number;
  lessons: Lesson[];
}

export type Course = CourseMeta & { modules: Module[] };
