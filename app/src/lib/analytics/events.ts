import { trackEvent } from "./ga4";

function getPostHog(): { capture: (event: string, properties?: Record<string, unknown>) => void } | null {
  if (typeof window === "undefined") return null;
  // Access PostHog instance if already loaded by PostHogProvider
  const ph = (window as unknown as Record<string, unknown>).posthog as { capture?: (event: string, properties?: Record<string, unknown>) => void } | undefined;
  if (ph?.capture) return ph as { capture: (event: string, properties?: Record<string, unknown>) => void };
  return null;
}

export function trackCourseEnroll(courseId: string): void {
  trackEvent("course_enroll", { course_id: courseId });
  getPostHog()?.capture("course_enroll", { course_id: courseId });
}

export function trackLessonComplete(
  courseId: string,
  lessonIndex: number
): void {
  trackEvent("lesson_complete", {
    course_id: courseId,
    lesson_index: String(lessonIndex),
  });
  getPostHog()?.capture("lesson_complete", { course_id: courseId, lessonIndex });
}

export function trackWalletConnect(walletName: string): void {
  trackEvent("wallet_connect", { wallet_name: walletName });
  getPostHog()?.capture("wallet_connect", { wallet_name: walletName });
}

export function trackCourseComplete(courseId: string): void {
  trackEvent("course_complete", { course_id: courseId });
  getPostHog()?.capture("course_complete", { course_id: courseId });
}

export function trackChallengeComplete(
  challengeId: string,
  difficulty: number
): void {
  trackEvent("challenge_complete", {
    challenge_id: challengeId,
    difficulty: String(difficulty),
  });
  getPostHog()?.capture("challenge_complete", { challenge_id: challengeId, difficulty });
}

export function trackPageView(path: string): void {
  trackEvent("page_view", { page_path: path });
  getPostHog()?.capture("$pageview", { $current_url: path });
}
