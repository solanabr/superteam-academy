type GtagFunction = (
  command: string,
  eventName: string,
  params?: Record<string, string | number | boolean>
) => void;

type WindowWithGtag = Window & typeof globalThis & { gtag?: GtagFunction };

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window !== "undefined") {
    const win = window as WindowWithGtag;
    if (win.gtag) {
      win.gtag("event", eventName, params);
    }
  }
}

export const events = {
  lessonComplete: (courseId: string, lessonIndex: number, xpEarned: number) =>
    trackEvent("lesson_complete", {
      course_id: courseId,
      lesson_index: lessonIndex,
      xp_earned: xpEarned,
    }),
  courseEnroll: (courseId: string, difficulty: string) =>
    trackEvent("course_enroll", { course_id: courseId, difficulty }),
  walletConnect: (walletType: string) =>
    trackEvent("wallet_connect", { wallet_type: walletType }),
  leaderboardView: (timeframe: string) =>
    trackEvent("leaderboard_view", { timeframe }),
};
