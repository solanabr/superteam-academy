import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CREDENTIAL_ISSUER_NAME,
  buildLinkedInAddToProfileUrl,
  buildXShareIntentUrl,
  trackCredentialShareClick,
} from "../share";

const { trackEvent } = vi.hoisted(() => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent }));

beforeEach(() => {
  trackEvent.mockClear();
});

describe("buildLinkedInAddToProfileUrl", () => {
  it("builds the documented Add-to-Profile deep link with every field prefilled", () => {
    const href = buildLinkedInAddToProfileUrl({
      name: "Solana Fundamentals",
      organizationName: CREDENTIAL_ISSUER_NAME,
      issueYear: 2026,
      issueMonth: 7,
      certUrl: "https://academy.example.com/en/certificates/cert-1",
      certId: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    });
    const url = new URL(href);
    expect(url.origin).toBe("https://www.linkedin.com");
    expect(url.pathname).toBe("/profile/add");
    expect(url.searchParams.get("startTask")).toBe("CERTIFICATION_NAME");
    expect(url.searchParams.get("name")).toBe("Solana Fundamentals");
    expect(url.searchParams.get("organizationName")).toBe("Superteam Academy");
    expect(url.searchParams.get("issueYear")).toBe("2026");
    expect(url.searchParams.get("issueMonth")).toBe("7");
    expect(url.searchParams.get("certUrl")).toBe(
      "https://academy.example.com/en/certificates/cert-1"
    );
    expect(url.searchParams.get("certId")).toBe(
      "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
    );
    // organizationId and organizationName are mutually exclusive — we never
    // send an organizationId, and credentials never expire.
    expect(url.searchParams.has("organizationId")).toBe(false);
    expect(url.searchParams.has("expirationYear")).toBe(false);
    expect(url.searchParams.has("expirationMonth")).toBe(false);
  });

  it("omits certId while the mint address is not yet known", () => {
    const href = buildLinkedInAddToProfileUrl({
      name: "Solana Fundamentals",
      organizationName: CREDENTIAL_ISSUER_NAME,
      issueYear: 2026,
      issueMonth: 1,
      certUrl: "https://academy.example.com/en/certificates/cert-1",
    });
    expect(new URL(href).searchParams.has("certId")).toBe(false);
  });
});

describe("buildXShareIntentUrl", () => {
  it("builds the X web intent with text and url params", () => {
    const href = buildXShareIntentUrl(
      "I earned a certificate",
      "https://academy.example.com/en/certificates/cert-1"
    );
    const url = new URL(href);
    expect(url.origin).toBe("https://x.com");
    expect(url.pathname).toBe("/intent/tweet");
    expect(url.searchParams.get("text")).toBe("I earned a certificate");
    expect(url.searchParams.get("url")).toBe(
      "https://academy.example.com/en/certificates/cert-1"
    );
  });
});

describe("trackCredentialShareClick", () => {
  it("fires credential_share_click with channel, source, and courseId", () => {
    trackCredentialShareClick("linkedin_add", "certificate_page", "solana-101");
    expect(trackEvent).toHaveBeenCalledWith("credential_share_click", {
      channel: "linkedin_add",
      source: "certificate_page",
      courseId: "solana-101",
    });
  });

  it("omits courseId when unknown", () => {
    trackCredentialShareClick("x", "mint_success");
    expect(trackEvent).toHaveBeenCalledWith("credential_share_click", {
      channel: "x",
      source: "mint_success",
    });
  });
});
