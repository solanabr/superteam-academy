// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { readSegmentState } from "@/lib/onboarding/segment-state";
import type { LearnerSegment } from "@/lib/courses/learner-segment";
import { StartIntakeClient, type SegmentRoute } from "../start-client";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const events = vi.hoisted(() => ({
  trackOnboardingStarted: vi.fn(),
  trackOnboardingStepCompleted: vi.fn(),
  trackOnboardingGoalCommitted: vi.fn(),
  trackOnboardingRouteAccepted: vi.fn(),
  trackOnboardingCompleted: vi.fn(),
}));
vi.mock("@/lib/analytics/events", () => events);

const ROUTES: Record<LearnerSegment, SegmentRoute> = {
  1: {
    courseId: "course-solana-fundamentals",
    href: "/en/courses/solana-fundamentals/lessons/intro",
  },
  2: {
    courseId: "course-anchor-framework",
    href: "/en/courses/anchor-framework/lessons/setup",
  },
  3: {
    courseId: "course-solana-fundamentals",
    href: "/en/courses/solana-fundamentals/lessons/intro",
  },
};

function renderStart(): ReturnType<typeof render> {
  const ui: ReactElement = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <StartIntakeClient
        routes={ROUTES}
        dailyGoalOptions={[1, 3]}
        browseAllHref="/en/courses"
      />
    </NextIntlClientProvider>
  );
  return render(ui);
}

beforeEach(() => {
  window.localStorage.clear();
  push.mockClear();
  for (const fn of Object.values(events)) fn.mockClear();
});

function tap(name: RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("/start intake — screen 1 (experience fork)", () => {
  it("offers verifiable-history options and fires started + step 1 on first tap", () => {
    renderStart();
    // Verifiable-history phrasing, never a self-rating.
    expect(
      screen.getByRole("button", { name: /shipped apps with JavaScript/i })
    ).toBeInTheDocument();

    tap(/shipped apps with JavaScript/i);

    expect(events.trackOnboardingStarted).toHaveBeenCalledTimes(1);
    expect(events.trackOnboardingStepCompleted).toHaveBeenCalledWith(
      1,
      "js_ts"
    );
    // Segment persisted to localStorage (survives to sign-in copy).
    expect(readSegmentState()).toMatchObject({
      experience: "js_ts",
      segment: 1,
    });
    // Advanced to screen 2.
    expect(
      screen.getByRole("heading", { name: /what are you here to do/i })
    ).toBeInTheDocument();
  });
});

describe("/start intake — full happy path consumes every answer", () => {
  it("segment→routing, goal persisted, daily-goal→quest target, completion navigates", () => {
    renderStart();

    tap(/shipped apps with JavaScript/i); // segment 1
    tap(/Land a Solana developer role/i); // goal job
    expect(events.trackOnboardingStepCompleted).toHaveBeenCalledWith(2, "job");

    // Screen 3 skippable — skip banks nothing but records the funnel step.
    tap(/^Skip$/i);
    expect(events.trackOnboardingStepCompleted).toHaveBeenCalledWith(3, null);

    // Screen 4 — daily goal wired to quest targets (1 / 3 lessons a day).
    tap(/3 lessons a day/i);

    expect(events.trackOnboardingGoalCommitted).toHaveBeenCalledWith(3);
    expect(events.trackOnboardingCompleted).toHaveBeenCalledWith({
      experience: "js_ts",
      goal: "job",
      dailyGoal: 3,
    });
    expect(events.trackOnboardingRouteAccepted).toHaveBeenCalledWith(
      true,
      "course-solana-fundamentals"
    );
    // Lands in the segment's entry lesson via the routing constant.
    expect(push).toHaveBeenCalledWith(
      "/en/courses/solana-fundamentals/lessons/intro"
    );
    expect(readSegmentState()).toMatchObject({ goal: "job", dailyGoal: 3 });
  });

  it("web3 experience routes to the anchor entry (skips fundamentals)", () => {
    renderStart();
    tap(/written smart contracts or shipped on-chain/i); // segment 2
    tap(/Ship my own project/i);
    tap(/^Skip$/i);
    tap(/1 lesson a day/i);
    expect(push).toHaveBeenCalledWith(
      "/en/courses/anchor-framework/lessons/setup"
    );
  });
});

describe("/start intake — interest chips (optional, multi-select)", () => {
  it("banks selected chips and records them in the funnel step", () => {
    renderStart();
    tap(/shipped apps with JavaScript/i);
    tap(/Land a Solana developer role/i);

    const defi = screen.getByRole("button", { name: "DeFi" });
    fireEvent.click(defi);
    expect(defi).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/i }));

    expect(events.trackOnboardingStepCompleted).toHaveBeenCalledWith(3, [
      "defi",
    ]);
    expect(readSegmentState()?.interests).toEqual(["defi"]);
  });
});

describe("/start intake — E7 route override + a11y", () => {
  it("browse-all on the final screen fires route_accepted(false) and navigates away", () => {
    renderStart();
    tap(/shipped apps with JavaScript/i);
    tap(/Land a Solana developer role/i);
    tap(/^Skip$/i);
    fireEvent.click(
      screen.getByRole("button", { name: /browse all courses/i })
    );

    expect(events.trackOnboardingRouteAccepted).toHaveBeenCalledWith(
      false,
      "course-solana-fundamentals"
    );
    expect(push).toHaveBeenCalledWith("/en/courses");
    expect(events.trackOnboardingCompleted).not.toHaveBeenCalled();
  });

  it("exposes a progressbar and a back affordance after step 1", () => {
    renderStart();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1"
    );
    // No back button on the first screen.
    expect(screen.queryByRole("button", { name: /go back/i })).toBeNull();

    tap(/shipped apps with JavaScript/i);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "2"
    );
    const back = screen.getByRole("button", { name: /go back/i });
    fireEvent.click(back);
    // Back returns to screen 1 without re-firing onboarding_started.
    expect(
      screen.getByRole("heading", { name: /have you shipped code before/i })
    ).toBeInTheDocument();
    expect(events.trackOnboardingStarted).toHaveBeenCalledTimes(1);
  });
});
