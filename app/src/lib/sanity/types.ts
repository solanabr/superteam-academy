/**
 * Sanity CMS Content Types
 * These types represent the content structure in Sanity
 */

// Base Sanity document fields
export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
}

// Sanity image reference
export interface SanityImageReference {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// Sanity slug
export interface SanitySlug {
  _type: 'slug';
  current: string;
}

// Sanity reference
export interface SanityReference<T = string> {
  _type: 'reference';
  _ref: T;
}

// Sanity portable text block
export interface SanityBlock {
  _type: 'block';
  _key: string;
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote';
  listItem?: 'bullet' | 'number';
  markDefs?: Array<{
    _key: string;
    _type: string;
    href?: string;
  }>;
  children: Array<{
    _key: string;
    _type: 'span';
    text: string;
    marks?: string[];
  }>;
}

// Portable text content (array of blocks and custom types)
export type PortableTextContent = Array<
  SanityBlock | SanityCodeBlock | SanityCallout | SanityChallenge
>;

// Custom code block type
export interface SanityCodeBlock {
  _type: 'codeBlock';
  _key: string;
  language: 'typescript' | 'javascript' | 'rust' | 'json' | 'bash' | 'solidity';
  code: string;
  filename?: string;
  highlightedLines?: number[];
}

// Callout/note type
export interface SanityCallout {
  _type: 'callout';
  _key: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'tip';
  title: string;
  content: SanityBlock[];
}

// Challenge block type
export interface SanityChallenge {
  _type: 'challenge';
  _key: string;
  title: string;
  prompt: string;
  language: 'typescript' | 'javascript' | 'rust';
  starterCode: string;
  solution: string;
  testCases: Array<{
    description: string;
    input?: string;
    expectedOutput: string;
    hidden?: boolean;
  }>;
  hints: string[];
  xpReward: number;
}

// ==================== Course Structure ====================

// Track (e.g., "Core", "Development", "DeFi")
export interface SanityTrack extends SanityDocument {
  _type: 'track';
  title: string;
  slug: SanitySlug;
  description: string;
  icon: SanityImageReference;
  color: string;
  order: number;
  courses: SanityReference[];
}

// Course
export interface SanityCourse extends SanityDocument {
  _type: 'course';
  title: string;
  slug: SanitySlug;
  description: string;
  thumbnail: SanityImageReference;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  xpReward: number;
  track: SanityReference;
  prerequisites: SanityReference[];
  learningObjectives: string[];
  tags: string[];
  modules: SanityModule[];
  published: boolean;
  featured: boolean;
}

// Module (embedded in course)
export interface SanityModule {
  _type: 'module';
  _key: string;
  title: string;
  description: string;
  order: number;
  lessons: SanityReference[];
}

// Lesson
export interface SanityLesson extends SanityDocument {
  _type: 'lesson';
  title: string;
  slug: SanitySlug;
  type: 'content' | 'challenge' | 'quiz' | 'video' | 'reading';
  duration: number; // minutes
  xpReward: number;
  order: number;
  content: PortableTextContent;
  videoUrl?: string;
  videoProvider?: 'youtube' | 'vimeo' | 'facebook' | 'direct';
  hints?: string[];
  challenge?: SanityChallenge;
  quiz?: SanityQuiz;
  course: SanityReference;
  module: string; // module key reference
}

// Quiz
export interface SanityQuiz {
  _type: 'quiz';
  questions: SanityQuizQuestion[];
  passingScore: number; // percentage
  xpReward: number;
}

// Quiz question
export interface SanityQuizQuestion {
  _type: 'quizQuestion';
  _key: string;
  question: string;
  type: 'single' | 'multiple' | 'text';
  options?: Array<{
    _key: string;
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
  correctAnswer?: string; // for text type
  explanation: string;
  points: number;
}

// ==================== Instructor ====================

export interface SanityInstructor extends SanityDocument {
  _type: 'instructor';
  name: string;
  slug: SanitySlug;
  bio: string;
  avatar: SanityImageReference;
  title: string;
  company?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  courses: SanityReference[];
}

// ==================== Achievement ====================

export interface SanityAchievement extends SanityDocument {
  _type: 'achievement';
  title: string;
  slug: SanitySlug;
  description: string;
  icon: SanityImageReference;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'progress' | 'streak' | 'challenge' | 'social' | 'special';
  condition: {
    type: string;
    value: number;
    metadata?: Record<string, unknown>;
  };
}

// ==================== Type Aliases ====================

// Alias for backward compatibility
export type SanityImage = SanityImageReference;
export type PortableTextBlock = SanityBlock;

// Quiz option type
export interface SanityQuizOption {
  _key: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

// ==================== Search Result ====================

export interface SanitySearchResult {
  _id: string;
  _type: 'course' | 'lesson';
  title: string;
  slug: string;
  description?: string;
  // Course-specific
  thumbnail?: SanityImageReference;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  track?: {
    title: string;
    slug: string;
  };
  // Lesson-specific
  type?: 'content' | 'challenge' | 'quiz';
  course?: {
    title: string;
    slug: string;
  };
}
