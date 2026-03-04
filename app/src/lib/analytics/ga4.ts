/**
 * Google Analytics 4 (GA4) Tracking
 * 
 * Track user interactions and custom events for the Caminho LMS platform.
 * Events tracked:
 * - Page views
 * - Course enrollments
 * - Lesson completions
 * - Challenge completions
 * - Wallet connections
 * - Credential views
 * - Achievement unlocks
 * - Streak milestones
 */

// GA4 Measurement ID (replace with your actual ID from GA4 dashboard)
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "";

// Types for analytics events
type EventCategory = 
  | "engagement" 
  | "learning" 
  | "wallet" 
  | "gamification" 
  | "credential";

interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, string | number | boolean>;
}

/**
 * Initialize GA4 (called in layout or provider)
 */
export function initGA(): void {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID) {
    // Analytics not configured - that's ok for demo/submission
    return;
  }

  // Load GA4 script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: true,
    cookie_flags: "SameSite=None;Secure",
  });
}

/**
 * Track page views
 */
export function pageview(path: string, title?: string): void {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

/**
 * Track custom events
 */
export function trackEvent({
  category,
  action,
  label,
  value,
  customParameters = {},
}: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
    ...customParameters,
  });
}

// Predefined event tracking functions for common actions

export const Analytics = {
  // Learning events
  courseViewed: (courseId: string, courseTitle: string) =>
    trackEvent({
      category: "learning",
      action: "course_viewed",
      label: courseTitle,
      customParameters: { course_id: courseId },
    }),

  courseEnrolled: (courseId: string, courseTitle: string) =>
    trackEvent({
      category: "learning",
      action: "course_enrolled",
      label: courseTitle,
      customParameters: { course_id: courseId },
    }),

  lessonStarted: (courseId: string, lessonId: string, lessonType: "content" | "challenge") =>
    trackEvent({
      category: "learning",
      action: "lesson_started",
      label: `${courseId}/${lessonId}`,
      customParameters: { course_id: courseId, lesson_id: lessonId, lesson_type: lessonType },
    }),

  lessonCompleted: (courseId: string, lessonId: string, xpEarned: number) =>
    trackEvent({
      category: "learning",
      action: "lesson_completed",
      label: `${courseId}/${lessonId}`,
      value: xpEarned,
      customParameters: { course_id: courseId, lesson_id: lessonId, xp_earned: xpEarned },
    }),

  challengeCompleted: (courseId: string, lessonId: string, success: boolean, attempts: number) =>
    trackEvent({
      category: "learning",
      action: "challenge_completed",
      label: success ? "success" : "failure",
      customParameters: { 
        course_id: courseId, 
        lesson_id: lessonId, 
        success,
        attempts 
      },
    }),

  // Wallet events
  walletConnected: (walletName: string) =>
    trackEvent({
      category: "wallet",
      action: "wallet_connected",
      label: walletName,
    }),

  walletLinked: (walletAddress: string) =>
    trackEvent({
      category: "wallet",
      action: "wallet_linked",
      label: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    }),

  // Gamification events
  achievementUnlocked: (achievementName: string, achievementId: number) =>
    trackEvent({
      category: "gamification",
      action: "achievement_unlocked",
      label: achievementName,
      customParameters: { achievement_id: achievementId },
    }),

  streakMilestone: (streakDays: number) =>
    trackEvent({
      category: "gamification",
      action: "streak_milestone",
      label: `${streakDays}_days`,
      value: streakDays,
      customParameters: { streak_days: streakDays },
    }),

  levelUp: (newLevel: number, totalXP: number) =>
    trackEvent({
      category: "gamification",
      action: "level_up",
      label: `level_${newLevel}`,
      value: newLevel,
      customParameters: { level: newLevel, total_xp: totalXP },
    }),

  // Credential events
  credentialViewed: (credentialId: string, trackName: string) =>
    trackEvent({
      category: "credential",
      action: "credential_viewed",
      label: trackName,
      customParameters: { credential_id: credentialId },
    }),

  credentialShared: (credentialId: string, platform: string) =>
    trackEvent({
      category: "credential",
      action: "credential_shared",
      label: platform,
      customParameters: { credential_id: credentialId },
    }),

  // Engagement events
  leaderboardViewed: (timeframe: string) =>
    trackEvent({
      category: "engagement",
      action: "leaderboard_viewed",
      label: timeframe,
    }),

  profileViewed: (username: string) =>
    trackEvent({
      category: "engagement",
      action: "profile_viewed",
      label: username,
    }),
};

// Type augmentation for window object
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export default Analytics;
