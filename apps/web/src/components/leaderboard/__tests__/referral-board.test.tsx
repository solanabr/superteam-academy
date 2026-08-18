// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

import { ReferralBoard } from "../referral-board";

/**
 * The sharing surface must be unconditional. The board's whole job is that a
 * signed-in learner leaves with their link/code — so the card renders before,
 * and independently of, the standings fetch. The regression pinned here: an
 * unapplied migration 500'd /api/referrals/leaderboard and the ENTIRE tab
 * collapsed to an XP-flavored empty state, sharing surface included.
 */

const fetchMock = vi.fn();

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function mockEndpoints({
  me,
  leaderboard,
}: {
  me: Response | Promise<Response>;
  leaderboard: Response | Promise<Response>;
}) {
  fetchMock.mockImplementation((url: string) =>
    Promise.resolve(url.includes("/api/referrals/me") ? me : leaderboard)
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReferralBoard — sharing surface", () => {
  it("shows link, code, and share actions even when the standings API is down", async () => {
    mockEndpoints({
      me: new Response(
        JSON.stringify({
          code: "abcd1234",
          seasonPoints: 3,
          referredSignups: 2,
        })
      ),
      leaderboard: new Response("{}", { status: 500 }),
    });

    renderWithIntl(<ReferralBoard currentUserId="u1" />);

    // The code is visible and both copy affordances exist.
    expect(await screen.findByText("abcd1234")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.gamification.copyLink })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: messages.gamification.copyCode })
    ).toBeInTheDocument();

    // The X share intent carries the link.
    const share = screen.getByRole("link", {
      name: new RegExp(messages.gamification.shareOnX),
    });
    expect(share.getAttribute("href")).toContain("twitter.com/intent/tweet");
    expect(share.getAttribute("href")).toContain("abcd1234");

    // The standings failure shows the referral empty state, not the XP one.
    expect(
      await screen.findByText(messages.gamification.referralNoEntries)
    ).toBeInTheDocument();
  });

  it("tells a signed-out visitor how to get a link instead of hiding the card", async () => {
    mockEndpoints({
      me: new Response("{}", { status: 401 }),
      leaderboard: new Response(
        JSON.stringify({ season: null, standings: [] })
      ),
    });

    renderWithIntl(<ReferralBoard currentUserId="" />);

    expect(
      await screen.findByText(messages.gamification.referralSignIn)
    ).toBeInTheDocument();
    // No /me call for anonymous visitors — the card is informational only.
    expect(
      fetchMock.mock.calls.every(
        ([url]) => !String(url).includes("/api/referrals/me")
      )
    ).toBe(true);
  });
});
