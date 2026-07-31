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

  // #864 assist ladder: the exact #945-class gap this check exists to close —
  // spendAssistTurn fails CLOSED, so a missing RPC denies every AI tutor turn
  // while nothing else reports a problem.
  it("a missing spend_assist_ladder_turn is reported (the AI-tutor fail-closed gap)", async () => {
    const result = await checkSchemaExpectations(
      makeClient({
        rpcErrors: {
          spend_assist_ladder_turn: {
            code: "PGRST202",
            message:
              "Could not find the function public.spend_assist_ladder_turn",
          },
        },
      })
    );
    expect(result.ok).toBe(false);
    const miss = result.missing.find(
      (m) => m.object === "function spend_assist_ladder_turn"
    );
    expect(miss?.migration).toBe("20260730120000_assist_ladder.sql");
  });

  it("a missing challenge_assists.chat_log column is reported", async () => {
    const result = await checkSchemaExpectations(
      makeClient({
        tableErrors: {
          challenge_assists: {
            code: "42703",
            message: "column challenge_assists.chat_log does not exist",
          },
        },
      })
    );
    expect(result.ok).toBe(false);
    const miss = result.missing.find((m) => m.object.includes("chat_log"));
    expect(miss?.migration).toBe("20260730120000_assist_ladder.sql");
  });

  // Every write-side RPC probe is safe ONLY because the anon client lacks
  // EXECUTE. Guard the invariant that each such probe carries inert arguments,
  // so a future GRANT never turns a health check into a real mutation.
  it("the assist-ladder spend probe passes zero tier maxima (inert even if it ran)", () => {
    const spend = SCHEMA_EXPECTATIONS.find(
      (e) => e.kind === "rpc" && e.rpc === "spend_assist_ladder_turn"
    );
    expect(spend).toBeDefined();
    expect(spend?.kind === "rpc" ? spend.args : {}).toMatchObject({
      p_free_max: 0,
      p_metered_max: 0,
      p_socratic_max: 0,
    });
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
