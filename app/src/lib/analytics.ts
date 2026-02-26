/**
 * Analytics integration: GA4 + PostHog
 * Tracks learning events, user behavior, and gamification milestones.
 */

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// ─── Google Analytics 4 ────────────────────────────────────────────

export function pageview(url: string) {
  if (typeof window === "undefined" || !window.gtag || !GA_ID) return;
  window.gtag("config", GA_ID, { page_path: url });
}

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}

// ─── Academy-specific events ───────────────────────────────────────

export const analytics = {
  // Course events
  courseEnrolled: (courseId: string, courseTitle: string) => {
    trackEvent("course_enrolled", "Learning", courseTitle);
  },

  lessonCompleted: (courseId: string, lessonId: string, xpEarned: number) => {
    trackEvent("lesson_completed", "Learning", lessonId, xpEarned);
  },

  challengeCompleted: (
    courseId: string,
    challengeId: string,
    attempts: number
  ) => {
    trackEvent("challenge_completed", "Learning", challengeId, attempts);
  },

  courseCompleted: (courseId: string, totalXp: number) => {
    trackEvent("course_completed", "Learning", courseId, totalXp);
  },

  // Gamification events
  levelUp: (newLevel: number, totalXp: number) => {
    trackEvent("level_up", "Gamification", `Level ${newLevel}`, totalXp);
  },

  achievementUnlocked: (achievementId: string, xpReward: number) => {
    trackEvent("achievement_unlocked", "Gamification", achievementId, xpReward);
  },

  streakMilestone: (days: number) => {
    trackEvent("streak_milestone", "Gamification", `${days} days`, days);
  },

  // Wallet events
  walletConnected: (walletName: string) => {
    trackEvent("wallet_connected", "Authentication", walletName);
  },

  walletDisconnected: () => {
    trackEvent("wallet_disconnected", "Authentication");
  },

  // UI events
  languageChanged: (locale: string) => {
    trackEvent("language_changed", "Preferences", locale);
  },

  themeChanged: (theme: string) => {
    trackEvent("theme_changed", "Preferences", theme);
  },

  // Search & navigation
  courseSearched: (query: string) => {
    trackEvent("course_searched", "Discovery", query);
  },

  leaderboardViewed: (timeframe: string) => {
    trackEvent("leaderboard_viewed", "Discovery", timeframe);
  },

  credentialViewed: (credentialId: string) => {
    trackEvent("credential_viewed", "Credentials", credentialId);
  },

  certificateShared: (platform: string, credentialId: string) => {
    trackEvent("certificate_shared", "Social", platform);
  },
};

// ─── Google Analytics script helper ───────────────────────────────

export function GoogleAnalyticsScript() {
  if (!GA_ID) return null;
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}', {
      page_path: window.location.pathname,
      anonymize_ip: true,
    });
  `;
}
