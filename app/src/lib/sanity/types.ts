// Type definitions for Sanity content

export interface Course {
  _id: string;
  slug: { current: string };
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  lessonsCount: number;
  studentsCount: number;
  rating: number;
  xpReward: number;
  tags: string[];
  image?: {
    asset: {
      _ref: string;
      url: string;
    };
  };
  instructor: string;
  featured: boolean;
  overview?: any; // Portable Text
  prerequisites?: string[];
  whatYouWillLearn?: string[];
  lessons?: LessonReference[];
}

export interface LessonReference {
  _id: string;
  slug: { current: string };
  title: string;
  description?: string;
  xpReward?: number;
  duration?: string;
  order?: number;
}

export interface Lesson {
  _id: string;
  slug: { current: string };
  title: string;
  description?: string;
  content: any; // Portable Text / MDX
  codeTemplate?: string;
  solution?: string;
  testCases?: TestCase[];
  xpReward: number;
  duration?: string;
  hints?: string[];
  course?: {
    _id: string;
    slug: { current: string };
    title: string;
    lessons: LessonReference[];
  };
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description?: string;
  hidden?: boolean;
}

export interface Student {
  _id: string;
  walletAddress: string;
  displayName?: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  coursesCompleted: number;
  rank: number;
}

export interface Track {
  _id: string;
  slug: { current: string };
  title: string;
  description: string;
  icon?: string;
  color?: string;
  courses?: Course[];
}

// Helper type for localized strings
export interface LocaleString {
  pt?: string;
  es?: string;
  en?: string;
}
