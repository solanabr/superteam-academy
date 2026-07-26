// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { CredentialShareNudge } from "../credential-share-nudge";
import messages from "@/messages/en.json";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent }));

const MINT_ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

function renderNudge(overrides: { mintAddress?: string | null } = {}) {
  const mintAddress =
    "mintAddress" in overrides ? (overrides.mintAddress ?? null) : MINT_ADDRESS;
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CredentialShareNudge
        source="mint_success"
        courseId="solana-101"
        courseTitle="Solana Fundamentals"
        certificateId="cert-1"
        mintAddress={mintAddress}
        mintedAt={new Date(2026, 6, 25)}
      />
    </NextIntlClientProvider>
  );
}

function getLink(name: RegExp): HTMLAnchorElement {
  return screen.getByRole("link", { name }) as HTMLAnchorElement;
}

beforeEach(() => {
  trackEvent.mockClear();
});

describe("CredentialShareNudge — LinkedIn Add-to-Profile deep link", () => {
  it("prefills every documented field from data already on the page", () => {
    renderNudge();
    const url = new URL(getLink(/Add to your LinkedIn profile/).href);
    expect(url.origin).toBe("https://www.linkedin.com");
    expect(url.pathname).toBe("/profile/add");
    expect(url.searchParams.get("startTask")).toBe("CERTIFICATION_NAME");
    expect(url.searchParams.get("name")).toBe("Solana Fundamentals");
    expect(url.searchParams.get("organizationName")).toBe("Superteam Academy");
    expect(url.searchParams.get("issueYear")).toBe("2026");
    expect(url.searchParams.get("issueMonth")).toBe("7");
    expect(url.searchParams.get("certUrl")).toBe(
      `${window.location.origin}/en/certificates/cert-1`
    );
    expect(url.searchParams.get("certId")).toBe(MINT_ADDRESS);
  });

  it("omits certId while the webhook mint is still settling", () => {
    renderNudge({ mintAddress: null });
    const url = new URL(getLink(/Add to your LinkedIn profile/).href);
    expect(url.searchParams.has("certId")).toBe(false);
  });
});

describe("CredentialShareNudge — X share (owner decision: X is the ONLY share channel)", () => {
  it("shares via the X web intent pointing at the public certificate URL", () => {
    renderNudge();
    const url = new URL(getLink(/Share on X/).href);
    expect(url.origin).toBe("https://x.com");
    expect(url.pathname).toBe("/intent/tweet");
    expect(url.searchParams.get("url")).toBe(
      `${window.location.origin}/en/certificates/cert-1`
    );
    expect(url.searchParams.get("text")).toContain("Solana Fundamentals");
  });

  it("never renders a LinkedIn share-post URL", () => {
    renderNudge();
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href") ?? "";
      expect(href).not.toMatch(/linkedin\.com\/(shareArticle|sharing|share)/);
    }
  });
});

describe("CredentialShareNudge — a11y", () => {
  it("is a labelled section whose links open in a new tab with sr-only hints", () => {
    renderNudge();
    expect(
      screen.getByRole("region", { name: "Show off your credential" })
    ).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(screen.getAllByText("(opens in a new tab)")).toHaveLength(2);
  });
});

describe("CredentialShareNudge — copy guardrails (UIU-02 boundary)", () => {
  it("uses action language only — no evidence overclaims or employment promises", () => {
    const { container } = renderNudge();
    const text = container.textContent ?? "";
    for (const banned of [
      /peer[- ]?reviewed/i,
      /resume/i,
      /employment/i,
      /\bjob\b/i,
      /career/i,
      /hire/i,
    ]) {
      expect(text).not.toMatch(banned);
    }
  });
});

describe("CredentialShareNudge — instrumentation", () => {
  it("fires credential_share_click with the channel, surface, and course", () => {
    renderNudge();
    fireEvent.click(getLink(/Add to your LinkedIn profile/));
    expect(trackEvent).toHaveBeenCalledWith("credential_share_click", {
      channel: "linkedin_add",
      source: "mint_success",
      courseId: "solana-101",
    });
    fireEvent.click(getLink(/Share on X/));
    expect(trackEvent).toHaveBeenCalledWith("credential_share_click", {
      channel: "x",
      source: "mint_success",
      courseId: "solana-101",
    });
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });
});
