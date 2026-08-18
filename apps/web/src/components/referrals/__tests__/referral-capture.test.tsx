// @vitest-environment jsdom
/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  auth: {
    user: null as { id: string } | null,
    profile: null,
    isLoading: false,
  },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => h.searchParams,
}));
vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => h.auth,
}));

import { ReferralCapture } from "../referral-capture";

const STORAGE_KEY = "st-referral";

function stored(): { code: string; capturedAt: number } | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  h.searchParams = new URLSearchParams();
  h.auth = { user: null, profile: null, isLoading: false };
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ outcome: "claimed" }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReferralCapture", () => {
  it("stores a well-formed ?ref= code; ignores garbage", () => {
    h.searchParams = new URLSearchParams("ref=abcd1234");
    render(<ReferralCapture />);
    expect(stored()?.code).toBe("abcd1234");

    window.localStorage.clear();
    h.searchParams = new URLSearchParams("ref=<script>x");
    render(<ReferralCapture />);
    expect(stored()).toBeNull();
  });

  it("the first captured code wins — a later ?ref= visit cannot overwrite a pending claim", () => {
    h.searchParams = new URLSearchParams("ref=abcd1234");
    render(<ReferralCapture />);
    h.searchParams = new URLSearchParams("ref=ffff0000");
    render(<ReferralCapture />);
    expect(stored()?.code).toBe("abcd1234");
  });

  it("claims once a session exists and clears the code on a terminal outcome", async () => {
    h.searchParams = new URLSearchParams("ref=abcd1234");
    h.auth = { user: { id: "u1" }, profile: null, isLoading: false };

    render(<ReferralCapture />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/referrals/claim",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ code: "abcd1234" }),
      })
    );
    await waitFor(() => expect(stored()).toBeNull());
  });

  it("keeps the code when the server errors, so a later visit can retry", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 500 }));
    h.searchParams = new URLSearchParams("ref=abcd1234");
    h.auth = { user: { id: "u1" }, profile: null, isLoading: false };

    render(<ReferralCapture />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(stored()?.code).toBe("abcd1234");
  });

  it("does not claim while signed out or while auth is still loading", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ code: "abcd1234", capturedAt: Date.now() })
    );

    render(<ReferralCapture />);
    expect(fetchMock).not.toHaveBeenCalled();

    h.auth = { user: { id: "u1" }, profile: null, isLoading: true };
    render(<ReferralCapture />);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops an expired stored code instead of claiming it", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        code: "abcd1234",
        capturedAt: Date.now() - 91 * 24 * 60 * 60 * 1000,
      })
    );
    h.auth = { user: { id: "u1" }, profile: null, isLoading: false };

    render(<ReferralCapture />);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(stored()).toBeNull();
  });
});
