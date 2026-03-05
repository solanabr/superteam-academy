// Google Analytics 4 Event Tracking Utilities
// Add to: app/lib/analytics.ts

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

type GAEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_dimensions?: Record<string, string | number>;
};

export function trackEvent({ action, category, label, value, custom_dimensions }: GAEvent) {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
    ...custom_dimensions,
  });
}

// =====================
// Learning Events
// =====================

export function trackCourseView(courseSlug: string, courseTitle: string) {
  trackEvent({
    action: 'view_course',
    category: 'engagement',
    label: courseTitle,
    custom_dimensions: { course_slug: courseSlug },
  });
}

export function trackLessonStart(courseSlug: string, lessonId: string, lessonTitle: string) {
  trackEvent({
    action: 'start_lesson',
    category: 'learning',
    label: lessonTitle,
    custom_dimensions: { course_slug: courseSlug, lesson_id: lessonId },
  });
}

export function trackLessonComplete(courseSlug: string, lessonId: string, xpEarned: number) {
  trackEvent({
    action: 'complete_lesson',
    category: 'learning',
    value: xpEarned,
    custom_dimensions: { course_slug: courseSlug, lesson_id: lessonId, xp_earned: xpEarned },
  });
}

export function trackCourseCompletion(courseSlug: string, courseTitle: string, xpEarned: number) {
  trackEvent({
    action: 'complete_course',
    category: 'learning',
    label: courseTitle,
    value: xpEarned,
    custom_dimensions: { course_slug: courseSlug, xp_earned: xpEarned },
  });
}

// =====================
// Enrollment Events
// =====================

export function trackEnrollment(courseSlug: string, courseTitle: string) {
  trackEvent({
    action: 'enroll_course',
    category: 'conversion',
    label: courseTitle,
    custom_dimensions: { course_slug: courseSlug },
  });
}

export function trackEnrollmentSuccess(courseSlug: string, txHash: string) {
  trackEvent({
    action: 'enrollment_confirmed',
    category: 'conversion',
    custom_dimensions: { course_slug: courseSlug, tx_hash: txHash },
  });
}

// =====================
// Gamification Events
// =====================

export function trackLevelUp(newLevel: number, totalXp: number) {
  trackEvent({
    action: 'level_up',
    category: 'gamification',
    value: newLevel,
    custom_dimensions: { level: newLevel, total_xp: totalXp },
  });
}

export function trackAchievementUnlocked(achievementId: string, achievementTitle: string, rarity: string) {
  trackEvent({
    action: 'unlock_achievement',
    category: 'gamification',
    label: achievementTitle,
    custom_dimensions: { achievement_id: achievementId, rarity },
  });
}

export function trackStreakUpdate(streakDays: number) {
  trackEvent({
    action: 'update_streak',
    category: 'gamification',
    value: streakDays,
    custom_dimensions: { streak_days: streakDays },
  });
}

// =====================
// Credential Events
// =====================

export function trackCredentialMint(mintAddress: string, courseName: string, level: number) {
  trackEvent({
    action: 'mint_credential',
    category: 'credential',
    label: courseName,
    custom_dimensions: { mint_address: mintAddress, course_name: courseName, credential_level: level },
  });
}

export function trackCredentialView(mintAddress: string) {
  trackEvent({
    action: 'view_credential',
    category: 'credential',
    custom_dimensions: { mint_address: mintAddress },
  });
}

export function trackCertificateDownload(mintAddress: string) {
  trackEvent({
    action: 'download_certificate',
    category: 'credential',
    custom_dimensions: { mint_address: mintAddress },
  });
}

export function trackCertificateShare(mintAddress: string, platform: 'twitter' | 'linkedin') {
  trackEvent({
    action: 'share_certificate',
    category: 'credential',
    label: platform,
    custom_dimensions: { mint_address: mintAddress, share_platform: platform },
  });
}

// =====================
// User Engagement
// =====================

export function trackLeaderboardView(timeframe: 'weekly' | 'monthly' | 'all_time') {
  trackEvent({
    action: 'view_leaderboard',
    category: 'engagement',
    custom_dimensions: { leaderboard_timeframe: timeframe },
  });
}

export function trackProfileView(walletAddress: string) {
  trackEvent({
    action: 'view_profile',
    category: 'engagement',
    custom_dimensions: { wallet: walletAddress },
  });
}

export function trackSearch(query: string, resultCount: number) {
  trackEvent({
    action: 'search',
    category: 'engagement',
    label: query,
    value: resultCount,
  });
}

// =====================
// Error Tracking
// =====================

export function trackError(errorType: string, errorMessage: string) {
  trackEvent({
    action: 'error',
    category: 'exception',
    label: errorType,
    custom_dimensions: { error_message: errorMessage },
  });
}

export function trackTransactionFailure(txType: string, errorCode: string) {
  trackEvent({
    action: 'transaction_failed',
    category: 'error',
    label: txType,
    custom_dimensions: { error_code: errorCode, tx_type: txType },
  });
}
