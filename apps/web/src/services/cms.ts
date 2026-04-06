import type { Course, Lesson } from "@superteam-lms/types";
import { mockCourses } from "@/mock/courses";

/**
 * Service to fetch courses.
 * Currently using mock data since Sanity integration caused Next.js 14 build errors with rxjs.
 */
export class CMSService {
    static async getCourses(): Promise<Course[]> {
        return mockCourses;
    }

    static async getCourseBySlug(slug: string): Promise<Course | undefined> {
        return mockCourses.find((c) => c.slug === slug);
    }

    static async getLesson(courseSlug: string, lessonId: string): Promise<Lesson | undefined> {
        const course = await this.getCourseBySlug(courseSlug);
        if (!course) return undefined;

        for (const mod of course.modules) {
            const lesson = mod.lessons.find((l) => l._id === lessonId);
            if (lesson) return lesson;
        }
        return undefined;
    }
}
