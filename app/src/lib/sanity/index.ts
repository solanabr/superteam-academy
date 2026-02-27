/**
 * Sanity CMS Integration
 * Export all Sanity-related utilities, hooks, and types
 */

// Client utilities
export {
  sanityClient,
  sanityWriteClient,
  urlFor,
  sanityFetch,
  previewClient,
  getClient,
  sanityConfig,
} from './client';

// Hooks for client-side data fetching
export {
  // Course hooks
  useCourses,
  useFeaturedCourses,
  useCourse,
  useCoursesByTrack,
  // Lesson hooks
  useLesson,
  useCourseLessons,
  useAdjacentLessons,
  // Track hooks
  useTracks,
  useTrack,
  // Instructor hooks
  useInstructor,
  // Achievement hooks
  useAchievements,
  // Search hook
  useSearch,
  // Server-side fetching helpers
  fetchCourses,
  fetchFeaturedCourses,
  fetchCourse,
  fetchLesson,
  fetchTracks,
  fetchTrack,
} from './hooks';

// GROQ Queries
export {
  allCoursesQuery,
  featuredCoursesQuery,
  courseBySlugQuery,
  coursesByTrackQuery,
  lessonBySlugQuery,
  courseLessonsQuery,
  adjacentLessonsQuery,
  allTracksQuery,
  trackBySlugQuery,
  instructorBySlugQuery,
  allAchievementsQuery,
  searchQuery,
} from './queries';

// Types
export type {
  SanityDocument,
  SanityImage,
  SanitySlug,
  SanityReference,
  PortableTextBlock,
  PortableTextContent,
  SanityCodeBlock,
  SanityChallenge,
  SanityQuizOption,
  SanityQuiz,
  SanityLesson,
  SanityModule,
  SanityCourse,
  SanityTrack,
  SanityInstructor,
  SanityAchievement,
  SanitySearchResult,
} from './types';
