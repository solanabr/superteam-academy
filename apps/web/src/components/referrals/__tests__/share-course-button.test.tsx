// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

import { ShareCourseButton } from "../share-course-button";

const ORIGIN = "https://academy.test";

function mockCodeResponse(ok: boolean, code = "53c87922") {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: async () => (ok ? { code } : { error: "Unauthorized" }),
    })
  );
}

describe("ShareCourseButton", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, "location", {
      value: { origin: ORIGIN, search: "" },
      writable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    // No native share sheet by default — the desktop path.
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shares the course link carrying the viewer's referral code", async () => {
    mockCodeResponse(true);
    render(
      <ShareCourseButton courseSlug="solana-101" courseTitle="Solana 101" />
    );
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith("/api/referrals/me")
    );

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]![0]).toContain(
      `${ORIGIN}/en/courses/solana-101?ref=53c87922`
    );
  });

  it("still shares a plain course link when the viewer has no code", async () => {
    // Signed out — /api/referrals/me 401s. The control must not go dead.
    mockCodeResponse(false);
    render(
      <ShareCourseButton courseSlug="solana-101" courseTitle="Solana 101" />
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const shared = writeText.mock.calls[0]![0] as string;
    expect(shared).toContain(`${ORIGIN}/en/courses/solana-101`);
    expect(shared).not.toContain("?ref=");
  });

  it("prefers the native share sheet where the platform has one", async () => {
    mockCodeResponse(true);
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: share,
      configurable: true,
    });

    render(
      <ShareCourseButton courseSlug="solana-101" courseTitle="Solana 101" />
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(share.mock.calls[0]![0].url).toBe(
      `${ORIGIN}/en/courses/solana-101?ref=53c87922`
    );
    // The sheet handled it, so nothing goes to the clipboard.
    expect(writeText).not.toHaveBeenCalled();
  });

  it("falls back to the clipboard when the share sheet is dismissed", async () => {
    mockCodeResponse(true);
    Object.defineProperty(navigator, "share", {
      value: vi.fn().mockRejectedValue(new Error("AbortError")),
      configurable: true,
    });

    render(
      <ShareCourseButton courseSlug="solana-101" courseTitle="Solana 101" />
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
  });
});
