import type { Course, Module, Lesson } from '@/types';

export interface ContentService {
  /** Get all published courses */
  getCourses(filters?: {
    difficulty?: Course['difficulty'];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ courses: Course[]; total: number }>;

  /** Get single course by slug */
  getCourseBySlug(slug: string): Promise<Course | null>;

  /** Get modules for a course */
  getModules(courseId: string): Promise<Module[]>;

  /** Get lessons for a module */
  getLessons(moduleId: string): Promise<Lesson[]>;

  /** Get single lesson */
  getLessonById(lessonId: string): Promise<Lesson | null>;

  /** Create course (professor/admin) */
  createCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course>;

  /** Update course (professor/admin) */
  updateCourse(courseId: string, data: Partial<Course>): Promise<Course>;

  /** Delete course (professor/admin) */
  deleteCourse(courseId: string): Promise<void>;

  /** Create module */
  createModule(data: Omit<Module, 'id' | 'createdAt'>): Promise<Module>;

  /** Create lesson */
  createLesson(data: Omit<Lesson, 'id' | 'createdAt'>): Promise<Lesson>;
}
