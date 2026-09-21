// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { HackathonHero } from "../hackathon-hero";

/**
 * The single centred Solana Hackathon banner on the landing page (owner
 * 2026-09-21). The Crypto World's Fair wordmark as the card's title, and two
 * CTAs: register (external) and the prep course (in-app).
 */
const HACKATHON_URL = "https://hackathon.superteam.com.br/";

function renderHero(): ReturnType<typeof render> {
  const ui: ReactElement = (
    <NextIntlClientProvider locale="en" messages={messages}>
      <HackathonHero />
    </NextIntlClientProvider>
  );
  return render(ui);
}

afterEach(cleanup);

describe("HackathonHero", () => {
  it("shows the Crypto World's Fair wordmark as the card title (real alt, not decoration)", () => {
    renderHero();
    const wordmark = screen.getByRole("img", { name: "Crypto World's Fair" });
    expect(wordmark.getAttribute("src")).toContain(
      "crypto-worlds-fair-wordmark"
    );
  });

  it("registers to the external hackathon URL in a new tab, safely", () => {
    renderHero();
    const register = screen.getByRole("link", { name: /Register/ });
    expect(register).toHaveAttribute("href", HACKATHON_URL);
    expect(register).toHaveAttribute("target", "_blank");
    expect(register).toHaveAttribute(
      "rel",
      expect.stringContaining("noopener")
    );
  });

  it("links the prep course in-app, locale-aware (never leaves the SPA)", () => {
    renderHero();
    const course = screen.getByRole("link", { name: /prep course/ });
    expect(course).toHaveAttribute(
      "href",
      "/en/courses/solana-hackathon-expert"
    );
    expect(course.getAttribute("href")).not.toMatch(/^https?:/);
  });
});
