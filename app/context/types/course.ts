/**
 * Course-related type definitions for Superteam Academy frontend.
 *
 * These interfaces map to the on-chain Course account (PDA)
 * and extend it with off-chain content.
 *
 * Content sources:
 *   - On-chain: Course PDA (enrollment, XP, progress)
 *   - Sanity CMS: Course content, lessons, tracks (replaces Arweave)
 *   - Arweave: Credential/achievement metadata JSON (immutable)
 */

/** Difficulty levels matching on-chain enum (1-3) */
export type Difficulty = 1 | 2 | 3;

/** Human-readable difficulty labels */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced',
};

/** Difficulty color classes for UI badges — distinct colors for light & dark mode */
export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
    1: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500',
    2: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500',
    3: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500',
};

/**
 * On-chain Course account data (deserialized from PDA).
 * Seeds: ["course", course_id]
 */
export interface Course {
    courseId: string;
    coursePda: string;
    creator: string;
    /** Legacy — zeroed out for Sanity-managed courses */
    contentTxId: number[];
    version: number;
    lessonCount: number;
    difficulty: Difficulty;
    xpPerLesson: number;
    trackId: number;
    trackLevel: number;
    prerequisite: string | null;
    creatorRewardXp: number;
    minCompletionsForReward: number;
    totalCompletions: number;
    totalEnrollments: number;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
    bump: number;
}

/**
 * Course with off-chain content from Arweave.
 * @deprecated Use SanityCourse for CMS-managed content. Kept for backward compatibility.
 */
export interface CourseWithDetails extends Course {
    title: string;
    description: string;
    thumbnail: string;
    lessons: Lesson[];
    creatorName?: string;
}

/** Lesson metadata from Arweave content */
export interface Lesson {
    index: number;
    title: string;
    contentTxId: string;
    duration: number;
    quiz?: Quiz;
    /** Lesson type — 'content' (reading/video), 'challenge' (coding), or 'video' */
    type?: 'content' | 'challenge' | 'video';
    /** Challenge data from Sanity CMS */
    challenge?: SanityChallenge;
    /** Progressive hints for the lesson */
    hints?: string[];
}

/** Quiz attached to a lesson */
export interface Quiz {
    questions: QuizQuestion[];
    passThreshold: number;
}

/** Individual quiz question */
export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
}

/** Track filter option for course catalog */
export interface Track {
    id: number;
    name: string;
    description: string;
    color: string;
    icon: string;
}

// ─── Difficulty Mapping ─────────────────────────────────────────────────────

/** Map Sanity difficulty string to on-chain numeric difficulty */
export function sanityDifficultyToOnChain(d: 'easy' | 'medium' | 'hard'): Difficulty {
    const map: Record<string, Difficulty> = { easy: 1, medium: 2, hard: 3 };
    return map[d] ?? 1;
}

/** Map on-chain numeric difficulty to Sanity string */
export function onChainDifficultyToSanity(d: Difficulty): 'easy' | 'medium' | 'hard' {
    const map: Record<Difficulty, 'easy' | 'medium' | 'hard'> = { 1: 'easy', 2: 'medium', 3: 'hard' };
    return map[d] ?? 'easy';
}

// ─── Sanity CMS Types ──────────────────────────────────────────────────────

/** Sanity image reference */
export interface SanityImage {
    _type: 'image';
    asset: {
        _ref: string;
        _type: 'reference';
    };
    hotspot?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/** Sanity code block */
export interface SanityCodeBlock {
    _type: 'code';
    language: string;
    code: string;
}

/** Course from Sanity CMS */
export interface SanityCourse {
    _id: string;
    _type: 'course';
    title: string;
    slug: { current: string };
    onChainCourseId: string;
    description: string;
    thumbnail: SanityImage | null;
    difficulty: 'easy' | 'medium' | 'hard';
    xpPerLesson: number;
    estimatedDuration: number;
    isPublished: boolean;
    publishedAt: string | null;
    tags: string[];
    instructor: SanityInstructor | null;
    track: SanityTrack | null;
    modules: SanityModule[];
}

/** Module from Sanity CMS */
export interface SanityModule {
    _id: string;
    _type: 'module';
    title: string;
    description: string;
    order: number;
    lessons: SanityLesson[];
}

/** Lesson from Sanity CMS */
export interface SanityLesson {
    _id: string;
    _type: 'lesson';
    title: string;
    slug: { current: string };
    type: 'content' | 'challenge' | 'video';
    order: number;
    duration: number;
    xpReward: number;
    content?: string;
    videoUrl?: string;
    videoFile?: {
        _type: 'file';
        asset: { _ref: string; _type: 'reference' };
    };
    challenge?: SanityChallenge;
    quiz?: SanityQuiz;
    hints?: string[];
}

/** Challenge data from Sanity CMS */
export interface SanityChallenge {
    language: string;
    instructions: string;
    starterCode: SanityCodeBlock;
    solutionCode: SanityCodeBlock;
    testCases: SanityTestCase[];
}

/** Test case for challenge lessons */
export interface SanityTestCase {
    name: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

/** Quiz from Sanity CMS */
export interface SanityQuiz {
    passThreshold: number;
    questions: SanityQuizQuestion[];
}

/** Quiz question from Sanity CMS */
export interface SanityQuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

/** Track from Sanity CMS */
export interface SanityTrack {
    _id: string;
    _type: 'track';
    name: string;
    slug: { current: string };
    onChainTrackId: number;
    description: string;
    icon: string;
    color: string;
}

/** Instructor from Sanity CMS */
export interface SanityInstructor {
    _id: string;
    _type: 'instructor';
    name: string;
    bio: string;
    avatar: SanityImage | null;
    walletAddress?: string;
    socialLinks?: {
        twitter?: string;
        github?: string;
        website?: string;
    };
}
