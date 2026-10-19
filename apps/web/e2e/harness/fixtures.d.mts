// Types for the plain-ESM fixtures shared with the Node harness (fixtures.mjs).
export const MOCK_PORT: number;
export const APP_PORT: number;
export const MOCK_SUPABASE_URL: string;
export const APP_BASE_URL: string;
export const ANON_KEY: string;
export const LEARNER: {
  id: string;
  email: string;
  username: string;
  walletAddress: string;
};
export interface E2ETargets {
  DEPLOYMENTS: ReadonlyArray<{
    content_id: string;
    kind: string;
    status: string;
    is_active: boolean;
    achievement_pda: string | null;
  }>;
  ACTIVE_COURSE_SLUGS: readonly string[];
  DEACTIVATED_COURSE_SLUG: string;
  LEARN_LOOP: {
    courseId: string;
    courseSlug: string;
    lessonId: string;
    lessonSlug: string;
    lessonTitle: string;
    /** [questionId, correctOptionId] pairs, in the quiz's own order. */
    answers: ReadonlyArray<readonly [string, string]>;
  };
}
/** Pick the spec targets from the committed bundle's courses and lessons. */
export function pickTargets(courses: unknown, lessons: unknown): E2ETargets;
