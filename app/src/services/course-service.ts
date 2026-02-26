import type { Course, SearchParams } from "@/types";

export interface CourseService {
  getCourses(params?: SearchParams): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  getCourseById(courseId: string): Promise<Course | null>;
  getFeaturedCourses(): Promise<Course[]>;
  getCoursesByTrack(trackId: number): Promise<Course[]>;
  searchCourses(query: string): Promise<Course[]>;
  getTotalCourseCount(): Promise<number>;
}
