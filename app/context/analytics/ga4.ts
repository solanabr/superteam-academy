/**
 * Google Analytics 4 integration.
 *
 * Uses gtag.js loaded via next/script in GoogleAnalytics component.
 * All calls are gated on `typeof window !== 'undefined' && window.gtag`.
 */

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

export type GAEvent =
  | 'page_view'
  | 'sign_up'
  | 'login'
  | 'enroll_course'
  | 'complete_lesson'
  | 'complete_course'
  | 'earn_xp'
  | 'unlock_achievement'
  | 'view_credential'
  | 'view_profile'
  | 'view_settings'
  | 'export_data'
  | 'link_wallet'
  | 'start_streak'
  | 'break_streak';

function isAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function' && !!GA_MEASUREMENT_ID;
}

export function pageView(url: string): void {
  if (!isAvailable()) return;
  window.gtag('config', GA_MEASUREMENT_ID!, { page_path: url });
}

export function event(action: GAEvent, params?: Record<string, unknown>): void {
  if (!isAvailable()) return;
  window.gtag('event', action, params);
}

/** Convenience methods for custom events */
export const analytics = {
  signUp(method: string) {
    event('sign_up', { method });
  },
  login(method: string) {
    event('login', { method });
  },
  enrollCourse(courseId: string, trackId?: number) {
    event('enroll_course', { course_id: courseId, track_id: trackId });
  },
  completeLesson(courseId: string, lessonIndex: number, xpEarned: number) {
    event('complete_lesson', { course_id: courseId, lesson_index: lessonIndex, xp_earned: xpEarned });
  },
  completeCourse(courseId: string, totalXp: number) {
    event('complete_course', { course_id: courseId, total_xp: totalXp });
  },
  earnXp(amount: number, source: string) {
    event('earn_xp', { amount, source });
  },
  unlockAchievement(achievementId: string) {
    event('unlock_achievement', { achievement_id: achievementId });
  },
  viewCredential(trackId: number) {
    event('view_credential', { track_id: trackId });
  },
  linkWallet(walletType: string) {
    event('link_wallet', { wallet_type: walletType });
  },
};
