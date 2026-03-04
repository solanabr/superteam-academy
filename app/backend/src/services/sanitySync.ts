import { Course } from "../models/courses";
import { fetchAllCoursesFromSanity } from "./sanityClient";

// ─── Types for Sanity response ────────────────────────────────────────────────

interface SanityOption {
    label: string;
    isCorrect: boolean;
}

interface SanityQuestion {
    _key: string;
    question: string;
    explanation?: string;
    options: SanityOption[];
}

interface SanityTestCase {
    input: string;
    expectedOutput: string;
    description: string;
}

interface SanityTest {
    _id: string;
    _type: "quiz" | "codeChallenge";
    title: string;
    passThreshold: number;
    points: number;
    // Quiz fields
    questions?: SanityQuestion[];
    // Code challenge fields
    prompt?: string;
    starterCode?: string;
    language?: "typescript" | "rust" | "javascript";
    testCases?: SanityTestCase[];
}

interface SanityLesson {
    _id: string;
    title: string;
    type: "video" | "document" | "text";
    order: number;
    duration?: number;
    url?: string;
    content?: any; // Portable Text (blockContent)
}

interface SanityMilestone {
    _id: string;
    title: string;
    description?: string;
    order: number;
    xpReward: number;
    lessons: SanityLesson[];
    tests: SanityTest[];
}

interface SanityCourse {
    _id: string;
    slug: string;
    title: string;
    description: string;
    shortDescription: string;
    thumbnail?: string;
    tags?: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    topic: string;
    status?: string;
    totalXP?: number;
    duration?: number;
    milestones: SanityMilestone[];
    author: {
        name: string;
        avatar?: string;
        title?: string;
    };
}

// ─── Transform Helpers ────────────────────────────────────────────────────────

/**
 * Convert Portable Text (Sanity block content) to plain markdown-ish string.
 * This is a simple extraction — for full fidelity you'd use @portabletext/to-markdown.
 */
function portableTextToString(blocks: any): string {
    if (!blocks) return "";
    if (typeof blocks === "string") return blocks;
    if (!Array.isArray(blocks)) return "";

    return blocks
        .map((block: any) => {
            if (block._type === "block" && block.children) {
                return block.children.map((child: any) => child.text || "").join("");
            }
            return "";
        })
        .filter(Boolean)
        .join("\n\n");
}

/**
 * Transform a Sanity test (quiz or codeChallenge) into the backend ITest format.
 */
function transformTest(sanityTest: SanityTest) {
    const base = {
        title: sanityTest.title,
        passThreshold: sanityTest.passThreshold ?? 80,
        points: sanityTest.points ?? 100,
    };

    if (sanityTest._type === "quiz" && sanityTest.questions) {
        return {
            ...base,
            type: "quiz" as const,
            questions: sanityTest.questions.map((q) => ({
                question: q.question,
                explanation: q.explanation,
                options: (q.options || []).map((opt) => ({
                    label: opt.label,
                    isCorrect: opt.isCorrect ?? false,
                })),
            })),
        };
    }

    if (sanityTest._type === "codeChallenge") {
        return {
            ...base,
            type: "code_challenge" as const,
            codeChallenge: {
                prompt: sanityTest.prompt || "",
                starterCode: sanityTest.starterCode || "",
                language: sanityTest.language || "typescript",
                testCases: (sanityTest.testCases || []).map((tc) => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    description: tc.description,
                })),
            },
        };
    }

    // Fallback — shouldn't happen
    return { ...base, type: "quiz" as const, questions: [] };
}

/**
 * Transform a Sanity lesson into the backend ILesson format.
 */
function transformLesson(sanityLesson: SanityLesson) {
    return {
        title: sanityLesson.title,
        type: sanityLesson.type,
        order: sanityLesson.order ?? 1,
        duration: sanityLesson.duration ?? 8,
        url: sanityLesson.url,
        content:
            sanityLesson.type === "text"
                ? portableTextToString(sanityLesson.content)
                : undefined,
    };
}

/**
 * Transform a single Sanity course document into the Mongoose Course format
 * and upsert it into MongoDB.
 */
function transformCourseForMongo(sanityCourse: SanityCourse) {
    return {
        sanityId: sanityCourse._id,
        title: sanityCourse.title,
        slug: sanityCourse.slug,
        description: sanityCourse.description,
        shortDescription: sanityCourse.shortDescription,
        thumbnail: sanityCourse.thumbnail || "",
        tags: sanityCourse.tags || [],
        difficulty: sanityCourse.difficulty,
        topic: sanityCourse.topic,
        status: sanityCourse.status || "draft",
        author: {
            name: sanityCourse.author?.name || "Unknown",
            avatar: sanityCourse.author?.avatar,
            title: sanityCourse.author?.title,
        },
        milestones: (sanityCourse.milestones || []).map((milestone, index) => ({
            title: milestone.title,
            description: milestone.description || "",
            order: milestone.order ?? index + 1,
            xpReward: milestone.xpReward ?? 100,
            lessons: (milestone.lessons || []).map(transformLesson),
            tests: (milestone.tests || []).map(transformTest),
        })),
    };
}

// ─── Sync Function ────────────────────────────────────────────────────────────

export interface SyncResult {
    created: string[];
    updated: string[];
    errors: { slug: string; error: string }[];
}

/**
 * Fetch all courses from Sanity and upsert them into MongoDB.
 * Uses `sanityId` as the unique key for matching.
 */
export async function syncAllCoursesFromSanity(): Promise<SyncResult> {
    const sanityCourses: SanityCourse[] = await fetchAllCoursesFromSanity();

    const result: SyncResult = {
        created: [],
        updated: [],
        errors: [],
    };

    for (const sanityCourse of sanityCourses) {
        try {
            if (!sanityCourse.slug) {
                result.errors.push({
                    slug: sanityCourse.title || sanityCourse._id,
                    error: "Course has no slug",
                });
                continue;
            }

            if (
                !sanityCourse.milestones ||
                sanityCourse.milestones.length === 0
            ) {
                result.errors.push({
                    slug: sanityCourse.slug,
                    error: "Course has no milestones",
                });
                continue;
            }

            const mongoData = transformCourseForMongo(sanityCourse);

            // Check if course already exists by sanityId
            const existing = await Course.findOne({ sanityId: sanityCourse._id });

            if (existing) {
                // Update existing course
                Object.assign(existing, mongoData);
                await existing.save(); // triggers pre-save hook for totalXP/duration
                result.updated.push(sanityCourse.slug);
            } else {
                // Also check by slug in case it was created manually
                const existingBySlug = await Course.findOne({ slug: sanityCourse.slug });
                if (existingBySlug) {
                    // Link existing course to Sanity and update
                    Object.assign(existingBySlug, mongoData);
                    await existingBySlug.save();
                    result.updated.push(sanityCourse.slug);
                } else {
                    // Create new course
                    await Course.create(mongoData);
                    result.created.push(sanityCourse.slug);
                }
            }
        } catch (error: any) {
            result.errors.push({
                slug: sanityCourse.slug || sanityCourse._id,
                error: error.message || "Unknown error",
            });
        }
    }

    return result;
}
