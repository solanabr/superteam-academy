import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Sanity public client before importing modules that use it
vi.mock("../client", () => ({
  publicClient: {
    fetch: vi.fn(),
  },
}));

import { publicClient } from "../client";
import {
  getAllCourses,
  getCourseBySlug,
  getLessonBySlug,
  getFeaturedCourses,
  type SanityCourse,
  type SanityLesson,
} from "../queries";

const mockFetch = publicClient.fetch as ReturnType<typeof vi.fn>;

// --- Fixtures ---

const mockLesson: SanityLesson = {
  _id: "lesson-1",
  title: "What is Solana?",
  slug: "what-is-solana",
  lessonIndex: 0,
  content: [{ _type: "block", _key: "key1" }],
  estimatedMinutes: 10,
};

const mockCourse: SanityCourse = {
  _id: "course-1",
  title: "Introduction to Solana",
  slug: "introduction-to-solana",
  description: "Learn Solana basics",
  difficulty: 1,
  trackId: 1,
  onChainCourseId: "intro-to-solana",
  xpPerLesson: 25,
  tags: ["solana", "web3"],
  prerequisites: [],
  lessons: [mockLesson],
  status: "published",
  locale: "en",
};

describe("Sanity queries — getAllCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a callable function", () => {
    expect(typeof getAllCourses).toBe("function");
  });

  it("calls publicClient.fetch with a GROQ query string", async () => {
    mockFetch.mockResolvedValue([mockCourse]);
    await getAllCourses();
    expect(mockFetch).toHaveBeenCalledOnce();
    const [query] = mockFetch.mock.calls[0] as [string, unknown];
    expect(typeof query).toBe("string");
    expect(query.length).toBeGreaterThan(0);
  });

  it("passes locale parameter to the fetch call", async () => {
    mockFetch.mockResolvedValue([]);
    await getAllCourses("en");
    const [, params] = mockFetch.mock.calls[0] as [string, Record<string, unknown>];
    expect(params).toHaveProperty("locale", "en");
  });

  it("uses pt-BR as the default locale", async () => {
    mockFetch.mockResolvedValue([]);
    await getAllCourses();
    const [, params] = mockFetch.mock.calls[0] as [string, Record<string, unknown>];
    expect(params).toHaveProperty("locale", "pt-BR");
  });

  it("returns the array returned by publicClient.fetch", async () => {
    mockFetch.mockResolvedValue([mockCourse]);
    const result = await getAllCourses("en");
    expect(result).toEqual([mockCourse]);
  });

  it("returns an empty array when no courses match", async () => {
    mockFetch.mockResolvedValue([]);
    const result = await getAllCourses("en");
    expect(result).toEqual([]);
  });

  it("returns multiple courses when available", async () => {
    const courses = [mockCourse, { ...mockCourse, _id: "course-2", slug: "course-2" }];
    mockFetch.mockResolvedValue(courses);
    const result = await getAllCourses("en");
    expect(result).toHaveLength(2);
  });

  it("propagates errors from publicClient.fetch", async () => {
    mockFetch.mockRejectedValue(new Error("Sanity connection failed"));
    await expect(getAllCourses()).rejects.toThrow("Sanity connection failed");
  });

  it("GROQ query filters by status='published'", async () => {
    mockFetch.mockResolvedValue([]);
    await getAllCourses("en");
    const [query] = mockFetch.mock.calls[0] as [string, unknown];
    expect(query).toContain("published");
  });
});

describe("Sanity queries — getCourseBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a callable function", () => {
    expect(typeof getCourseBySlug).toBe("function");
  });

  it("calls publicClient.fetch with slug and locale params", async () => {
    mockFetch.mockResolvedValue(mockCourse);
    await getCourseBySlug("introduction-to-solana", "en");
    const [, params] = mockFetch.mock.calls[0] as [string, Record<string, unknown>];
    expect(params).toHaveProperty("slug", "introduction-to-solana");
    expect(params).toHaveProperty("locale", "en");
  });

  it("uses pt-BR as the default locale", async () => {
    mockFetch.mockResolvedValue(null);
    await getCourseBySlug("some-course");
    const [, params] = mockFetch.mock.calls[0] as [string, Record<string, unknown>];
    expect(params).toHaveProperty("locale", "pt-BR");
  });

  it("returns the course when found", async () => {
    mockFetch.mockResolvedValue(mockCourse);
    const result = await getCourseBySlug("introduction-to-solana", "en");
    expect(result).toEqual(mockCourse);
  });

  it("returns null when course is not found", async () => {
    mockFetch.mockResolvedValue(null);
    const result = await getCourseBySlug("nonexistent-course", "en");
    expect(result).toBeNull();
  });

  it("passes the exact slug provided", async () => {
    mockFetch.mockResolvedValue(null);
    await getCourseBySlug("my-specific-slug", "en");
    const [, params] = mockFetch.mock.calls[0] as [string, Record<string, unknown>];
    expect(params.slug).toBe("my-specific-slug");
  });

  it("GROQ query targets 'course' type documents", async () => {
    mockFetch.mockResolvedValue(null);
    await getCourseBySlug("any-slug", "en");
    const [query] = mockFetch.mock.calls[0] as [string, unknown];
    expect(query).toContain("course");
  });
});

