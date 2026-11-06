/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { rpc, list, remove } = vi.hoisted(() => ({
  rpc: vi.fn<(fn: string, args: unknown) => Promise<unknown>>(),
  list: vi.fn<(path: string) => Promise<unknown>>(),
  remove: vi.fn<(paths: string[]) => Promise<{ error: unknown }>>(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc,
    storage: { from: () => ({ list, remove }) },
  }),
}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { CRON_SECRET: "secret" },
}));
vi.mock("@/lib/logging", () => ({ logEvent: vi.fn() }));

import { GET } from "../route";

const request = (authorization?: string) =>
  new NextRequest("https://example.com/api/cron/account-retention", {
    headers: authorization ? { authorization } : {},
  });

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
  rpc.mockImplementation(async (fn: string) =>
    fn === "purge_ai_spend_ip_rows"
      ? { data: 3, error: null }
      : { data: ["user-1", "user-2"], error: null }
  );
  list.mockResolvedValue({ data: [{ name: "avatar.jpg" }], error: null });
  remove.mockResolvedValue({ error: null });
});

describe("GET /api/cron/account-retention", () => {
  it("purges with the configured window and reports the count", async () => {
    const res = await GET(request("Bearer secret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      job: "account-retention",
      purged: 3,
      avatarsRemoved: 2,
      avatarsFailed: 0,
    });
    expect(rpc).toHaveBeenCalledWith("purge_ai_spend_ip_rows", {
      p_keep_days: 30,
    });
  });

  it("finishes avatar removal for accounts whose route call couldn't", async () => {
    await GET(request("Bearer secret"));

    expect(list).toHaveBeenCalledWith("user-1");
    expect(remove).toHaveBeenCalledWith(["user-1/avatar.jpg"]);
    expect(remove).toHaveBeenCalledWith(["user-2/avatar.jpg"]);
  });

  it("one account's storage failure doesn't stop the others", async () => {
    remove.mockResolvedValueOnce({ error: { message: "x" } });

    const res = await GET(request("Bearer secret"));

    expect(await res.json()).toMatchObject({
      avatarsRemoved: 1,
      avatarsFailed: 1,
    });
  });

  it("refuses a caller without the cron secret", async () => {
    const res = await GET(request());

    expect(res.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reports a failed purge", async () => {
    rpc.mockImplementation(async () => ({
      data: null,
      error: { message: "boom" },
    }));

    const res = await GET(request("Bearer secret"));

    expect(res.status).toBe(500);
  });

  it("is scheduled", () => {
    const vercel = JSON.parse(
      readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")
    ) as { crons: { path: string }[] };

    expect(vercel.crons.map((c) => c.path)).toContain(
      "/api/cron/account-retention"
    );
  });
});
