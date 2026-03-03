/**
 * CMS Service Abstraction
 *
 * Provides a clean interface for fetching course content.
 * The current implementation uses static data from courses.ts.
 * To connect Sanity, swap StaticCmsService → SanityCmsService.
 */

import { CourseData, LessonData, STATIC_COURSES, getCourseBySlug, getCourseById } from "./courses";

// ─── CMS Interfaces ─────────────────────────────────────────────────────────

export interface ICmsService {
    /** Fetch all published courses */
    getAllCourses(): Promise<CourseData[]>;
    /** Fetch a single course by slug */
    getCourseBySlug(slug: string): Promise<CourseData | null>;
    /** Fetch a single course by ID */
    getCourseById(id: string): Promise<CourseData | null>;
    /** Fetch lessons for a course */
    getLessonsForCourse(courseId: string): Promise<LessonData[]>;
    /** Search courses by text query */
    searchCourses(query: string): Promise<CourseData[]>;
}

// ─── Static Implementation (uses courses.ts) ────────────────────────────────

export class StaticCmsService implements ICmsService {
    async getAllCourses(): Promise<CourseData[]> {
        return STATIC_COURSES;
    }

    async getCourseBySlug(slug: string): Promise<CourseData | null> {
        return getCourseBySlug(slug) ?? null;
    }

    async getCourseById(id: string): Promise<CourseData | null> {
        return getCourseById(id) ?? null;
    }

    async getLessonsForCourse(courseId: string): Promise<LessonData[]> {
        const course = getCourseById(courseId) ?? getCourseBySlug(courseId);
        return course?.lessons ?? [];
    }

    async searchCourses(query: string): Promise<CourseData[]> {
        const q = query.toLowerCase();
        return STATIC_COURSES.filter(
            (c) =>
                c.title.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.track.toLowerCase().includes(q)
        );
    }
}

// ─── Sanity CMS Implementation (ready to connect) ──────────────────────────

/**
 * To use Sanity CMS:
 *
 * 1. Install: npm i @sanity/client next-sanity
 * 2. Set env vars: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
 * 3. Uncomment and implement SanityCmsService below
 * 4. Update the singleton export at the bottom of this file
 *
 * Sanity Schema (define in your Sanity Studio):
 *
 * // schemas/course.ts
 * export default {
 *   name: 'course',
 *   title: 'Course',
 *   type: 'document',
 *   fields: [
 *     { name: 'title', title: 'Title', type: 'string' },
 *     { name: 'titlePt', title: 'Title (PT-BR)', type: 'string' },
 *     { name: 'titleEs', title: 'Title (ES)', type: 'string' },
 *     { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
 *     { name: 'description', title: 'Description', type: 'text' },
 *     { name: 'descriptionPt', title: 'Description (PT-BR)', type: 'text' },
 *     { name: 'track', title: 'Track', type: 'string', options: {
 *       list: ['anchor', 'defi', 'nft', 'core']
 *     }},
 *     { name: 'level', title: 'Level', type: 'string', options: {
 *       list: ['beginner', 'intermediate', 'advanced']
 *     }},
 *     { name: 'thumbnail', title: 'Thumbnail', type: 'image' },
 *     { name: 'instructor', title: 'Instructor', type: 'string' },
 *     { name: 'duration', title: 'Duration', type: 'string' },
 *     { name: 'xpPerLesson', title: 'XP per Lesson', type: 'number' },
 *     { name: 'completionBonus', title: 'Completion Bonus XP', type: 'number' },
 *     { name: 'isActive', title: 'Is Active', type: 'boolean' },
 *     { name: 'modules', title: 'Modules', type: 'array', of: [
 *       { type: 'reference', to: [{ type: 'module' }] }
 *     ]},
 *   ]
 * }
 *
 * // schemas/module.ts
 * export default {
 *   name: 'module',
 *   title: 'Module',
 *   type: 'document',
 *   fields: [
 *     { name: 'title', title: 'Title', type: 'string' },
 *     { name: 'order', title: 'Order', type: 'number' },
 *     { name: 'lessons', title: 'Lessons', type: 'array', of: [
 *       { type: 'reference', to: [{ type: 'lesson' }] }
 *     ]},
 *   ]
 * }
 *
 * // schemas/lesson.ts
 * export default {
 *   name: 'lesson',
 *   title: 'Lesson',
 *   type: 'document',
 *   fields: [
 *     { name: 'title', title: 'Title', type: 'string' },
 *     { name: 'type', title: 'Type', type: 'string', options: {
 *       list: ['content', 'challenge']
 *     }},
 *     { name: 'content', title: 'Content', type: 'array', of: [
 *       { type: 'block' },
 *       { type: 'code', options: { withFilename: true } },
 *       { type: 'image' },
 *     ]},
 *     { name: 'codeChallenge', title: 'Code Challenge', type: 'object', fields: [
 *       { name: 'prompt', title: 'Prompt', type: 'text' },
 *       { name: 'starterCode', title: 'Starter Code', type: 'text' },
 *       { name: 'language', title: 'Language', type: 'string',
 *         options: { list: ['typescript', 'rust'] }
 *       },
 *       { name: 'testCases', title: 'Test Cases', type: 'array', of: [
 *         { type: 'object', fields: [
 *           { name: 'input', type: 'string' },
 *           { name: 'expected', type: 'string' },
 *           { name: 'description', type: 'string' },
 *         ]}
 *       ]},
 *     ]},
 *   ]
 * }
 */

// export class SanityCmsService implements ICmsService {
//     private client;
//
//     constructor() {
//         const { createClient } = require("@sanity/client");
//         this.client = createClient({
//             projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
//             dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
//             apiVersion: "2024-01-01",
//             useCdn: true,
//         });
//     }
//
//     async getAllCourses() { /* GROQ query */ }
//     async getCourseBySlug(slug: string) { /* GROQ query */ }
//     async getCourseById(id: string) { /* GROQ query */ }
//     async getLessonsForCourse(courseId: string) { /* GROQ query */ }
//     async searchCourses(query: string) { /* GROQ query */ }
// }

// ─── Singleton ───────────────────────────────────────────────────────────────

// Use this across the application. To connect Sanity CMS,
// replace with: new SanityCmsService()
export const cmsService: ICmsService = new StaticCmsService();
