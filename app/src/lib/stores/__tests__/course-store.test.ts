import { describe, it, expect, vi, beforeEach } from 'vitest';
// ---------------------------------------------------------------------------
// Mocks — must be hoisted before store import
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

vi.mock('@/lib/sanity/client', () => ({
  client: { fetch: (...args: unknown[]) => mockFetch(...args) },
}));

vi.mock('@/lib/sanity/queries', () => ({
  allCoursesQuery: 'MOCK_ALL_COURSES_QUERY',
}));

// Import after mocks are wired
const { useCourseStore } = await import('../course-store');

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeSanityCourse(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'sanity-1',
    courseId: 'solana-101',
    title: { en: 'Solana 101', pt: 'Solana 101', es: 'Solana 101' },
    description: { en: 'Introduction to Solana', pt: '', es: '' },
    thumbnail: { asset: { _ref: 'image-abc-200x200-png' } },
    difficulty: 'beginner',
    xpPerLesson: 25,
    lessonCount: 10,
    skills: ['solana', 'rust'],
    prerequisites: null,
    track: {
      _id: 'track-1',
      trackId: 'solana-core',
      name: 'Solana Core',
      icon: 'rocket',
      color: '#9945FF',
    },
    ...overrides,
  };
}

function makeSanityCourses() {
  return [
    makeSanityCourse(),
    makeSanityCourse({
      _id: 'sanity-2',
      courseId: 'defi-201',
      title: { en: 'DeFi Deep Dive' },
      description: { en: 'Advanced DeFi protocols on Solana' },
      difficulty: 'advanced',
      xpPerLesson: 50,
      lessonCount: 8,
      skills: ['defi', 'lending'],
      prerequisites: ['solana-101'],
      track: {
        _id: 'track-2',
        trackId: 'defi',
        name: 'DeFi',
        icon: 'shield',
        color: '#14F195',
      },
    }),
    makeSanityCourse({
      _id: 'sanity-3',
      courseId: 'anchor-102',
      title: { en: 'Anchor Framework' },
      description: { en: 'Build programs with Anchor' },
      difficulty: 'intermediate',
      xpPerLesson: 30,
      lessonCount: 12,
      skills: ['anchor', 'solana', 'programs'],
      track: {
        _id: 'track-1',
        trackId: 'solana-core',
        name: 'Solana Core',
        icon: 'rocket',
        color: '#9945FF',
      },
    }),
  ];
}

