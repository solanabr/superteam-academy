/**
 * lib/services/course.ts  —  ESLint FIX
 * ──────────────────────────────────────────────────────────────
 * BUILD ERROR (line 71):
 *   @next/next/no-assign-module-variable
 *   "Do not assign to the variable `module`."
 *
 * ROOT CAUSE:
 *   You had a variable named `module` which conflicts with
 *   Node.js's built-in `module` object. Next.js treats this
 *   as an error at build time.
 *
 * FIX:
 *   Rename every occurrence of `module` (the variable, NOT the
 *   import keyword) to `courseModule`, `lessonModule`, or any
 *   name that doesn't shadow the Node global.
 *
 * EXAMPLE OF THE CHANGE (apply to your actual line 71):
 *
 *   BEFORE:
 *     let module = getCourseModuleById(id);
 *     return module.lessons;
 *
 *   AFTER:
 *     let courseModule = getCourseModuleById(id);
 *     return courseModule.lessons;
 *
 * ──────────────────────────────────────────────────────────────
 * Below is a complete, corrected example of how a course service
 * should be structured. Replace your existing file with this,
 * adjusting the data/logic to match what you already have.
 * ──────────────────────────────────────────────────────────────
 */

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  xpReward: number;
  order: number;
  type: "text" | "code" | "quiz";
}

export interface Course {
  totalLessons?: number;
  totalXp?: number;
  estimatedHours?: number;
  id: string;
  title: string;
  description: string;
  modules: CourseModule[]; // ← renamed from `module[]`
  level: "beginner" | "intermediate" | "advanced";
  durationHours: number;
  tags: string[];
}

// ─── Mock data ────────────────────────────────────────────────

const COURSES: Course[] = [
  {
    id: "solana-fundamentals",
    title: "Solana Fundamentals",
    description: "Understand the Solana blockchain inside out.",
    level: "beginner",
    durationHours: 14,
    tags: ["solana", "blockchain", "web3"],
    modules: [
      {
        id: "intro",
        title: "Introduction to Solana",
        description: "What is Solana and why it matters.",
        order: 1,
        lessons: [
          {
            id: "what-is-solana",
            title: "What is Solana?",
            content: "Solana is a high-performance blockchain...",
            xpReward: 50,
            order: 1,
            type: "text",
          },
          {
            id: "proof-of-history",
            title: "Proof of History",
            content: "PoH is a cryptographic clock that...",
            xpReward: 50,
            order: 2,
            type: "text",
          },
        ],
      },
      {
        id: "accounts",
        title: "Accounts & Programs",
        description: "Solana account model and program architecture.",
        order: 2,
        lessons: [
          {
            id: "account-model",
            title: "The Account Model",
            content: "Every piece of state in Solana lives in an account...",
            xpReward: 75,
            order: 1,
            type: "text",
          },
          {
            id: "write-first-program",
            title: "Your First Solana Program",
            content: "Let's write a hello-world Anchor program...",
            xpReward: 100,
            order: 2,
            type: "code",
          },
        ],
      },
    ],
  },
];

// ─── Service functions ────────────────────────────────────────

export function getAllCourses(): Course[] {
  return COURSES;
}

export function getCourseById(id: string): Course | null {
  return COURSES.find((c) => c.id === id) ?? null;
}

/**
 * KEY FIX: variable was named `module` — renamed to `courseModule`
 */
export function getModuleById(
  courseId: string,
  moduleId: string
): CourseModule | null {
  const course = getCourseById(courseId);
  if (!course) return null;

  // ✅ CORRECT: named `courseModule`, not `module`
  const courseModule = course.modules.find((m) => m.id === moduleId) ?? null;
  return courseModule;
}

export function getLessonById(
  courseId: string,
  moduleId: string,
  lessonId: string
): Lesson | null {
  const courseModule = getModuleById(courseId, moduleId);
  if (!courseModule) return null;
  return courseModule.lessons.find((l) => l.id === lessonId) ?? null;
}

export function getCoursesByLevel(
  level: Course["level"]
): Course[] {
  return COURSES.filter((c) => c.level === level);
}

export function searchCourses(query: string): Course[] {
  const q = query.toLowerCase();
  return COURSES.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.includes(q))
  );
}
