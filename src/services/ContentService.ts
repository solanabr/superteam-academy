/**
 * ContentService
 *
 * Abstraction over course content delivery.
 * Currently reads from local JSON files at /src/content/courses/.
 * Swap for Sanity/Strapi/Contentful by replacing this implementation
 * without changing any component that calls it.
 */

import { sanityClient } from "@/lib/sanity";

export interface CourseMetadata {
  courseId: string;
  title: Record<string, string>;        // { en, pt, es }
  description: Record<string, string>;  // { en, pt, es }
  trackCollection?: string;
}

export interface LessonContent {
  lessonIndex: number;
  title: string;
  description: string;
  xpReward: number;
  content: string;
  starterCode?: string;
  videoUrl?: string;
  tests?: Array<{ name: string; assertion: string }>;
}

export interface IContentService {
  getCourses(): Promise<CourseMetadata[]>;
  getCourse(courseId: string): Promise<CourseMetadata | null>;
  getLesson(courseId: string, lessonIndex: number): Promise<LessonContent | null>;
  getLessonCount(courseId: string): Promise<number>;
}

/**
 * LocalJsonContentService — reads from /src/content/courses/**
 * This is the default implementation used when no CMS env vars are set.
 */
class LocalJsonContentService implements IContentService {
  async getCourses(): Promise<CourseMetadata[]> {
    // In Next.js App Router, dynamic require() works on server; 
    // on client, courses are fetched via the API. This stub always returns 
    // the known list so UI stays consistent.
    return KNOWN_COURSES;
  }

  async getCourse(courseId: string): Promise<CourseMetadata | null> {
    return KNOWN_COURSES.find((c) => c.courseId === courseId) ?? null;
  }

  async getLesson(courseId: string, lessonIndex: number): Promise<LessonContent | null> {
    void courseId;
    void lessonIndex;
    // Resolved at build time via static JSON imports in lesson page
    return null;
  }

  async getLessonCount(courseId: string): Promise<number> {
    return LESSON_COUNTS[courseId] ?? 0;
  }
}

/** Hardcoded manifest — matches the folders in /src/content/courses/ */
const KNOWN_COURSES: CourseMetadata[] = [
  {
    courseId: "anchor-101",
    title: { en: "Anchor 101", pt: "Anchor 101", es: "Anchor 101" },
    description: {
      en: "Learn Solana program development with Anchor — accounts, instructions, and PDAs from the ground up.",
      pt: "Aprenda desenvolvimento de programas Solana com Anchor — contas, instruções e PDAs do zero.",
      es: "Aprende desarrollo de programas Solana con Anchor — cuentas, instrucciones y PDAs desde cero.",
    },
    trackCollection: "HgbTmCi4wUWAWLx4LD6zJ2AQdayaCe7mVfhJpGwXfeVX",
  },
  {
    courseId: "solana-fundamentals",
    title: {
      en: "Solana Fundamentals",
      pt: "Fundamentos do Solana",
      es: "Fundamentos de Solana",
    },
    description: {
      en: "Master the core concepts of Solana: the account model, programs, transactions, and the runtime.",
      pt: "Domine os conceitos centrais do Solana: modelo de contas, programas, transações e o runtime.",
      es: "Domina los conceptos fundamentales de Solana: modelo de cuentas, programas, transacciones y el runtime.",
    },
  },
  {
    courseId: "token-2022-deep-dive",
    title: {
      en: "Token-2022 Deep Dive",
      pt: "Mergulho Profundo no Token-2022",
      es: "Inmersión en Token-2022",
    },
    description: {
      en: "Explore the new Solana Token Extensions program: soulbound tokens, transfer hooks, and confidential transfers.",
      pt: "Explore o novo programa Token Extensions do Solana: tokens soulbound, hooks de transferência e transferências confidenciais.",
      es: "Explora el nuevo programa Token Extensions de Solana: tokens soulbound, hooks de transferencia y transferencias confidenciales.",
    },
  },
  {
    courseId: "defi-on-solana",
    title: {
      en: "DeFi on Solana",
      pt: "DeFi no Solana",
      es: "DeFi en Solana",
    },
    description: {
      en: "Build decentralized finance apps on Solana: AMMs, liquidity pools, SPL token swaps, and yield farming.",
      pt: "Construa aplicações de finanças descentralizadas no Solana: AMMs, pools de liquidez e yield farming.",
      es: "Construye aplicaciones de finanzas descentralizadas en Solana: AMMs, pools de liquidez y yield farming.",
    },
  },
];

const LESSON_COUNTS: Record<string, number> = {
  "anchor-101": 3,
  "solana-fundamentals": 2,
  "token-2022-deep-dive": 1,
  "defi-on-solana": 1,
};

/**
 * SanityContentService — reads from Sanity CMS
 */
class SanityContentService implements IContentService {
  async getCourses(): Promise<CourseMetadata[]> {
    if (!sanityClient) return KNOWN_COURSES;
    try {
      const courses = await sanityClient.fetch(
        `*[_type == "course"]{ courseId, title, description, trackCollection }`,
      );
      return courses.length > 0 ? courses : KNOWN_COURSES; // fallback to json if no Sanity data
    } catch (err) {
      console.warn("[ContentService] Sanity getCourses failed, using fallback", err);
      return KNOWN_COURSES;
    }
  }

  async getCourse(courseId: string): Promise<CourseMetadata | null> {
    if (!sanityClient) return KNOWN_COURSES.find((c) => c.courseId === courseId) ?? null;
    try {
      const course = await sanityClient.fetch(
        `*[_type == "course" && courseId == $courseId][0]{ courseId, title, description, trackCollection }`,
        { courseId },
      );
      return course ?? KNOWN_COURSES.find((c) => c.courseId === courseId) ?? null;
    } catch (err) {
      console.warn("[ContentService] Sanity getCourse failed, using fallback", err);
      return KNOWN_COURSES.find((c) => c.courseId === courseId) ?? null;
    }
  }

  async getLesson(courseId: string, lessonIndex: number): Promise<LessonContent | null> {
    if (!sanityClient) return null; // We rely on static JSON for now if not using CMS fully
    try {
      return sanityClient.fetch(
        `*[_type == "lesson" && courseId == $courseId && lessonIndex == $lessonIndex][0]{
          lessonIndex, title, description, xpReward, content, starterCode, videoUrl, tests
        }`,
        { courseId, lessonIndex },
      );
    } catch (err) {
      console.warn("[ContentService] Sanity getLesson failed", err);
      return null;
    }
  }

  async getLessonCount(courseId: string): Promise<number> {
    if (!sanityClient) return LESSON_COUNTS[courseId] ?? 0;
    try {
      const count = await sanityClient.fetch(
        `count(*[_type == "lesson" && courseId == $courseId])`,
        { courseId },
      );
      return count > 0 ? count : (LESSON_COUNTS[courseId] ?? 0);
    } catch (err) {
      console.warn("[ContentService] Sanity getLessonCount failed, using fallback", err);
      return LESSON_COUNTS[courseId] ?? 0;
    }
  }
}

/** Singleton */
let _contentService: IContentService | null = null;
export function getContentService(): IContentService {
  if (!_contentService) {
    if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      _contentService = new SanityContentService();
    } else {
      _contentService = new LocalJsonContentService();
    }
  }
  return _contentService;
}
