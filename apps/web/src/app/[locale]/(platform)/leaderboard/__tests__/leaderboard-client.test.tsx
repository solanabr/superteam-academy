// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { CohortLeague } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { LeaderboardClient } from "../leaderboard-client";

const cohort: CohortLeague = {
  tier: 1,
  weekStart: "2026-07-27",
  memberCount: 2,
  entries: [
    {
      userId: "u1",
      username: "alice",
      avatarUrl: null,
      score: 1275,
      rank: 1,
      isYou: true,
    },
    {
      userId: "u2",
      username: "bob",
      avatarUrl: null,
      score: 300,
      rank: 2,
      isYou: false,
    },
  ],
};

function renderClient(initialCohort: CohortLeague | null) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LeaderboardClient
        initialGlobalEntries={[]}
        initialCohort={initialCohort}
        currentUserId="u1"
      />
    </NextIntlClientProvider>
  );
}

describe("LeaderboardClient — league framing + scoring info (#789)", () => {
  it("defaults to the League board and leads the subtitle with 'This week'", () => {
    renderClient(cohort);
    // "This week · 2 learners · resets Monday" — the weekly qualifier is present.
    expect(screen.getByText(/This week/)).toBeInTheDocument();
    expect(screen.getByText(/2 learners/)).toBeInTheDocument();
  });

  it("renders league scores with the weekly '+X XP' framing", () => {
    renderClient(cohort);
    expect(screen.getByText("+1,275 XP")).toBeInTheDocument();
    expect(screen.getByText("+300 XP")).toBeInTheDocument();
  });

  it("exposes the league-scoring info affordance with an accessible label", () => {
    renderClient(cohort);
    expect(
      screen.getByRole("button", { name: "About league scoring" })
    ).toBeInTheDocument();
  });

  it("has honest scoring copy: weekly + eligible-sources-only, bonuses excluded", () => {
    // The tooltip content is portalled on open; pin the copy at the message
    // layer so the honest framing (weekly, learning-only, bonuses excluded)
    // can't silently drift.
    const copy = messages.gamification.leagueScoringInfo;
    expect(copy).toMatch(/this week/i);
    expect(copy).toMatch(/lessons/i);
    expect(copy).toMatch(/[Bb]onuses.*(don't|do not) count/);
  });

  it("does not show the League board for anon visitors with no cohort", () => {
    renderClient(null);
    // Falls back to the global board; the sign-in prompt is the league empty
    // state and must not appear as a default.
    expect(
      screen.queryByRole("button", { name: "About league scoring" })
    ).not.toBeInTheDocument();
  });
});
