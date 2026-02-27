import type { Course, Lesson, Module } from '@/types';

/**
 * Extended course type with full content for static generation
 */
export interface CourseWithContent extends Omit<Course, 'modules'> {
  modules: ModuleWithContent[];
  prerequisites?: string[];
  learningObjectives?: string[];
  tags?: string[];
  lastUpdated?: Date;
}

export interface ModuleWithContent extends Module {
  description?: string;
  lessons: LessonWithContent[];
}

export interface LessonWithContent extends Lesson {
  content: string; // Raw MDX content
  order: number;
  moduleId: string;
  videoUrl?: string;
  videoProvider?: 'youtube' | 'vimeo' | 'facebook' | 'direct';
  videoDurationSeconds?: number; // Video duration in seconds for auto-completion
  prevLesson?: { slug: string; title: string };
  nextLesson?: { slug: string; title: string };
}

/**
 * Frontmatter for MDX lesson files
 */
export interface LessonFrontmatter {
  title: string;
  description?: string;
  type: 'content' | 'challenge' | 'video' | 'reading' | 'quiz';
  xpReward: number;
  duration?: number;
  order: number;
  hints?: string[];
  videoUrl?: string;
  videoProvider?: 'youtube' | 'vimeo' | 'facebook' | 'direct';
  challenge?: {
    prompt: string;
    starterCode: string;
    solution: string;
    language: 'rust' | 'typescript' | 'json';
    testCases: Array<{
      description: string;
      input?: string;
      expectedOutput: string;
      hidden?: boolean;
    }>;
  };
}

/**
 * Course catalog item for listing
 */
export interface CourseCatalogItem {
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  xpReward: number;
  track?: string;
  lessonsCount: number;
  modulesCount: number;
  tags?: string[];
  instructor?: {
    name: string;
    avatar: string;
    bio?: string;
  };
}

/**
 * Course progress for a user
 */
export interface UserCourseProgress {
  courseSlug: string;
  enrolledAt: Date;
  progressPercentage: number;
  completedLessons: string[];
  currentLessonSlug?: string;
  xpEarned: number;
  completed: boolean;
  completedAt?: Date;
}
