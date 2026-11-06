/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { rpc } = vi.hoisted(() => ({
  rpc: vi.fn<(fn: string, args: unknown) => Promise<unknown>>(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { CRON_SECRET: "secret" },
}));
vi.mock("@/lib/logging", () => ({ logEvent: vi.fn() }));

import { GET } from "../route";

const request = (authorization?: string) =>
  new NextRequest("https://example.com/api/cron/ai-ip-retention", {
    headers: authorization ? { authorization } : {},
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
  rpc.mockResolvedValue({ data: 3, error: null });
});

describe("GET /api/cron/ai-ip-retention", () => {
  it("purges with the configured window and reports the count", async () => {
    const res = await GET(request("Bearer secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ job: "ai-ip-retention", purged: 3 });
    expect(rpc).toHaveBeenCalledWith("purge_ai_spend_ip_rows", {
      p_keep_days: 30,
    });
  });

  it("refuses a caller without the cron secret", async () => {
    const res = await GET(request());

    expect(res.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reports a failed purge", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const res = await GET(request("Bearer secret"));

    expect(res.status).toBe(500);
  });

  it("is scheduled", () => {
    const vercel = JSON.parse(
      readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")
    ) as { crons: { path: string }[] };

    expect(vercel.crons.map((c) => c.path)).toContain(
      "/api/cron/ai-ip-retention"
    );
  });
});