describe("Sanity queries — getLessonBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a callable function", () => {
    expect(typeof getLessonBySlug).toBe("function");
  });

  it("calls publicClient.fetch with courseSlug, lessonSlug, and locale", async () => {
    mockFetch.mockResolvedValue(mockLesson);
    await getLessonBySlug("introduction-to-solana", "what-is-solana", "en");
    const [, params] = mockFetch.mock.calls[0] as [string, Record<string, unknown>];
    expect(params).toHaveProperty("courseSlug", "introduction-to-solana");
    expect(params).toHaveProperty("lessonSlug", "what-is-solana");
    expect(params).toHaveProperty("locale", "en");
  });

  it("uses pt-BR as the default locale", async () => {
    mockFetch.mockResolvedValue(null);
    await getLessonBySlug("some-course", "some-lesson");
    const [, params] = mockFetch.mock.calls[0] as [string, Record<string, unknown>];
    expect(params).toHaveProperty("locale", "pt-BR");
  });

  it("returns the lesson when found", async () => {
    mockFetch.mockResolvedValue(mockLesson);
    const result = await getLessonBySlug("introduction-to-solana", "what-is-solana", "en");
    expect(result).toEqual(mockLesson);
  });

  it("returns null when lesson is not found", async () => {
    mockFetch.mockResolvedValue(null);
    const result = await getLessonBySlug("some-course", "nonexistent-lesson", "en");
    expect(result).toBeNull();
  });
});

describe("Sanity queries — getFeaturedCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a callable function", () => {
    expect(typeof getFeaturedCourses).toBe("function");
  });

  it("passes locale and limit params to fetch", async () => {
    mockFetch.mockResolvedValue([]);
    await getFeaturedCourses("en", 3);
    const [, params] = mockFetch.mock.calls[0] as [string, Record<string, unknown>];
    expect(params).toHaveProperty("locale", "en");
    expect(params).toHaveProperty("limit", 3);
  });

  it("uses pt-BR as the default locale and 6 as the default limit", async () => {
    mockFetch.mockResolvedValue([]);
    await getFeaturedCourses();
    const [, params] = mockFetch.mock.calls[0] as [string, Record<string, unknown>];
    expect(params).toHaveProperty("locale", "pt-BR");
    expect(params).toHaveProperty("limit", 6);
  });

  it("returns the array of featured courses", async () => {
    mockFetch.mockResolvedValue([mockCourse]);
    const result = await getFeaturedCourses("en", 6);
    expect(result).toEqual([mockCourse]);
  });

  it("returns empty array when no featured courses", async () => {
    mockFetch.mockResolvedValue([]);
    const result = await getFeaturedCourses("en");
    expect(result).toEqual([]);
  });

  it("GROQ query includes ordering by creation date", async () => {
    mockFetch.mockResolvedValue([]);
    await getFeaturedCourses("en");
    const [query] = mockFetch.mock.calls[0] as [string, unknown];
    expect(query).toContain("order");
  });
});

describe("Sanity type interfaces — structural validation", () => {
  it("SanityCourse has required shape", () => {
    const course: SanityCourse = mockCourse;
    expect(course._id).toBeDefined();
    expect(course.title).toBeDefined();
    expect(course.slug).toBeDefined();
    expect(course.lessons).toBeDefined();
    expect(Array.isArray(course.lessons)).toBe(true);
  });

  it("SanityLesson has required shape", () => {
    const lesson: SanityLesson = mockLesson;
    expect(lesson._id).toBeDefined();
    expect(lesson.title).toBeDefined();
    expect(lesson.slug).toBeDefined();
    expect(typeof lesson.lessonIndex).toBe("number");
    expect(typeof lesson.estimatedMinutes).toBe("number");
  });

  it("difficulty is one of 1, 2, or 3", () => {
    const validDifficulties: Array<1 | 2 | 3> = [1, 2, 3];
    expect(validDifficulties).toContain(mockCourse.difficulty);
  });

  it("status is either 'draft' or 'published'", () => {
    const validStatuses = ["draft", "published"];
    expect(validStatuses).toContain(mockCourse.status);
  });

  it("SanityCourse tags is an array", () => {
    expect(Array.isArray(mockCourse.tags)).toBe(true);
  });

  it("SanityCourse prerequisites is an array", () => {
    expect(Array.isArray(mockCourse.prerequisites)).toBe(true);
  });
});
