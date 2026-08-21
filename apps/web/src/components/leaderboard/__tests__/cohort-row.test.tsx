// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { CohortLeaderboardEntry } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { CohortRow } from "../cohort-row";

function renderRow(entry: CohortLeaderboardEntry) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CohortRow entry={entry} />
    </NextIntlClientProvider>
  );
}

const base: CohortLeaderboardEntry = {
  userId: "u1",
  username: "alice",
  avatarUrl: null,
  score: 1275,
  rank: 3,
  isYou: false,
};

describe("CohortRow — weekly XP framing (#789)", () => {
  it("frames the league score as earned-this-week with a '+' prefix", () => {
    renderRow(base);
    // Visible value carries the '+' so it reads as points earned this period,
    // not the lifetime header total.
    expect(screen.getByText("+1,275 XP")).toBeInTheDocument();
  });

  it("gives the score an accessible 'earned this week' label", () => {
    renderRow(base);
    expect(
      screen.getByLabelText("1,275 XP earned this week")
    ).toBeInTheDocument();
  });

  it("still frames a zero-eligible score as weekly (not a bare lifetime-looking 0)", () => {
    renderRow({ ...base, score: 0 });
    expect(screen.getByText("+0 XP")).toBeInTheDocument();
    expect(screen.getByLabelText("0 XP earned this week")).toBeInTheDocument();
  });

  it("renders an anonymized private member without leaking identity", () => {
    renderRow({ ...base, username: null, userId: null });
    expect(screen.getByText("Anonymous learner")).toBeInTheDocument();
    // Anonymized rows are not linkable.
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("labels the viewer's own row 'You' while keeping the weekly framing", () => {
    renderRow({ ...base, isYou: true });
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("+1,275 XP")).toBeInTheDocument();
  });
});

// The 40cd9caf spec: ranks 1-3 keep a solid card and a notched rank tab, and
// ranks 4+ drop to a dashed outline that only reads correctly against that
// solid top three. CohortRow shipped with neither half, so the League tab —
// which has no separate podium and renders rank 1 downward as rows — went
// fully dashed (owner, 21-08).

describe("CohortRow — podium contrast (40cd9caf spec)", () => {
  function row(container: HTMLElement): HTMLElement {
    return container.querySelector(".lb-row") as HTMLElement;
  }

  it.each([1, 2, 3])("marks rank %i as top: solid card + rank tab", (rank) => {
    const { container } = renderRow({ ...base, rank });

    expect(row(container).hasAttribute("data-top")).toBe(true);
    const tab = container.querySelector(".rank-tab");
    expect(tab).not.toBeNull();
    expect(tab!.getAttribute("data-rank")).toBe(String(rank));
    expect(container.querySelector(".lb-rank")).toBeNull();
  });

  it.each([4, 5, 27])("leaves rank %i dashed: bare numeral, no tab", (rank) => {
    const { container } = renderRow({ ...base, rank });

    expect(row(container).hasAttribute("data-top")).toBe(false);
    expect(container.querySelector(".rank-tab")).toBeNull();
    expect(container.querySelector(".lb-rank")!.textContent).toBe(String(rank));
  });

  it("keeps the rank accessible in both treatments", () => {
    const { unmount } = renderRow({ ...base, rank: 1 });
    expect(screen.getByLabelText("Rank 1")).toBeInTheDocument();
    unmount();

    renderRow({ ...base, rank: 9 });
    expect(screen.getByLabelText("Rank 9")).toBeInTheDocument();
  });

  it("shows the ordinal suffix on the tab", () => {
    const { container } = renderRow({ ...base, rank: 2 });
    expect(container.querySelector(".rank-tab-num")!.textContent).toBe("2");
    expect(container.querySelector(".rank-tab-ord")!.textContent).toBe("ND");
  });
});
