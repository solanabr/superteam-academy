/* eslint-disable import/order -- vi.mock must hoist above the imports it stubs */
import { describe, it, expect, vi, afterEach } from "vitest";

// F3: TEACH_PREVIEW_PASSWORD no longer falls back to the literal "123", so an
// unconfigured deployment must FAIL CLOSED (503) instead of accepting a
// well-known password.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: vi.fn(async () => false),
  getClientIp: () => "127.0.0.1",
}));

import { NextRequest } from "next/server";
import { POST } from "../route";

function postWith(password: unknown): NextRequest {
  return new NextRequest("https://example.test/api/teach/preview/auth", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

describe("POST /api/teach/preview/auth", () => {
  afterEach(() => {
    delete process.env.TEACH_PREVIEW_PASSWORD;
    vi.restoreAllMocks();
  });

  it("503s (and logs) when TEACH_PREVIEW_PASSWORD is unset — no default password", async () => {
    delete process.env.TEACH_PREVIEW_PASSWORD;
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(postWith("123"));
    expect(res.status).toBe(503);
    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining("TEACH_PREVIEW_PASSWORD")
    );
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("401s on a wrong password once configured", async () => {
    process.env.TEACH_PREVIEW_PASSWORD = "s3cret";
    const res = await POST(postWith("123"));
    expect(res.status).toBe(401);
  });

  it("mints a session cookie on the configured password", async () => {
    process.env.TEACH_PREVIEW_PASSWORD = "s3cret";
    const res = await POST(postWith("s3cret"));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("teach_preview_session=");
  });
});
