// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ActivityItem } from "@/lib/dashboard/types";
import messages from "@/messages/en.json";
import { ActivitySection } from "../activity-section";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("ActivitySection", () => {
  const items: ActivityItem[] = [
    {
      type: "lesson",
      action: "Completed lesson: What is a PDA?",
      xp: 25,
      time: new Date().toISOString(),
      href: "/courses/solana-101/lessons/what-is-a-pda",
      txSignature: "5igNaTure",
    },
    {
      type: "enrollment",
      action: "Enrolled in Solana 101",
      xp: 0,
      time: new Date().toISOString(),
      href: "/courses/solana-101",
      txSignature: null,
    },
  ];

  it("renders the feed with XP badge and an explorer link for on-chain items", () => {
    renderWithIntl(<ActivitySection recentActivity={items} />);
    expect(
      screen.getByText("Completed lesson: What is a PDA?")
    ).toBeInTheDocument();
    expect(screen.getByText("+25 XP")).toBeInTheDocument();
    const explorerLink = screen
      .getByText("Completed lesson: What is a PDA?")
      .closest("a");
    expect(explorerLink).toHaveAttribute(
      "href",
      "https://explorer.solana.com/tx/5igNaTure?cluster=devnet"
    );
    // Items without a tx signature render as plain rows, not links
    expect(screen.getByText("Enrolled in Solana 101").closest("a")).toBeNull();
  });

  it("hides the pager when everything fits on one page", () => {
    renderWithIntl(<ActivitySection recentActivity={items} />);
    expect(screen.queryByLabelText("Previous")).toBeNull();
    expect(screen.queryByLabelText("Next")).toBeNull();
  });

  it("renders the empty state when there is no activity", () => {
    renderWithIntl(<ActivitySection recentActivity={[]} />);
    expect(screen.getByText("No recent activity")).toBeInTheDocument();
  });

  // Empty states use the LOCKED treatment (owner, 21-08): "nothing here yet" is
  // the same statement a not-yet-earned patch makes, so it borrows that
  // construction rather than a duotone illustration.
  it("gives the empty state a dashed empty-variant chip, not a Phosphor icon", () => {
    const { container } = renderWithIntl(
      <ActivitySection recentActivity={[]} />
    );

    const chip = container.querySelector(".act-empty .chip");
    expect(chip).not.toBeNull();
    expect(chip!.hasAttribute("data-empty")).toBe(true);
    // An empty state has no category to colour.
    expect(chip!.hasAttribute("data-cat")).toBe(false);
    expect(chip!.getAttribute("data-size")).toBe("48");
    // Decorative — the copy carries the meaning.
    expect(chip!.getAttribute("aria-hidden")).toBe("true");
    expect(
      chip!.querySelector("[data-glyph]")!.getAttribute("data-glyph")
    ).toBe("⚡");
  });

  // The empty state keeps its own card shell (`.act-empty` carries the
  // background/border/shadow in globals.css) — it went card-less briefly on
  // 22-08 and the owner reversed that after seeing it live. What stays true
  // either way: it is not the `.act-panel` feed shell, and there is no pager.
  it("renders the empty state in its own container, not the feed panel", () => {
    const { container } = renderWithIntl(
      <ActivitySection recentActivity={[]} />
    );

    expect(container.querySelector(".act-empty")).not.toBeNull();
    expect(container.querySelector(".act-panel")).toBeNull();
    expect(container.querySelector(".act-pager")).toBeNull();
    // The heading survives either way.
    expect(
      screen.getByText(messages.dashboard.recentActivity)
    ).toBeInTheDocument();
  });

  it("renders the feed panel when there IS activity", () => {
    const { container } = renderWithIntl(
      <ActivitySection recentActivity={items} />
    );

    expect(container.querySelector(".act-panel")).not.toBeNull();
    expect(container.querySelector(".act-empty")).toBeNull();
  });

  it("keeps a populated feed's chips coloured, unlike the empty one", () => {
    const { container } = renderWithIntl(
      <ActivitySection recentActivity={items} />
    );

    const chip = container.querySelector(".act-row .chip");
    expect(chip!.hasAttribute("data-empty")).toBe(false);
    expect(chip!.hasAttribute("data-cat")).toBe(true);
  });
});
