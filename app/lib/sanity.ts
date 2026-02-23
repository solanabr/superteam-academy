import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: true,
});

export interface SanityQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const quizCache = new Map<string, { data: SanityQuizQuestion[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function getQuizQuestions(
  courseId: string,
  lessonIndex: number
): Promise<SanityQuizQuestion[] | null> {
  const key = `${courseId}:${lessonIndex}`;
  const cached = quizCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const result = await sanityClient.fetch<{ quizQuestions: SanityQuizQuestion[] } | null>(
      `*[_type == "lesson" && course->courseId == $courseId && lessonIndex == $lessonIndex][0]{quizQuestions}`,
      { courseId, lessonIndex }
    );
    if (result?.quizQuestions?.length) {
      quizCache.set(key, { data: result.quizQuestions, ts: Date.now() });
      return result.quizQuestions;
    }
    return null;
  } catch {
    return null;
  }
}

export interface SanityLessonContent {
  title: Record<string, string>;
  body: unknown[];
  codeChallenge?: {
    initialCode: string;
    language: string;
    expectedOutput: string;
    instructions: string;
  };
}

export async function getLessonContent(
  courseId: string,
  lessonIndex: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale: string
): Promise<SanityLessonContent | null> {
  try {
    return await sanityClient.fetch<SanityLessonContent | null>(
      `*[_type == "lesson" && course->courseId == $courseId && lessonIndex == $lessonIndex][0]{
        title, body, codeChallenge
      }`,
      { courseId, lessonIndex }
    );
  } catch {
    return null;
  }
}
