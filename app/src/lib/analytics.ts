/**
 * Analytics module — GA4 custom events for Superteam Brazil Academy
 * Usage: import { track } from "@/lib/analytics"
 */

type EventName =
  | "lesson_complete"
  | "course_enrolled"
  | "course_complete"
  | "xp_earned"
  | "achievement_unlocked"
  | "wallet_connected"
  | "sign_up"
  | "sign_in"

type EventParams = Record<string, string | number | boolean>

export function track(event: EventName, params?: EventParams) {
  if (typeof window === "undefined") return
  
  // Google Analytics 4
  if (typeof (window as any).gtag === "function") {
    ;(window as any).gtag("event", event, {
      ...params,
      platform: "superteam_brazil_academy",
    })
  }

  // Console in dev
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${event}`, params)
  }
}

// Typed helpers
export const analytics = {
  lessonComplete: (lessonId: string, courseId: string, xpEarned: number) =>
    track("lesson_complete", { lesson_id: lessonId, course_id: courseId, xp_earned: xpEarned }),

  courseEnrolled: (courseId: string, courseName: string) =>
    track("course_enrolled", { course_id: courseId, course_name: courseName }),

  courseComplete: (courseId: string, xpEarned: number) =>
    track("course_complete", { course_id: courseId, xp_earned: xpEarned }),

  xpEarned: (amount: number, reason: string) =>
    track("xp_earned", { amount, reason }),

  achievementUnlocked: (achievementType: string) =>
    track("achievement_unlocked", { achievement_type: achievementType }),

  walletConnected: (walletType: string) =>
    track("wallet_connected", { wallet_type: walletType }),
}
