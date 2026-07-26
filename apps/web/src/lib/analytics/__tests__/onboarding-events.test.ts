import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resetAnalyticsEventDedupeForTests,
  trackOnboardingCompleted,
  trackOnboardingGoalCommitted,
  trackOnboardingRouteAccepted,
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
} from "../events";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("../index", () => ({ trackEvent }));

beforeEach(() => {
  trackEvent.mockClear();
  resetAnalyticsEventDedupeForTests();
});

describe("onboarding funnel events (E2/E7, LX-A2)", () => {
  it("onboarding_started fires once per session (deduped)", () => {
    trackOnboardingStarted();
    trackOnboardingStarted();
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("onboarding_started", {});
  });

  it("onboarding_step_completed carries step + closed-set choice", () => {
    trackOnboardingStepCompleted(1, "js_ts");
    trackOnboardingStepCompleted(3, ["defi", "nfts"]);
    trackOnboardingStepCompleted(3, null);
    trackOnboardingStepCompleted(4, 3);
    expect(trackEvent).toHaveBeenNthCalledWith(1, "onboarding_step_completed", {
      step: 1,
      choice: "js_ts",
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, "onboarding_step_completed", {
      step: 3,
      choice: ["defi", "nfts"],
    });
    expect(trackEvent).toHaveBeenNthCalledWith(3, "onboarding_step_completed", {
      step: 3,
      choice: null,
    });
    expect(trackEvent).toHaveBeenNthCalledWith(4, "onboarding_step_completed", {
      step: 4,
      choice: 3,
    });
  });

  it("onboarding_goal_committed carries the daily goal", () => {
    trackOnboardingGoalCommitted(3);
    expect(trackEvent).toHaveBeenCalledWith("onboarding_goal_committed", {
      dailyGoal: 3,
    });
  });

  it("onboarding_route_accepted distinguishes accept vs browse-all override", () => {
    trackOnboardingRouteAccepted(true, "course-solana-fundamentals");
    trackOnboardingRouteAccepted(false, "course-anchor-framework");
    expect(trackEvent).toHaveBeenNthCalledWith(1, "onboarding_route_accepted", {
      accepted: true,
      recommendedCourseId: "course-solana-fundamentals",
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, "onboarding_route_accepted", {
      accepted: false,
      recommendedCourseId: "course-anchor-framework",
    });
  });

  it("onboarding_completed carries closed-set ids + daily goal", () => {
    trackOnboardingCompleted({
      experience: "web3",
      goal: "build",
      dailyGoal: 1,
    });
    expect(trackEvent).toHaveBeenCalledWith("onboarding_completed", {
      experience: "web3",
      goal: "build",
      dailyGoal: 1,
    });
  });
});
