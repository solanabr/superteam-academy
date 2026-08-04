// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { truncateAddress } from "@/lib/utils";
import messages from "@/messages/en.json";
import { InstructorCard } from "../instructor-card";

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
          displayName: null,
          verified: false,
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
          displayName: null,
          verified: false,
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

describe("InstructorCard — teacher identity (#997)", () => {
  const base = {
    username: "brave-anchor-9000",
    displayName: null as string | null,
    verified: false,
    avatarUrl: null,
    bio: null,
    socialLinks: null,
  };

  it("shows the admin-set display name instead of the generated username", () => {
    renderWithIntl(
      <InstructorCard
        creatorWallet={WALLET}
        profile={{ ...base, displayName: "Ana Souza" }}
      />
    );

    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(screen.queryByText("brave-anchor-9000")).not.toBeInTheDocument();
  });

  it("still links by USERNAME — display names are not unique or route-safe", () => {
    renderWithIntl(
      <InstructorCard
        creatorWallet={WALLET}
        profile={{ ...base, displayName: "Ana Souza" }}
      />
    );

    expect(screen.getByRole("link", { name: "Ana Souza" })).toHaveAttribute(
      "href",
      "/en/profile/brave-anchor-9000"
    );
  });

  it("falls back to the username when no display name is set", () => {
    renderWithIntl(<InstructorCard creatorWallet={WALLET} profile={base} />);
    expect(screen.getByText("brave-anchor-9000")).toBeInTheDocument();
  });

  it("renders the verified badge with an accessible label, not an unlabelled icon", () => {
    renderWithIntl(
      <InstructorCard
        creatorWallet={WALLET}
        profile={{ ...base, verified: true }}
      />
    );

    // "Verified" is a trust claim — a screen-reader user must receive it too.
    expect(
      screen.getByRole("img", { name: /verified teacher/i })
    ).toBeInTheDocument();
  });

  it("shows NO badge for an unverified teacher", () => {
    renderWithIntl(<InstructorCard creatorWallet={WALLET} profile={base} />);
    expect(screen.queryByRole("img", { name: /verified/i })).toBeNull();
  });
});
