// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { InstructorCard } from "../instructor-card";
import { truncateAddress } from "@/lib/utils";
import messages from "@/messages/en.json";

const WALLET = "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("InstructorCard — no public profile", () => {
  it("renders a truncated-wallet fallback, never a blank instructor section", () => {
    renderWithIntl(<InstructorCard creatorWallet={WALLET} profile={null} />);
    expect(screen.getByText(truncateAddress(WALLET))).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("InstructorCard — resolved public profile", () => {
  it("renders username (linked to the public profile), bio, and socials — not the raw wallet", () => {
    renderWithIntl(
      <InstructorCard
        creatorWallet={WALLET}
        profile={{
          username: "alice",
          avatarUrl: "https://example.com/a.png",
          bio: "Rust developer",
          socialLinks: { twitter: "alice_dev", github: "alice" },
        }}
      />
    );

    const nameLink = screen.getByRole("link", { name: "alice" });
    expect(nameLink).toHaveAttribute("href", "/en/profile/alice");
    expect(screen.getByText("Rust developer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /X$/ })).toHaveAttribute(
      "href",
      "https://x.com/alice_dev"
    );
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/alice"
    );
    expect(screen.queryByText(truncateAddress(WALLET))).not.toBeInTheDocument();
  });

  it("omits the bio line and socials row when the profile has neither", () => {
    renderWithIntl(
      <InstructorCard
        creatorWallet={WALLET}
        profile={{
          username: "bob",
          avatarUrl: null,
          bio: null,
          socialLinks: null,
        }}
      />
    );
    expect(screen.getByRole("link", { name: "bob" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /GitHub/ })
    ).not.toBeInTheDocument();
  });
});
