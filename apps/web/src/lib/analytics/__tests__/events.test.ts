import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  challengeKindFor,
  resetAnalyticsEventDedupeForTests,
  trackChallengeFailed,
  trackChallengeRun,
  trackChallengeSolved,
  trackChallengeStarted,
  trackCredentialMinted,
  trackNextLessonPlanCommitted,
  trackSolutionRevealed,
  trackStuckNudgeAccepted,
  trackStuckNudgeShown,
} from "../events";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("../index", () => ({ trackEvent }));

const ctx = {
  lessonId: "lesson-anchor-pda",
  courseId: "course-solana-201",
  challengeKind: "rust" as const,
};

beforeEach(() => {
  trackEvent.mockClear();
  resetAnalyticsEventDedupeForTests();
});

describe("challengeKindFor", () => {
  it("maps language/buildType onto the closed challenge-kind set", () => {
    expect(challengeKindFor("typescript")).toBe("js");
    expect(challengeKindFor("typescript", "standard")).toBe("js");
    expect(challengeKindFor("rust")).toBe("rust");
    expect(challengeKindFor("rust", "standard")).toBe("rust");
    expect(challengeKindFor("rust", "buildable")).toBe("buildable");
  });
});

describe("challenge lifecycle events", () => {
  it("challenge_run fires per execution with the exact lean payload", () => {
    trackChallengeRun(ctx);
    trackChallengeRun(ctx);
    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenNthCalledWith(1, "challenge_run", {
      lessonId: "lesson-anchor-pda",
      challengeKind: "rust",
      courseId: "course-solana-201",
    });
  });

  it("challenge_failed carries the consecutive-fail streak", () => {
    trackChallengeFailed(ctx, 1);
    trackChallengeFailed(ctx, 2);
    expect(trackEvent).toHaveBeenNthCalledWith(2, "challenge_failed", {
      lessonId: "lesson-anchor-pda",
      challengeKind: "rust",
      courseId: "course-solana-201",
      consecutiveFails: 2,
    });
  });

  it("challenge_solved fires with the exact lean payload", () => {
    trackChallengeSolved(ctx);
    expect(trackEvent).toHaveBeenCalledWith("challenge_solved", {
      lessonId: "lesson-anchor-pda",
      challengeKind: "rust",
      courseId: "course-solana-201",
    });
  });

  it("challenge_solved omits postNudge unless a nudge was shown", () => {
    trackChallengeSolved(ctx, { postNudge: false });
    expect(trackEvent).toHaveBeenLastCalledWith("challenge_solved", {
      lessonId: "lesson-anchor-pda",
      challengeKind: "rust",
      courseId: "course-solana-201",
    });

    trackChallengeSolved(ctx, { postNudge: true });
    expect(trackEvent).toHaveBeenLastCalledWith("challenge_solved", {
      lessonId: "lesson-anchor-pda",
      challengeKind: "rust",
      courseId: "course-solana-201",
      postNudge: true,
    });
  });

  it("omits courseId when the surface does not know it", () => {
    trackChallengeRun({ lessonId: "l1", challengeKind: "js" });
    expect(trackEvent).toHaveBeenCalledWith("challenge_run", {
      lessonId: "l1",
      challengeKind: "js",
    });
  });

  it("challenge_started dedupes per lesson per session", () => {
    trackChallengeStarted(ctx);
    trackChallengeStarted(ctx);
    trackChallengeStarted(ctx);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("challenge_started", {
      lessonId: "lesson-anchor-pda",
      challengeKind: "rust",
      courseId: "course-solana-201",
    });

    trackChallengeStarted({ ...ctx, lessonId: "another-lesson" });
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });
});

describe("stuck-nudge events (LX-C4)", () => {
  it("stuck_nudge_shown dedupes per lesson per session", () => {
    trackStuckNudgeShown(ctx, 3);
    trackStuckNudgeShown(ctx, 4);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("stuck_nudge_shown", {
      lessonId: "lesson-anchor-pda",
      challengeKind: "rust",
      courseId: "course-solana-201",
      consecutiveFails: 3,
    });

    trackStuckNudgeShown({ ...ctx, lessonId: "another-lesson" }, 3);
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it("stuck_nudge_accepted carries the zero-based hint index, never text", () => {
    trackStuckNudgeAccepted(ctx, 0);
    trackStuckNudgeAccepted(ctx, 1);
    expect(trackEvent).toHaveBeenNthCalledWith(2, "stuck_nudge_accepted", {
      lessonId: "lesson-anchor-pda",
      challengeKind: "rust",
      courseId: "course-solana-201",
      hintIndex: 1,
    });
  });
});

describe("solution_revealed (LX-C6 soft-gate)", () => {
  it("dedupes per lesson per session and carries the lean payload", () => {
    trackSolutionRevealed(ctx);
    trackSolutionRevealed(ctx);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("solution_revealed", {
      lessonId: "lesson-anchor-pda",
      challengeKind: "rust",
      courseId: "course-solana-201",
    });

    trackSolutionRevealed({ ...ctx, lessonId: "another-lesson" });
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it("omits courseId when the surface does not know it", () => {
    trackSolutionRevealed({ lessonId: "l1", challengeKind: "js" });
    expect(trackEvent).toHaveBeenCalledWith("solution_revealed", {
      lessonId: "l1",
      challengeKind: "js",
    });
  });
});

describe("next_lesson_plan_committed (LX-A6 if-then plan)", () => {
  it("carries only the closed-set weekday id — never the exact time or PII", () => {
    trackNextLessonPlanCommitted({ day: "tue" });
    expect(trackEvent).toHaveBeenCalledWith("next_lesson_plan_committed", {
      day: "tue",
    });
  });
});

describe("credential_minted dedupe (one mint = one event)", () => {
  it("collapses the manual-mint and Realtime observations of the same mint", () => {
    trackCredentialMinted("course-solana-201", "manual_mint");
    trackCredentialMinted("course-solana-201", "realtime");
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("credential_minted", {
      courseId: "course-solana-201",
      source: "manual_mint",
    });
  });

  it("collapses regardless of observation order", () => {
    trackCredentialMinted("course-solana-201", "realtime");
    trackCredentialMinted("course-solana-201", "manual_mint");
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("credential_minted", {
      courseId: "course-solana-201",
      source: "realtime",
    });
  });

  it("still fires once per distinct course", () => {
    trackCredentialMinted("course-a", "realtime");
    trackCredentialMinted("course-b", "realtime");
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it("test reset restores firing", () => {
    trackCredentialMinted("course-a", "manual_mint");
    resetAnalyticsEventDedupeForTests();
    trackCredentialMinted("course-a", "manual_mint");
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });
});
