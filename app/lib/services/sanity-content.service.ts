import { Course, Lesson } from "../types";
import { IContentService } from "./interfaces";
import { client } from "@/sanity/lib/client";
import { COURSES_QUERY, COURSE_BY_SLUG_QUERY } from "@/sanity/lib/queries";

/**
 * Production Content Service backed by Sanity CMS.
 * Replaces LocalContentService — all courses come from Sanity, no mock data.
 */
export class SanityContentService implements IContentService {
    async getCourses(): Promise<Course[]> {
        const raw = await client.fetch(COURSES_QUERY);

        if (!raw || !Array.isArray(raw)) return [];

        return raw.map(normalizeCourse);
    }

    async getCourseBySlug(slug: string): Promise<Course | null> {
        const raw = await client.fetch(COURSE_BY_SLUG_QUERY, { slug });

        if (!raw) return null;

        return normalizeCourse(raw);
    }

    async getLesson(courseSlug: string, lessonId: string): Promise<Lesson | null> {
        const course = await this.getCourseBySlug(courseSlug);
        if (!course) return null;

        for (const mod of course.modules) {
            const lesson = mod.lessons.find((l) => l.id === lessonId);
            if (lesson) return lesson;
        }

        return null;
    }
}

// ============================================
// Normalization helpers
// ============================================

/**
 * Normalizes a raw Sanity course document into the app's Course type.
 * Fills in sensible defaults for any missing optional fields.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCourse(raw: any): Course {
    return {
        id: raw.id ?? "",
        slug: raw.slug ?? "",
        title: raw.title ?? "",
        description: raw.description ?? "",
        shortDescription: raw.shortDescription ?? "",
        difficulty: raw.difficulty ?? "beginner",
        track: raw.track ?? "",
        duration: raw.duration ?? "0h",
        lessonCount: raw.lessonCount ?? 0,
        xpReward: raw.xpReward ?? 0,
        enrolled: 0,  // Real enrollment count comes from on-chain later
        rating: 0,    // Reviews system not yet built
        tags: raw.tags ?? [],
        outcomes: raw.outcomes ?? [],
        prerequisites: raw.prerequisites ?? [],
        instructor: raw.instructor
            ? {
                name: raw.instructor.name ?? "",
                avatar: raw.instructor.avatar ?? "",
                title: raw.instructor.title ?? "",
                bio: raw.instructor.bio ?? "",
            }
            : { name: "", avatar: "", title: "", bio: "" },
        reviews: [],   // Reviews come from a separate system
        modules: (raw.modules ?? []).map(normalizeModule),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeModule(raw: any) {
    return {
        id: raw.id ?? "",
        title: raw.title ?? "",
        description: raw.description ?? "",
        lessons: (raw.lessons ?? []).map(normalizeLesson),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLesson(raw: any): Lesson {
    return {
        id: raw.id ?? "",
        title: raw.title ?? "",
        type: raw.type ?? "reading",
        duration: raw.duration ?? "0min",
        xp: raw.xp ?? 0,
        content: raw.content ?? undefined,
        // Code Challenge fields
        language: raw.language ?? undefined,
        initialCode: raw.initialCode ?? undefined,
        solutionCode: raw.solutionCode ?? undefined,
        testCases: raw.testCases ?? undefined,
        hints: raw.hints ?? undefined,
        // Interactive Quiz
        quiz: raw.quiz ?? undefined,
    };
}

// Export a singleton instance — drop-in replacement for localContentService
export const contentService = new SanityContentService();
