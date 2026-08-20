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
});
