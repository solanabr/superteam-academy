import { create } from 'zustand';
import { client } from '@/lib/sanity/client';
import { allCoursesQuery } from '@/lib/sanity/queries';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type SortBy = 'newest' | 'popular' | 'difficulty' | 'title';

export interface CourseFilters {
  track: string | null;
  difficulty: Difficulty | null;
  searchQuery: string;
  sortBy: SortBy;
}

export interface CourseWithMeta {
  // On-chain data
  courseId: string;
  creator: string;
  lessonCount: number;
  difficulty: number; // 0=beginner, 1=intermediate, 2=advanced
  xpPerLesson: number;
  trackId: number;
  isActive: boolean;

  // CMS data (from Sanity)
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  modules: { title: string; lessonCount: number }[];
  tags: string[];
  estimatedHours: number;
  prerequisiteCourseId: string | null;

  // Computed
  totalXp: number;
  enrollmentCount: number;

  // Internal reference for filtering
  trackSlug: string;
}

export interface CourseState {
  // State
  courses: CourseWithMeta[];
  selectedCourse: CourseWithMeta | null;
  filters: CourseFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCourses: (locale?: string) => Promise<void>;
  selectCourse: (courseId: string) => void;
  setFilter: <K extends keyof CourseFilters>(key: K, value: CourseFilters[K]) => void;
  resetFilters: () => void;
  getFilteredCourses: () => CourseWithMeta[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIFFICULTY_MAP: Record<string, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const DEFAULT_FILTERS: CourseFilters = {
  track: null,
  difficulty: null,
  searchQuery: '',
  sortBy: 'newest',
};

const DEFAULT_XP_PER_LESSON = 25;
const ESTIMATED_MINUTES_PER_LESSON = 15;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Raw shape returned by `allCoursesQuery` from Sanity.
 * Matches the GROQ projection in `@/lib/sanity/queries`.
 */
interface SanityCourseRaw {
  _id: string;
  courseId: string;
  title: { [locale: string]: string | undefined; en?: string; pt?: string; es?: string } | null;
  description: { [locale: string]: string | undefined; en?: string; pt?: string; es?: string } | null;
  thumbnail: { asset?: { _ref?: string } } | null;
  difficulty: string | null;
  xpPerLesson: number | null;
  lessonCount: number | null;
  skills: string[] | null;
  prerequisites: string[] | null;
  track: {
    _id: string;
    trackId: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
}

function difficultyStringToNumber(difficulty: string | null): number {
  if (!difficulty) return 0;
  return DIFFICULTY_MAP[difficulty] ?? 0;
}

function sanityCourseToMeta(raw: SanityCourseRaw, locale: string = 'en'): CourseWithMeta {
  const lessonCount = raw.lessonCount ?? 0;
  const xpPerLesson = raw.xpPerLesson ?? DEFAULT_XP_PER_LESSON;
  const difficultyNum = difficultyStringToNumber(raw.difficulty);

  return {
    // On-chain fields (defaults until IDL deserialization is wired)
    courseId: raw.courseId,
    creator: '',
    lessonCount,
    difficulty: difficultyNum,
    xpPerLesson,
    trackId: raw.track ? parseInt(raw.track.trackId, 10) || 0 : 0,
    isActive: true,

    // CMS data
    title: raw.title?.[locale] ?? raw.title?.en ?? '',
    slug: raw.courseId,
    description: raw.description?.[locale] ?? raw.description?.en ?? '',
    imageUrl: raw.thumbnail?.asset?._ref ?? '',
    modules: [],
    tags: raw.skills ?? [],
    estimatedHours: Math.max(
      1,
      Math.round((lessonCount * ESTIMATED_MINUTES_PER_LESSON) / 60),
    ),
    prerequisiteCourseId: raw.prerequisites?.[0] ?? null,

    // Computed
    totalXp: lessonCount * xpPerLesson,
    enrollmentCount: 0,

    // Internal
    trackSlug: raw.track?.trackId ?? '',
  };
}

function matchesSearch(course: CourseWithMeta, query: string): boolean {
  const lower = query.toLowerCase();
  return (
    course.title.toLowerCase().includes(lower) ||
    course.description.toLowerCase().includes(lower) ||
    course.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

function compareCourses(a: CourseWithMeta, b: CourseWithMeta, sortBy: SortBy): number {
  switch (sortBy) {
    case 'title':
      return a.title.localeCompare(b.title);
    case 'difficulty':
      return a.difficulty - b.difficulty;
    case 'popular':
      return b.enrollmentCount - a.enrollmentCount;
    case 'newest':
    default:
      // Without on-chain timestamps, maintain insertion order (stable)
      return 0;
  }
}

const DIFFICULTY_LABEL_TO_NUM: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCourseStore = create<CourseState>()((set, get) => ({
  // Initial state
  courses: [],
  selectedCourse: null,
  filters: { ...DEFAULT_FILTERS },
  isLoading: false,
  error: null,

  fetchCourses: async (locale: string = 'en') => {
    set({ isLoading: true, error: null });

    try {
      const rawCourses: SanityCourseRaw[] = await client.fetch(allCoursesQuery);
      const courses = rawCourses.map((raw) => sanityCourseToMeta(raw, locale));
      set({ courses, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch courses';
      set({ error: message, isLoading: false });
    }
  },

  selectCourse: (courseId: string) => {
    const { courses } = get();
    const found = courses.find((c) => c.courseId === courseId) ?? null;
    set({ selectedCourse: found });
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  getFilteredCourses: () => {
    const { courses, filters } = get();

    let filtered = courses;

    // Filter by track
    if (filters.track) {
      filtered = filtered.filter((c) => c.trackSlug === filters.track);
    }

    // Filter by difficulty
    if (filters.difficulty) {
      const targetDifficulty = DIFFICULTY_LABEL_TO_NUM[filters.difficulty];
      filtered = filtered.filter((c) => c.difficulty === targetDifficulty);
    }

    // Filter by search query
    if (filters.searchQuery.trim()) {
      filtered = filtered.filter((c) => matchesSearch(c, filters.searchQuery.trim()));
    }

    // Sort
    return [...filtered].sort((a, b) => compareCourses(a, b, filters.sortBy));
  },
}));
