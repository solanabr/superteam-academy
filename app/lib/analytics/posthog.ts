import posthog from "posthog-js";

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_A0mZdWYn5Vyivq1T0tdCR7PRNX45hhT8vA7QtfriFQK";
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

export function initPostHog() {
  if (typeof window === "undefined") return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
    },
  });
}

export const analytics = {
  courseViewed: (courseId: number, courseTitle: string) =>
    posthog.capture("course_viewed", { courseId, courseTitle }),
  courseEnrolled: (courseId: number, courseTitle: string) =>
    posthog.capture("course_enrolled", { courseId, courseTitle }),
  lessonCompleted: (courseId: number, lessonIndex: number, xpEarned: number) =>
    posthog.capture("lesson_completed", { courseId, lessonIndex, xpEarned }),
  courseCompleted: (courseId: number, totalXp: number) =>
    posthog.capture("course_completed", { courseId, totalXp }),
  challengeAttempted: (challengeId: number, difficulty: string) =>
    posthog.capture("challenge_attempted", { challengeId, difficulty }),
  challengeSolved: (challengeId: number, xpEarned: number) =>
    posthog.capture("challenge_solved", { challengeId, xpEarned }),
  dailyChallengeAttempted: () =>
    posthog.capture("daily_challenge_attempted"),
  dailyChallengeSolved: (xpEarned: number, streak: number) =>
    posthog.capture("daily_challenge_solved", { xpEarned, streak }),
  walletConnected: (wallet: string) =>
    posthog.capture("wallet_connected", { wallet }),
  googleSignIn: () =>
    posthog.capture("google_sign_in"),
  forumPostCreated: (category: string) =>
    posthog.capture("forum_post_created", { category }),
  forumReplyCreated: (postId: number) =>
    posthog.capture("forum_reply_created", { postId }),
  identify: (userId: string, traits?: Record<string, any>) =>
    posthog.identify(userId, traits),
  reset: () => posthog.reset(),
};