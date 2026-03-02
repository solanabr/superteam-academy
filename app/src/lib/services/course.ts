import type { CourseData } from "./types";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ICourseService {
  getCourses(): Promise<CourseData[]>;
  getCourse(courseId: string): Promise<CourseData | null>;
  getCoursesByTrack(trackId: number): Promise<CourseData[]>;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_COURSES: CourseData[] = [
  {
    courseId: "solana-101",
    creator: "CREAToR1111111111111111111111111111111111111",
    lessonCount: 8,
    difficulty: 1,
    xpPerLesson: 100,
    trackId: 1,
    trackLevel: 1,
    prerequisite: null,
    isActive: true,
    totalCompletions: 342,
    totalEnrollments: 891,
    createdAt: 1706745600000,
  },
  {
    courseId: "anchor-fundamentals",
    creator: "CREAToR2222222222222222222222222222222222222",
    lessonCount: 10,
    difficulty: 2,
    xpPerLesson: 150,
    trackId: 1,
    trackLevel: 2,
    prerequisite: "solana-101",
    isActive: true,
    totalCompletions: 187,
    totalEnrollments: 503,
    createdAt: 1709424000000,
  },
  {
    courseId: "token-2022-deep-dive",
    creator: "CREAToR3333333333333333333333333333333333333",
    lessonCount: 12,
    difficulty: 3,
    xpPerLesson: 200,
    trackId: 1,
    trackLevel: 3,
    prerequisite: "anchor-fundamentals",
    isActive: true,
    totalCompletions: 54,
    totalEnrollments: 210,
    createdAt: 1712102400000,
  },
  {
    courseId: "defi-basics",
    creator: "CREAToR4444444444444444444444444444444444444",
    lessonCount: 9,
    difficulty: 2,
    xpPerLesson: 125,
    trackId: 2,
    trackLevel: 1,
    prerequisite: null,
    isActive: true,
    totalCompletions: 221,
    totalEnrollments: 617,
    createdAt: 1714780800000,
  },
  {
    courseId: "nft-masterclass",
    creator: "CREAToR5555555555555555555555555555555555555",
    lessonCount: 11,
    difficulty: 3,
    xpPerLesson: 175,
    trackId: 3,
    trackLevel: 1,
    prerequisite: null,
    isActive: true,
    totalCompletions: 98,
    totalEnrollments: 304,
    createdAt: 1717459200000,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(300 + Math.random() * 500);
}

// ---------------------------------------------------------------------------
// Stub implementation
// ---------------------------------------------------------------------------

export class StubCourseService implements ICourseService {
  async getCourses(): Promise<CourseData[]> {
    await randomDelay();
    return MOCK_COURSES.filter((c) => c.isActive);
  }

  async getCourse(courseId: string): Promise<CourseData | null> {
    await randomDelay();
    return MOCK_COURSES.find((c) => c.courseId === courseId) ?? null;
  }

  async getCoursesByTrack(trackId: number): Promise<CourseData[]> {
    await randomDelay();
    return MOCK_COURSES.filter((c) => c.trackId === trackId && c.isActive).sort(
      (a, b) => a.trackLevel - b.trackLevel
    );
  }
}
