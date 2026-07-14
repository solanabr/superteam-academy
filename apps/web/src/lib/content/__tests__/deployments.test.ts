import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isSynced,
  toDeploymentMap,
  type DeploymentStatus,
} from "../deployments";

vi.mock("server-only", () => ({}));

// `unstable_cache` needs a request-scoped incremental cache that only exists
// inside a real Next.js request; outside one it throws
// "Invariant: incrementalCache missing" unconditionally. Stub it as a
// passthrough so these tests exercise `loadActiveDeploymentRows` itself
// rather than that unrelated environment invariant.
vi.mock("next/cache", () => ({
  unstable_cache:
    <Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) =>
    (...args: Args) =>
      fn(...args),
  revalidateTag: vi.fn(),
}));

function supabaseSelectResult(result: {
  data: DeploymentStatus[] | null;
  error: { message: string } | null;
}) {
  return {
    createClient: () => ({
      from: () => ({
        select: () => Promise.resolve(result),
      }),
    }),
  };
}

function row(over: Partial<DeploymentStatus>): DeploymentStatus {
  return {
    content_id: "course-x",
    kind: "course",
    status: "synced",
    is_active: true,
    achievement_pda: null,
    ...over,
  };
}

describe("isSynced — the entire public-visibility gate", () => {
  it("synced + active → visible", () => {
    expect(isSynced(row({ status: "synced", is_active: true }))).toBe(true);
  });

  it("synced + inactive → hidden", () => {
    expect(isSynced(row({ status: "synced", is_active: false }))).toBe(false);
  });

  it("synced + is_active null → visible (coalesce to true)", () => {
    expect(isSynced(row({ status: "synced", is_active: null }))).toBe(true);
  });

  it("not synced (pending/failed/null) → hidden regardless of active", () => {
    expect(isSynced(row({ status: "pending", is_active: true }))).toBe(false);
    expect(isSynced(row({ status: "failed", is_active: true }))).toBe(false);
    expect(isSynced(row({ status: null, is_active: true }))).toBe(false);
  });

  it("missing deployment (undefined) → hidden (fail-closed)", () => {
    expect(isSynced(undefined)).toBe(false);
  });
});

describe("toDeploymentMap — shaping the flat rows", () => {
  it("keys each row by content_id", () => {
    const rows = [
      row({ content_id: "course-a" }),
      row({ content_id: "course-b", status: "pending" }),
      row({ content_id: "achievement-x", kind: "achievement" }),
    ];
    const map = toDeploymentMap(rows);
    expect(map.size).toBe(3);
    expect(map.get("course-a")?.status).toBe("synced");
    expect(map.get("achievement-x")?.kind).toBe("achievement");
    expect(map.get("nope")).toBeUndefined();
  });

  it("composes with isSynced to gate a mixed catalog", () => {
    const map = toDeploymentMap([
      row({ content_id: "course-live", status: "synced", is_active: true }),
      row({ content_id: "course-off", status: "synced", is_active: false }),
      row({ content_id: "course-pending", status: "pending" }),
    ]);
    expect(isSynced(map.get("course-live"))).toBe(true);
    expect(isSynced(map.get("course-off"))).toBe(false);
    expect(isSynced(map.get("course-pending"))).toBe(false);
    expect(isSynced(map.get("course-unknown"))).toBe(false);
  });

  it("last write wins on duplicate content_id", () => {
    const map = toDeploymentMap([
      row({ content_id: "dup", status: "pending" }),
      row({ content_id: "dup", status: "synced" }),
    ]);
    expect(map.get("dup")?.status).toBe("synced");
  });
});

describe("getActiveDeployments — degrades to empty on a Supabase read failure", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("@supabase/supabase-js");
  });

  it("Supabase error → resolves to an empty map instead of throwing (#426)", async () => {
    vi.doMock("@supabase/supabase-js", () =>
      supabaseSelectResult({
        data: null,
        error: { message: "connection refused" },
      })
    );
    const { getActiveDeployments } = await import("../deployments");
    await expect(getActiveDeployments()).resolves.toEqual(new Map());
  });

  it("successful read → populates the map keyed by content_id", async () => {
    vi.doMock("@supabase/supabase-js", () =>
      supabaseSelectResult({
        data: [row({ content_id: "course-a" })],
        error: null,
      })
    );
    const { getActiveDeployments } = await import("../deployments");
    const map = await getActiveDeployments();
    expect(map.size).toBe(1);
    expect(map.get("course-a")?.status).toBe("synced");
  });
});

function supabaseMaintenanceResult(result: {
  data: { in_maintenance: boolean } | null;
  error: { message: string } | null;
}) {
  return {
    createClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve(result),
          }),
        }),
      }),
    }),
  };
}

describe("isCourseInMaintenance — the per-course maintenance gate (WS-2 #453 rail 3)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("@supabase/supabase-js");
  });

  it("true when the row's in_maintenance flag is set", async () => {
    vi.doMock("@supabase/supabase-js", () =>
      supabaseMaintenanceResult({
        data: { in_maintenance: true },
        error: null,
      })
    );
    const { isCourseInMaintenance } = await import("../deployments");
    await expect(isCourseInMaintenance("course-x")).resolves.toBe(true);
  });

  it("false when the row's in_maintenance flag is false", async () => {
    vi.doMock("@supabase/supabase-js", () =>
      supabaseMaintenanceResult({
        data: { in_maintenance: false },
        error: null,
      })
    );
    const { isCourseInMaintenance } = await import("../deployments");
    await expect(isCourseInMaintenance("course-x")).resolves.toBe(false);
  });

  it("false when there is no row at all (never gated)", async () => {
    vi.doMock("@supabase/supabase-js", () =>
      supabaseMaintenanceResult({ data: null, error: null })
    );
    const { isCourseInMaintenance } = await import("../deployments");
    await expect(isCourseInMaintenance("course-x")).resolves.toBe(false);
  });

  it("fails CLOSED (true) on a Supabase read error — an unreadable gate is treated as gated", async () => {
    vi.doMock("@supabase/supabase-js", () =>
      supabaseMaintenanceResult({
        data: null,
        error: { message: "connection refused" },
      })
    );
    const { isCourseInMaintenance } = await import("../deployments");
    await expect(isCourseInMaintenance("course-x")).resolves.toBe(true);
  });
});