/**
 * Helper to get a hydrated course from the store's internal mapping.
 * Matches what `sanityCourseToMeta` produces.
 */
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCourseStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state between tests
    useCourseStore.setState({
      courses: [],
      selectedCourse: null,
      filters: {
        track: null,
        difficulty: null,
        duration: null,
        searchQuery: '',
        sortBy: 'newest',
      },
      isLoading: false,
      error: null,
    });
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('has empty courses array', () => {
      expect(useCourseStore.getState().courses).toEqual([]);
    });

    it('has null selectedCourse', () => {
      expect(useCourseStore.getState().selectedCourse).toBeNull();
    });

    it('has default filter values', () => {
      const { filters } = useCourseStore.getState();
      expect(filters.track).toBeNull();
      expect(filters.difficulty).toBeNull();
      expect(filters.duration).toBeNull();
      expect(filters.searchQuery).toBe('');
      expect(filters.sortBy).toBe('newest');
    });

    it('is not loading', () => {
      expect(useCourseStore.getState().isLoading).toBe(false);
    });

    it('has no error', () => {
      expect(useCourseStore.getState().error).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // setFilter
  // -------------------------------------------------------------------------

  describe('setFilter', () => {
    it('updates the track filter', () => {
      useCourseStore.getState().setFilter('track', 'solana-core');
      expect(useCourseStore.getState().filters.track).toBe('solana-core');
    });

    it('updates the difficulty filter', () => {
      useCourseStore.getState().setFilter('difficulty', 'advanced');
      expect(useCourseStore.getState().filters.difficulty).toBe('advanced');
    });

    it('updates the searchQuery filter', () => {
      useCourseStore.getState().setFilter('searchQuery', 'anchor');
      expect(useCourseStore.getState().filters.searchQuery).toBe('anchor');
    });

    it('updates the sortBy filter', () => {
      useCourseStore.getState().setFilter('sortBy', 'title');
      expect(useCourseStore.getState().filters.sortBy).toBe('title');
    });

    it('preserves other filter values when updating one', () => {
      useCourseStore.getState().setFilter('track', 'defi');
      useCourseStore.getState().setFilter('difficulty', 'beginner');
      const { filters } = useCourseStore.getState();
      expect(filters.track).toBe('defi');
      expect(filters.difficulty).toBe('beginner');
    });
  });

  // -------------------------------------------------------------------------
  // resetFilters
  // -------------------------------------------------------------------------

  describe('resetFilters', () => {
    it('resets all filters to default values', () => {
      useCourseStore.getState().setFilter('track', 'defi');
      useCourseStore.getState().setFilter('difficulty', 'advanced');
      useCourseStore.getState().setFilter('duration', 'short');
      useCourseStore.getState().setFilter('searchQuery', 'test');
      useCourseStore.getState().setFilter('sortBy', 'title');

      useCourseStore.getState().resetFilters();

      const { filters } = useCourseStore.getState();
      expect(filters.track).toBeNull();
      expect(filters.difficulty).toBeNull();
      expect(filters.duration).toBeNull();
      expect(filters.searchQuery).toBe('');
      expect(filters.sortBy).toBe('newest');
    });
  });

  // -------------------------------------------------------------------------
  // selectCourse
  // -------------------------------------------------------------------------

  describe('selectCourse', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce(makeSanityCourses());
    });

    it('sets selectedCourse when courseId matches', async () => {
      await useCourseStore.getState().fetchCourses();
      useCourseStore.getState().selectCourse('defi-201');

      const { selectedCourse } = useCourseStore.getState();
      expect(selectedCourse).not.toBeNull();
      expect(selectedCourse!.courseId).toBe('defi-201');
    });

    it('sets selectedCourse to null for unknown courseId', async () => {
      await useCourseStore.getState().fetchCourses();
      useCourseStore.getState().selectCourse('nonexistent-999');

      expect(useCourseStore.getState().selectedCourse).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // fetchCourses
  // -------------------------------------------------------------------------

  describe('fetchCourses', () => {
    it('populates courses from Sanity data', async () => {
      mockFetch.mockResolvedValueOnce(makeSanityCourses());

      await useCourseStore.getState().fetchCourses();

      const { courses, isLoading, error } = useCourseStore.getState();
      expect(courses).toHaveLength(3);
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });

    it('maps Sanity fields to CourseWithMeta correctly', async () => {
      mockFetch.mockResolvedValueOnce([makeSanityCourse()]);

      await useCourseStore.getState().fetchCourses();

      const course = useCourseStore.getState().courses[0]!;
      expect(course.courseId).toBe('solana-101');
      expect(course.title).toBe('Solana 101');
      expect(course.description).toBe('Introduction to Solana');
      expect(course.difficulty).toBe(0); // beginner
      expect(course.xpPerLesson).toBe(25);
      expect(course.lessonCount).toBe(10);
      expect(course.totalXp).toBe(250); // 10 * 25
      expect(course.tags).toEqual(['solana', 'rust']);
      expect(course.trackSlug).toBe('solana-core');
      expect(course.isActive).toBe(true);
      expect(course.creator).toBe('');
      expect(course.enrollmentCount).toBe(0);
    });

    it('sets isLoading to true during fetch', async () => {
      let capturedLoading = false;
      mockFetch.mockImplementationOnce(() => {
        capturedLoading = useCourseStore.getState().isLoading;
        return Promise.resolve([]);
      });

      await useCourseStore.getState().fetchCourses();

      expect(capturedLoading).toBe(true);
      expect(useCourseStore.getState().isLoading).toBe(false);
    });

    it('sets error message on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await useCourseStore.getState().fetchCourses();

      const { error, isLoading, courses } = useCourseStore.getState();
      expect(error).toBe('Network timeout');
      expect(isLoading).toBe(false);
      expect(courses).toEqual([]);
    });

    it('sets generic error message for non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('unexpected string error');

      await useCourseStore.getState().fetchCourses();

      expect(useCourseStore.getState().error).toBe('Failed to fetch courses');
    });

    it('clears previous error on successful fetch', async () => {
      mockFetch.mockRejectedValueOnce(new Error('First failure'));
      await useCourseStore.getState().fetchCourses();
      expect(useCourseStore.getState().error).toBe('First failure');

      mockFetch.mockResolvedValueOnce(makeSanityCourses());
      await useCourseStore.getState().fetchCourses();
      expect(useCourseStore.getState().error).toBeNull();
    });

    it('handles courses with missing optional fields gracefully', async () => {
      mockFetch.mockResolvedValueOnce([
        makeSanityCourse({
          title: null,
          description: null,
          thumbnail: null,
          skills: null,
          prerequisites: null,
          track: null,
          xpPerLesson: null,
          lessonCount: null,
          difficulty: null,
        }),
      ]);

      await useCourseStore.getState().fetchCourses();

      const course = useCourseStore.getState().courses[0]!;
      expect(course.title).toBe('');
      expect(course.description).toBe('');
      expect(course.imageUrl).toBe('');
      expect(course.tags).toEqual([]);
      expect(course.prerequisiteCourseId).toBeNull();
      expect(course.trackSlug).toBe('');
      expect(course.trackId).toBe(0);
      expect(course.difficulty).toBe(0);
      expect(course.lessonCount).toBe(0);
      expect(course.totalXp).toBe(0);
    });

    it('calls Sanity client with the correct query', async () => {
      mockFetch.mockResolvedValueOnce([]);

      await useCourseStore.getState().fetchCourses();

      expect(mockFetch).toHaveBeenCalledWith('MOCK_ALL_COURSES_QUERY');
    });
  });

  // -------------------------------------------------------------------------
  // getFilteredCourses — no filters
  // -------------------------------------------------------------------------

  describe('getFilteredCourses', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce(makeSanityCourses());
      await useCourseStore.getState().fetchCourses();
    });

    it('returns all courses when no filters are active', () => {
      const result = useCourseStore.getState().getFilteredCourses();
      expect(result).toHaveLength(3);
    });

    // -----------------------------------------------------------------------
    // Filter by track
    // -----------------------------------------------------------------------

    it('filters by track slug', () => {
      useCourseStore.getState().setFilter('track', 'solana-core');
      const result = useCourseStore.getState().getFilteredCourses();

      expect(result).toHaveLength(2);
      expect(result.every((c) => c.trackSlug === 'solana-core')).toBe(true);
    });

    it('returns empty when track matches no courses', () => {
      useCourseStore.getState().setFilter('track', 'nft-art');
      const result = useCourseStore.getState().getFilteredCourses();
      expect(result).toHaveLength(0);
    });

    // -----------------------------------------------------------------------
    // Filter by difficulty
    // -----------------------------------------------------------------------

    it('filters by difficulty (beginner)', () => {
      useCourseStore.getState().setFilter('difficulty', 'beginner');
      const result = useCourseStore.getState().getFilteredCourses();

      expect(result).toHaveLength(1);
      expect(result[0]!.courseId).toBe('solana-101');
    });

    it('filters by difficulty (intermediate)', () => {
      useCourseStore.getState().setFilter('difficulty', 'intermediate');
      const result = useCourseStore.getState().getFilteredCourses();

      expect(result).toHaveLength(1);
      expect(result[0]!.courseId).toBe('anchor-102');
    });

    it('filters by difficulty (advanced)', () => {
      useCourseStore.getState().setFilter('difficulty', 'advanced');
      const result = useCourseStore.getState().getFilteredCourses();

      expect(result).toHaveLength(1);
      expect(result[0]!.courseId).toBe('defi-201');
    });

    // -----------------------------------------------------------------------
    // Filter by duration
    // -----------------------------------------------------------------------

    it('filters by short duration (< 2 hours)', () => {
      // solana-101: 10 lessons * 15min = 2.5h → rounds to 3h
      // defi-201: 8 lessons * 15min = 2h → rounds to 2h
      // anchor-102: 12 lessons * 15min = 3h → rounds to 3h
      // All are >= 2h, so 'short' (<2h) should return 0
      useCourseStore.getState().setFilter('duration', 'short');
      const result = useCourseStore.getState().getFilteredCourses();
      expect(result).toHaveLength(0);
    });

    it('filters by medium duration (2–5 hours)', () => {
      useCourseStore.getState().setFilter('duration', 'medium');
      const result = useCourseStore.getState().getFilteredCourses();
      // All test courses are 2-3h, so all should match
      expect(result).toHaveLength(3);
    });

    it('filters by long duration (5+ hours)', () => {
      useCourseStore.getState().setFilter('duration', 'long');
      const result = useCourseStore.getState().getFilteredCourses();
      expect(result).toHaveLength(0);
    });

    // -----------------------------------------------------------------------
    // Filter by search query
    // -----------------------------------------------------------------------

    it('filters by search query matching title', () => {
      useCourseStore.getState().setFilter('searchQuery', 'Anchor');
      const result = useCourseStore.getState().getFilteredCourses();

      expect(result).toHaveLength(1);
      expect(result[0]!.courseId).toBe('anchor-102');
    });

    it('filters by search query matching description', () => {
      useCourseStore.getState().setFilter('searchQuery', 'protocols');
      const result = useCourseStore.getState().getFilteredCourses();

      expect(result).toHaveLength(1);
      expect(result[0]!.courseId).toBe('defi-201');
    });

    it('filters by search query matching tags', () => {
      useCourseStore.getState().setFilter('searchQuery', 'lending');
      const result = useCourseStore.getState().getFilteredCourses();

      expect(result).toHaveLength(1);
      expect(result[0]!.courseId).toBe('defi-201');
    });

    it('search query is case-insensitive', () => {
      useCourseStore.getState().setFilter('searchQuery', 'SOLANA');
      const result = useCourseStore.getState().getFilteredCourses();

      // "Solana 101" (title), "Anchor Framework" has "solana" tag, "DeFi Deep Dive" has "solana" in description
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('trims whitespace from search query', () => {
      useCourseStore.getState().setFilter('searchQuery', '  Anchor  ');
      const result = useCourseStore.getState().getFilteredCourses();

      expect(result).toHaveLength(1);
      expect(result[0]!.courseId).toBe('anchor-102');
    });

    // -----------------------------------------------------------------------
    // Sort
    // -----------------------------------------------------------------------

    it('sorts by title alphabetically', () => {
      useCourseStore.getState().setFilter('sortBy', 'title');
      const result = useCourseStore.getState().getFilteredCourses();
      const titles = result.map((c) => c.title);

      expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    });

    it('sorts by difficulty ascending', () => {
      useCourseStore.getState().setFilter('sortBy', 'difficulty');
      const result = useCourseStore.getState().getFilteredCourses();
      const difficulties = result.map((c) => c.difficulty);

      for (let i = 1; i < difficulties.length; i++) {
        expect(difficulties[i]!).toBeGreaterThanOrEqual(difficulties[i - 1]!);
      }
    });

    it('sorts by popular (enrollmentCount descending)', () => {
      // Set custom enrollment counts
      const courses = useCourseStore.getState().courses.map((c, i) => ({
        ...c,
        enrollmentCount: (i + 1) * 100,
      }));
      useCourseStore.setState({ courses });

      useCourseStore.getState().setFilter('sortBy', 'popular');
      const result = useCourseStore.getState().getFilteredCourses();
      const counts = result.map((c) => c.enrollmentCount);

      for (let i = 1; i < counts.length; i++) {
        expect(counts[i]!).toBeLessThanOrEqual(counts[i - 1]!);
      }
    });

    // -----------------------------------------------------------------------
    // Combined filters
    // -----------------------------------------------------------------------

    it('combines track + difficulty filters', () => {
      useCourseStore.getState().setFilter('track', 'solana-core');
      useCourseStore.getState().setFilter('difficulty', 'intermediate');
      const result = useCourseStore.getState().getFilteredCourses();

      expect(result).toHaveLength(1);
      expect(result[0]!.courseId).toBe('anchor-102');
    });

    it('combines track + search + sort filters', () => {
      useCourseStore.getState().setFilter('track', 'solana-core');
      useCourseStore.getState().setFilter('searchQuery', 'solana');
      useCourseStore.getState().setFilter('sortBy', 'title');
      const result = useCourseStore.getState().getFilteredCourses();

      // solana-core track has "Solana 101" (title match) and
      // "Anchor Framework" (tag match for "solana")
      expect(result.length).toBeGreaterThanOrEqual(1);
      // Verify sort order (titles should be alphabetical)
      for (let i = 1; i < result.length; i++) {
        expect(result[i]!.title.localeCompare(result[i - 1]!.title)).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns empty array when combined filters match nothing', () => {
      useCourseStore.getState().setFilter('track', 'defi');
      useCourseStore.getState().setFilter('difficulty', 'beginner');
      const result = useCourseStore.getState().getFilteredCourses();

      expect(result).toHaveLength(0);
    });

    // -----------------------------------------------------------------------
    // getFilteredCourses does not mutate state
    // -----------------------------------------------------------------------

    it('does not mutate the courses array in state', () => {
      const coursesBefore = useCourseStore.getState().courses;
      useCourseStore.getState().setFilter('sortBy', 'title');
      useCourseStore.getState().getFilteredCourses();
      const coursesAfter = useCourseStore.getState().courses;

      expect(coursesBefore).toBe(coursesAfter);
    });
  });

  // -------------------------------------------------------------------------
  // Computed field correctness
  // -------------------------------------------------------------------------

  describe('computed fields', () => {
    it('calculates totalXp as lessonCount * xpPerLesson', async () => {
      mockFetch.mockResolvedValueOnce([
        makeSanityCourse({ lessonCount: 20, xpPerLesson: 50 }),
      ]);

      await useCourseStore.getState().fetchCourses();

      expect(useCourseStore.getState().courses[0]!.totalXp).toBe(1000);
    });

    it('calculates estimatedHours from lessonCount', async () => {
      mockFetch.mockResolvedValueOnce([
        makeSanityCourse({ lessonCount: 24 }),
      ]);

      await useCourseStore.getState().fetchCourses();

      // 24 lessons * 15 min = 360 min = 6 hours
      expect(useCourseStore.getState().courses[0]!.estimatedHours).toBe(6);
    });

    it('ensures estimatedHours is at least 1', async () => {
      mockFetch.mockResolvedValueOnce([
        makeSanityCourse({ lessonCount: 1 }),
      ]);

      await useCourseStore.getState().fetchCourses();

      // 1 lesson * 15 min = 15 min = 0.25 hours, rounds to 0, clamped to 1
      expect(useCourseStore.getState().courses[0]!.estimatedHours).toBeGreaterThanOrEqual(1);
    });

    it('maps prerequisite courseId from Sanity prerequisites array', async () => {
      mockFetch.mockResolvedValueOnce([
        makeSanityCourse({ prerequisites: ['solana-101', 'solana-102'] }),
      ]);

      await useCourseStore.getState().fetchCourses();

      // Takes the first prerequisite
      expect(useCourseStore.getState().courses[0]!.prerequisiteCourseId).toBe('solana-101');
    });
  });
});
