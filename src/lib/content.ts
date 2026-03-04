import anchor101Meta from "@/content/courses/anchor-101/meta.json";
import lesson00 from "@/content/courses/anchor-101/lessons/00.json";
import lesson01 from "@/content/courses/anchor-101/lessons/01.json";
import lesson02 from "@/content/courses/anchor-101/lessons/02.json";
import fundamentalsMeta from "@/content/courses/solana-fundamentals/meta.json";
import fundamentals00 from "@/content/courses/solana-fundamentals/lessons/00.json";
import fundamentals01 from "@/content/courses/solana-fundamentals/lessons/01.json";
import token2022Meta from "@/content/courses/token-2022-deep-dive/meta.json";
import token202200 from "@/content/courses/token-2022-deep-dive/lessons/00.json";
import defiMeta from "@/content/courses/defi-on-solana/meta.json";
import defi00 from "@/content/courses/defi-on-solana/lessons/00.json";

export type Locale = "en" | "pt" | "es";

export interface LocalizedString {
  en: string;
  pt: string;
  es: string;
}

export interface LessonContent {
  title: LocalizedString;
  description: LocalizedString;
  hints: LocalizedString[];
  starterCode: string;
  testCode: string;
  language?: "javascript" | "typescript" | "rust" | "json";
  fileName?: string;
  solutionCode?: string;
  videoUrl?: string;
}

export interface CourseMeta {
  courseId: string;
  title: LocalizedString;
  description: LocalizedString;
  trackCollection: string;
}

type EditorLanguage = "javascript" | "typescript" | "rust" | "json";
type RawLessonContent = Omit<LessonContent, "language"> & {
  language?: string;
};

const ALLOWED_LANGUAGES: EditorLanguage[] = [
  "javascript",
  "typescript",
  "rust",
  "json",
];

function normalizeLesson(lesson: RawLessonContent): LessonContent {
  const language = ALLOWED_LANGUAGES.includes(lesson.language as EditorLanguage)
    ? (lesson.language as EditorLanguage)
    : undefined;

  return {
    ...lesson,
    language,
  };
}

const CONTENT: Record<string, { meta: CourseMeta; lessons: LessonContent[] }> =
  {
    "anchor-101": {
      meta: anchor101Meta,
      lessons: [
        normalizeLesson(lesson00 as RawLessonContent),
        normalizeLesson(lesson01 as RawLessonContent),
        normalizeLesson(lesson02 as RawLessonContent),
      ],
    },
    "solana-fundamentals": {
      meta: fundamentalsMeta,
      lessons: [
        normalizeLesson(fundamentals00 as RawLessonContent),
        normalizeLesson(fundamentals01 as RawLessonContent),
      ],
    },
    "token-2022-deep-dive": {
      meta: token2022Meta,
      lessons: [normalizeLesson(token202200 as RawLessonContent)],
    },
    "defi-on-solana": {
      meta: defiMeta,
      lessons: [normalizeLesson(defi00 as RawLessonContent)],
    },
  };

// Maps on-chain courseIds to local content keys.
// Add entries here as new devnet courses are deployed.
const COURSE_ALIASES: Record<string, string> = {};

function resolveId(courseId: string): string {
  return COURSE_ALIASES[courseId] ?? courseId;
}

export function getCourseMeta(courseId: string): CourseMeta | null {
  return CONTENT[courseId]?.meta ?? null;
}

export function getResolvedContentId(courseId: string): string {
  return resolveId(courseId);
}

export function getLesson(
  courseId: string,
  index: number,
): LessonContent | null {
  return CONTENT[resolveId(courseId)]?.lessons[index] ?? null;
}

export function getLessonCount(courseId: string): number {
  return CONTENT[resolveId(courseId)]?.lessons.length ?? 0;
}

export function getLessons(courseId: string): LessonContent[] {
  return CONTENT[resolveId(courseId)]?.lessons ?? [];
}

export function localize(s: LocalizedString, locale: Locale): string {
  return s[locale] ?? s.en;
}
