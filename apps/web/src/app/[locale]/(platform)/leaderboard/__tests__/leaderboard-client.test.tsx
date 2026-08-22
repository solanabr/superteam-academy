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
    // course_completion is an is_league_eligible_source — the enumeration must
    // name every eligible source, not silently omit one (#793).
    expect(copy).toMatch(/course completions/i);
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

// Icon sweep 21-08: the League header's primary-dim disc was the last legacy
// icon in the league surfaces. It becomes the same community chip the
// dashboard's league strip uses, so the two cards agree.

describe("LeaderboardClient — the league header icon", () => {
  it("uses the 40px community chip, not the legacy disc", () => {
    const { container } = renderClient(cohort);

    const chip = container.querySelector(".lb-league-head .chip");
    expect(chip).not.toBeNull();
    expect(chip!.getAttribute("data-cat")).toBe("community");
    // 40 keeps the header's presence; the dashboard strip's solo state uses 24.
    expect(chip!.getAttribute("data-size")).toBe("40");
    expect(
      chip!.querySelector("[data-glyph]")!.getAttribute("data-glyph")
    ).toBe("◍");
  });

  it("keeps it decorative — the tier name carries the meaning", () => {
    const { container } = renderClient(cohort);

    expect(
      container
        .querySelector(".lb-league-head .chip")!
        .getAttribute("aria-hidden")
    ).toBe("true");
    expect(container.querySelector(".lb-league-tier")).not.toBeNull();
  });

  it("leaves no league disc behind in the header", () => {
    const { container } = renderClient(cohort);
    expect(
      container.querySelector(".lb-league-head .lb-league-icon")
    ).toBeNull();
  });
});

// The League tab gets the Global board's podium (owner, 22-08). Before this it
// rendered rank 1 downward as `.lb-row`s, so the whole cohort wore the dashed
// rank-4+ treatment that only reads correctly against a solid podium.

function member(rank: number, over: Partial<CohortLeague["entries"][0]> = {}) {
  return {
    userId: `u${rank}`,
    username: `learner${rank}`,
    avatarUrl: null,
    score: 1000 - rank,
    rank,
    isYou: false,
    ...over,
  };
}

function league(entries: CohortLeague["entries"]): CohortLeague {
  return { tier: 1, weekStart: "2026-07-27", memberCount: 30, entries };
}

describe("LeaderboardClient — the League podium", () => {
  const five = league([member(1), member(2), member(3), member(4), member(5)]);

  it("puts ranks 1-3 on the podium and everything below in rows", () => {
    const { container } = renderClient(five);

    expect(container.querySelectorAll(".podium-card")).toHaveLength(3);
    expect(container.querySelectorAll(".lb-row")).toHaveLength(2);
  });

  it("gives the podium its gold/silver/bronze treatment", () => {
    const { container } = renderClient(five);

    expect(container.querySelector(".podium-card.gold")).not.toBeNull();
    expect(container.querySelector(".podium-card.silver")).not.toBeNull();
    expect(container.querySelector(".podium-card.bronze")).not.toBeNull();
  });

  it("stands the winner in the middle (2-1-3)", () => {
    const { container } = renderClient(five);

    const ranks = [...container.querySelectorAll(".podium-card")].map((card) =>
      card.querySelector(".rank-tab")?.getAttribute("data-rank")
    );
    expect(ranks).toEqual(["2", "1", "3"]);
  });

  it("leaves the rows below the podium dashed — no data-top", () => {
    const { container } = renderClient(five);

    for (const row of container.querySelectorAll(".lb-row")) {
      expect(row.hasAttribute("data-top")).toBe(false);
    }
  });

  it("keeps the weekly '+X XP' framing on the podium", () => {
    const { container } = renderClient(five);

    const first = container.querySelector(".podium-card.gold .podium-xp");
    expect(first?.textContent).toBe("+999 XP");
    expect(first?.getAttribute("aria-label")).toBe("999 XP earned this week");
  });
});

describe("LeaderboardClient — League podium edge cases", () => {
  it("renders a short cohort as a compact podium with no rows", () => {
    const { container } = renderClient(league([member(1), member(2)]));

    expect(container.querySelector(".podium-grid")).toHaveClass(
      "podium-compact"
    );
    expect(container.querySelectorAll(".podium-card")).toHaveLength(2);
    expect(container.querySelectorAll(".lb-row")).toHaveLength(0);
  });

  it("renders a single-member cohort without breaking", () => {
    const { container } = renderClient(league([member(1)]));

    expect(container.querySelectorAll(".podium-card")).toHaveLength(1);
    expect(container.querySelector(".podium-grid")).toHaveClass(
      "podium-compact"
    );
  });

  it("marks the viewer when they are ON the podium", () => {
    const { container } = renderClient(
      league([member(1, { isYou: true }), member(2), member(3), member(4)])
    );

    const me = container.querySelector(".podium-card.me");
    expect(me).not.toBeNull();
    expect(me).toHaveClass("gold");
    // …and not duplicated onto a row.
    expect(container.querySelector(".lb-row.me")).toBeNull();
  });

  it("marks the viewer when they are BELOW the podium", () => {
    const { container } = renderClient(
      league([member(1), member(2), member(3), member(4, { isYou: true })])
    );

    expect(container.querySelector(".podium-card.me")).toBeNull();
    expect(container.querySelector(".lb-row.me")).not.toBeNull();
  });

  it("anonymizes a private member on the podium without leaking identity", () => {
    const { container } = renderClient(
      league([
        member(1, { username: null, userId: null }),
        member(2),
        member(3),
      ])
    );

    const gold = container.querySelector(".podium-card.gold");
    expect(gold?.textContent).toContain("Anonymous learner");
    // An anonymized member is not linkable — the other two still are.
    expect(container.querySelectorAll(".podium-grid a")).toHaveLength(2);
  });
});
