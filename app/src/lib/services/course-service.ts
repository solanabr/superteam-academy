import { mockCourses } from "@/lib/data/mock-courses";
import type { Course, Lesson } from "@/types";

/**
 * Content service interface — swap this implementation
 * to connect Sanity, Strapi, Contentful, or any headless CMS.
 *
 * The current implementation uses static mock data.
 * To integrate a CMS, create a new class implementing
 * this interface and replace the export below.
 */
export interface CourseService {
  getAllCourses(): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  getCourseById(id: string): Promise<Course | null>;
  searchCourses(query: string, difficulty?: Course["difficulty"]): Promise<Course[]>;
  getLessonContent(courseSlug: string, lessonId: string): Promise<Lesson | null>;
}

class LocalCourseService implements CourseService {
  async getAllCourses(): Promise<Course[]> {
    return mockCourses;
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    return mockCourses.find((course) => course.slug === slug) ?? null;
  }

  async getCourseById(id: string): Promise<Course | null> {
    return mockCourses.find((course) => course.id === id) ?? null;
  }

  async searchCourses(
    query: string,
    difficulty?: Course["difficulty"],
  ): Promise<Course[]> {
    const normalized = query.trim().toLowerCase();
    return mockCourses.filter((course) => {
      const matchesDifficulty = difficulty ? course.difficulty === difficulty : true;
      const matchesQuery =
        normalized.length === 0 ||
        course.title.toLowerCase().includes(normalized) ||
        course.tags.some((tag) => tag.toLowerCase().includes(normalized));
      return matchesDifficulty && matchesQuery;
    });
  }

  async getLessonContent(courseSlug: string, lessonId: string): Promise<Lesson | null> {
    const course = mockCourses.find((c) => c.slug === courseSlug);
    if (!course) return null;
    return (
      course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId) ??
      null
    );
  }
}

export const courseService: CourseService = new LocalCourseService();
