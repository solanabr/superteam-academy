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
