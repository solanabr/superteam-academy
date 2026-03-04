/**
 * Analytics
 *
 * Typed wrapper around GA4 gtag.js and custom event helpers.
 * Replace the send() function body with PostHog/Amplitude without
 * changing any call sites.
 */

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** All custom event names — add new ones here */
type AnalyticsEvent =
  | { name: "page_view"; params: { page_path: string; locale: string } }
  | { name: "wallet_connect"; params: { wallet_short: string } }
  | { name: "course_enroll"; params: { course_id: string; locale: string } }
  | { name: "lesson_complete"; params: { course_id: string; lesson_index: number; xp_earned: number } }
  | { name: "course_finalize"; params: { course_id: string; mode: "stub" | "onchain"; bonus_xp: number } }
  | { name: "credential_issued"; params: { course_id: string; credential_id: string; mode: "stub" | "onchain" } }
  | { name: "search_filter"; params: { query: string; category: string } }
  | { name: "xp_earned"; params: { amount: number; source: string } }
  | { name: "achievement_unlock"; params: { achievement_id: string; achievement_title: string } }
  | { name: "language_switch"; params: { from: string; to: string } };

function send(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", event.name, event.params);
  }
  // Development logging
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event.name, event.params);
  }
}

export const track = {
  pageView: (pagePath: string, locale: string) =>
    send({ name: "page_view", params: { page_path: pagePath, locale } }),

  walletConnect: (walletShort: string) =>
    send({ name: "wallet_connect", params: { wallet_short: walletShort } }),

  courseEnroll: (courseId: string, locale: string) =>
    send({ name: "course_enroll", params: { course_id: courseId, locale } }),

  lessonComplete: (courseId: string, lessonIndex: number, xpEarned: number) =>
    send({
      name: "lesson_complete",
      params: { course_id: courseId, lesson_index: lessonIndex, xp_earned: xpEarned },
    }),

  courseFinalize: (courseId: string, mode: "stub" | "onchain", bonusXp: number) =>
    send({
      name: "course_finalize",
      params: { course_id: courseId, mode, bonus_xp: bonusXp },
    }),

  credentialIssued: (
    courseId: string,
    credentialId: string,
    mode: "stub" | "onchain",
  ) =>
    send({
      name: "credential_issued",
      params: { course_id: courseId, credential_id: credentialId, mode },
    }),

  searchFilter: (query: string, category: string) =>
    send({ name: "search_filter", params: { query, category } }),

  xpEarned: (amount: number, source: string) =>
    send({ name: "xp_earned", params: { amount, source } }),

  achievementUnlock: (achievementId: string, achievementTitle: string) =>
    send({
      name: "achievement_unlock",
      params: { achievement_id: achievementId, achievement_title: achievementTitle },
    }),

  languageSwitch: (from: string, to: string) =>
    send({ name: "language_switch", params: { from, to } }),
};
