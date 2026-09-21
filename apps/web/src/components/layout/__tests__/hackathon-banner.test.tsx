// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { HackathonBanner } from "../hackathon-banner";

/**
 * The top-of-app hackathon promo (owner 2026-09-21): register externally, take
 * the prep course in-app, and never re-nag once dismissed.
 */
const DISMISS_KEY = "hackathon-banner-dismissed:v1";
const HACKATHON_URL = "https://hackathon.superteam.com.br/";

function renderBanner(): ReturnType<typeof render> {
  const ui: ReactElement = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <HackathonBanner />
    </NextIntlClientProvider>
  );
  return render(ui);
}

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(cleanup);

describe("HackathonBanner", () => {
  it("registers to the external hackathon URL in a new tab, safely", () => {
    renderBanner();
    const register = screen.getByRole("link", { name: /Register/ });
    expect(register).toHaveAttribute("href", HACKATHON_URL);
    expect(register).toHaveAttribute("target", "_blank");
    // No reverse-tabnabbing on an external target.
    expect(register).toHaveAttribute(
      "rel",
      expect.stringContaining("noopener")
    );
  });

  it("the Register label is a FIXED dark ink, not the theme-flipping --text (dark-mode bug)", () => {
    renderBanner();
    const register = screen.getByRole("link", { name: /Register/ });
    // The pill is white in both themes, so its label must be black in both —
    // `var(--text)` turns near-white on dark and made the label invisible.
    expect(register.className).toContain("text-[#1c1917]");
    expect(register.className).not.toContain("var(--text)");
  });

  it("links the prep course in-app, locale-aware (no full-page URL)", () => {
    renderBanner();
    const course = screen.getByRole("link", { name: /prep course/ });
    expect(course).toHaveAttribute(
      "href",
      "/en/courses/solana-hackathon-expert"
    );
    // Internal — must NOT be an absolute link that leaves the SPA.
    expect(course.getAttribute("href")).not.toMatch(/^https?:/);
  });

  it("dismisses, remembers it, and stays gone on the next mount", () => {
    renderBanner();
    expect(screen.getByText(messages.hackathonBanner.message)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(
      screen.queryByText(messages.hackathonBanner.message)
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem(DISMISS_KEY)).toBe("1");

    // Fresh mount with the dismissal persisted → the bar never appears.
    cleanup();
    renderBanner();
    expect(
      screen.queryByText(messages.hackathonBanner.message)
    ).not.toBeInTheDocument();
  });

  it("shows for a visitor who has not dismissed it", () => {
    renderBanner();
    expect(screen.getByText(messages.hackathonBanner.message)).toBeVisible();
    expect(screen.getByRole("link", { name: /Register/ })).toBeVisible();
  });

  it("carries the decorative Crypto World's Fair top strip and the Colosseum seal", () => {
    const { container } = renderBanner();
    // The painterly top piece (a next/image; its src keeps the asset name even
    // through the image-optimizer URL).
    expect(
      container.querySelector('img[src*="crypto-worlds-fair"]')
    ).not.toBeNull();
    // The seal that replaced the trophy — anchored on its named gradient so the
    // assertion doesn't match the CTA's arrow/X icons.
    expect(container.querySelector("#cseal-wax")).not.toBeNull();
  });
});
