// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { EarnHandoffCard } from "../earn-handoff-card";
import messages from "@/messages/en.json";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent }));

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  trackEvent.mockClear();
});

describe("EarnHandoffCard — curated category links", () => {
  it("links only to Superteam Earn category/section pages (zero bounty deep links)", () => {
    renderWithIntl(<EarnHandoffCard source="mint_success" />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "https://superteam.fun/earn/category/development/",
      "https://superteam.fun/earn/category/content/",
      "https://superteam.fun/earn/grants/",
    ]);
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      // Accept criterion: bounty listings are ephemeral — never deep-link one
      expect(href).not.toMatch(/\/listing|\/bounty|\/t\//);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("is a labelled section with the new-tab hint on every link", () => {
    renderWithIntl(<EarnHandoffCard source="certificate_page" />);
    expect(
      screen.getByRole("region", {
        name: "Turn your credential into paid work",
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText("(opens in a new tab)")).toHaveLength(3);
  });
});

describe("EarnHandoffCard — copy guardrails", () => {
  it("makes the verified promise, never an employment claim", () => {
    const { container } = renderWithIntl(
      <EarnHandoffCard source="mint_success" />
    );
    expect(
      screen.getByText(/first \$500–\$5,000 of paid Solana work/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Brazil grants average \$5\.5k/)
    ).toBeInTheDocument();
    const text = container.textContent ?? "";
    for (const banned of [/job/i, /career/i, /hire/i, /learn to earn/i]) {
      expect(text).not.toMatch(banned);
    }
  });
});

describe("EarnHandoffCard — E8 instrumentation", () => {
  it("fires earn_handoff_click with category, source, and courseId", () => {
    renderWithIntl(
      <EarnHandoffCard source="mint_success" courseId="solana-101" />
    );
    fireEvent.click(screen.getByRole("link", { name: /Development bounties/ }));
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("earn_handoff_click", {
      category: "development",
      source: "mint_success",
      courseId: "solana-101",
    });
  });

  it("omits courseId when unknown and records the surface", () => {
    renderWithIntl(<EarnHandoffCard source="certificate_page" />);
    fireEvent.click(screen.getByRole("link", { name: /Grants/ }));
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("earn_handoff_click", {
      category: "grants",
      source: "certificate_page",
    });
  });
});
