/* eslint-disable import/order -- vi.mock must hoist above the imports it stubs */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// #731 option 2: the schema-expectation health check must report an object as
// MISSING when its probe hits a "not found in schema cache" / undefined-object
// error, and as PRESENT for any other outcome (success OR permission-denied —
// the anon RPC probe proves existence without executing the body).
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { logError } from "@/lib/logging";
import {
  checkSchemaExpectations,
  SCHEMA_EXPECTATIONS,
} from "../schema-expectations";

type ProbeErr = { code?: string; message: string } | null;

// Probe stub: `.from(t).select(c).limit(n)` and `.rpc(n, args)` each resolve to
// `{ error }`, keyed by table / rpc name so a test can make one object "missing".
function makeClient(opts: {
  tableErrors?: Record<string, ProbeErr>;
  rpcErrors?: Record<string, ProbeErr>;
}): SupabaseClient {
  const client = {
    from: (table: string) => {
      const builder = {
        select: () => builder,
        limit: () =>
          Promise.resolve({ error: opts.tableErrors?.[table] ?? null }),
      };
      return builder;
    },
    rpc: (name: string) =>
      Promise.resolve({ error: opts.rpcErrors?.[name] ?? null }),
  };
  return client as unknown as SupabaseClient;
}

describe("checkSchemaExpectations (#731)", () => {
  beforeEach(() => vi.mocked(logError).mockClear());

  it("all objects present → ok, nothing missing, nothing logged", async () => {
    const result = await checkSchemaExpectations(makeClient({}));
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.checked).toBe(SCHEMA_EXPECTATIONS.length);
    expect(logError).not.toHaveBeenCalled();
  });

  it("a missing column is reported WITH the migration that creates it, and logged", async () => {
    const result = await checkSchemaExpectations(
      makeClient({
        tableErrors: {
          user_xp: {
            code: "42703",
            message: "column user_xp.streak_freezes does not exist",
          },
        },
      })
    );
    expect(result.ok).toBe(false);
    const miss = result.missing.find((m) =>
      m.object.includes("streak_freezes")
    );
    expect(miss).toBeDefined();
    expect(miss?.migration).toBe("20260726190000_streak_forgiveness.sql");
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({ errorId: "schema-expectation.missing" })
    );
  });

  it("a missing rpc (PGRST202) is reported as missing", async () => {
    const result = await checkSchemaExpectations(
      makeClient({
        rpcErrors: {
          check_ai_spend: {
            code: "PGRST202",
            message: "Could not find the function public.check_ai_spend",
          },
        },
      })
    );
    expect(result.ok).toBe(false);
    expect(
      result.missing.some((m) => m.object === "function check_ai_spend")
    ).toBe(true);
  });

  it("permission-denied on an rpc means PRESENT (exists, just not callable by anon)", async () => {
    const result = await checkSchemaExpectations(
      makeClient({
        rpcErrors: {
          check_ai_spend: { code: "42501", message: "permission denied" },
        },
      })
    );
    // 42501 is NOT a missing-code: the function exists, the anon probe simply
    // lacks EXECUTE — which is exactly how we avoid running its body.
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
  });
});
