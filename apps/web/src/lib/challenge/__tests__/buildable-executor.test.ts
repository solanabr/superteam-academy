import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AdminTestCase } from "@superteam-lms/types";

// The grader reads BUILD_SERVER_URL / BUILD_SERVER_API_KEY at module load, so
// each test re-imports the module after setting the env it needs (vitest
// isolates the module registry per resetModules()).
const URL = "https://build.example.test";
const KEY = "test-api-key";

const tests: AdminTestCase[] = [
  {
    id: "test-1",
    description: "Program compiles",
    input: "",
    expectedOutput: "true",
  },
  {
    id: "test-2",
    description: "hidden content check",
    input: "",
    expectedOutput: "true",
    hidden: true,
  },
];

const CODE = 'use anchor_lang::prelude::*;\ndeclare_id!("Fg6");\n';

/** Stub the build server. `respond` gets the parsed request body. */
function mockBuildServer(
  respond: (body: {
    files: [string, string][];
  }) => { ok?: boolean; success?: boolean; stderr?: string } | Promise<never>
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: { body: string }) => {
      const body = JSON.parse(init.body) as { files: [string, string][] };
      const r = respond(body);
      if (r instanceof Promise) return r;
      return {
        ok: r.ok ?? true,
        json: async () => ({
          success: r.success ?? false,
          stderr: r.stderr ?? "",
          uuid: "uuid-1",
        }),
      } as unknown as Response;
    })
  );
}

async function loadGrader() {
  vi.resetModules();
  return import("../buildable-executor");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.BUILD_SERVER_URL;
  delete process.env.BUILD_SERVER_API_KEY;
});

describe("runBuildableSubmission — build server configured", () => {
  beforeEach(() => {
    process.env.BUILD_SERVER_URL = URL;
    process.env.BUILD_SERVER_API_KEY = KEY;
  });

  it("passes ALL tests when the program compiles (success: true)", async () => {
    mockBuildServer(() => ({ success: true }));
    const { runBuildableSubmission } = await loadGrader();
    const r = await runBuildableSubmission(CODE, tests);
    expect(r.available).toBe(true);
    expect(r).toMatchObject({ passed: true });
    if (r.available) {
      expect(r.results.every((t) => t.passed)).toBe(true);
      expect(r.results[1]?.hidden).toBe(true);
    }
  });

  it("fails ALL tests on a genuine compile error (success: false)", async () => {
    mockBuildServer(() => ({
      success: false,
      stderr: "error[E0425]: cannot find value `x` in this scope",
    }));
    const { runBuildableSubmission } = await loadGrader();
    const r = await runBuildableSubmission(CODE, tests);
    expect(r).toMatchObject({ available: true, passed: false });
    if (r.available) {
      expect(r.results[0]?.passed).toBe(false);
      expect(r.results[0]?.detail).toContain("error");
    }
  });

  it("sends /src/lib.rs plus a cache-busting nonce file, with the API key", async () => {
    const spy = vi.fn(
      async (
        _url: string,
        init: { body: string; headers: Record<string, string> }
      ) => {
        const body = JSON.parse(init.body) as { files: [string, string][] };
        expect(_url).toBe(`${URL}/build`);
        expect(init.headers["X-API-Key"]).toBe(KEY);
        const paths = body.files.map((f) => f[0]);
        expect(paths).toContain("/src/lib.rs");
        expect(
          paths.some((p) => p.endsWith(".rs") && p !== "/src/lib.rs")
        ).toBe(true);
        return {
          ok: true,
          json: async () => ({ success: true, stderr: "", uuid: "u" }),
        } as unknown as Response;
      }
    );
    vi.stubGlobal("fetch", spy);
    const { runBuildableSubmission } = await loadGrader();
    await runBuildableSubmission(CODE, tests);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("degrades closed when the build server is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      })
    );
    const { runBuildableSubmission } = await loadGrader();
    const r = await runBuildableSubmission(CODE, tests);
    expect(r).toEqual({ available: false, reason: "executor_unavailable" });
  });

  it("degrades closed on a non-2xx build-server response", async () => {
    mockBuildServer(() => ({ ok: false }));
    const { runBuildableSubmission } = await loadGrader();
    const r = await runBuildableSubmission(CODE, tests);
    expect(r).toEqual({ available: false, reason: "executor_unavailable" });
  });

  it("rejects an oversized submission without calling the build server", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    const { runBuildableSubmission } = await loadGrader();
    const big = "// x\n".repeat(30_000); // > 100KB
    const r = await runBuildableSubmission(big, tests);
    expect(r).toMatchObject({ available: true, passed: false });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("runBuildableSubmission — build server NOT configured", () => {
  it("fails closed (never calls out) when env is unset", async () => {
    // env intentionally unset (afterEach cleared it)
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    const { runBuildableSubmission, isBuildServerConfigured } =
      await loadGrader();
    expect(isBuildServerConfigured()).toBe(false);
    const r = await runBuildableSubmission(CODE, tests);
    expect(r).toEqual({ available: false, reason: "executor_unavailable" });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("validateAgainstAnswerKey — buildable routing", () => {
  const buildableKey = {
    _id: "l1",
    type: "challenge" as const,
    language: "rust" as const,
    buildType: "buildable" as const,
    tests,
    solution: CODE,
    tutorNotes: null,
  };

  it("grades a compiling buildable challenge to validated/passed", async () => {
    process.env.BUILD_SERVER_URL = URL;
    process.env.BUILD_SERVER_API_KEY = KEY;
    mockBuildServer(() => ({ success: true }));
    vi.resetModules();
    const { validateAgainstAnswerKey } = await import("../validate");
    const v = await validateAgainstAnswerKey(buildableKey, CODE);
    expect(v).toMatchObject({ kind: "validated", passed: true });
  });

  it("maps a build-server outage to executor_unavailable (deny completion)", async () => {
    process.env.BUILD_SERVER_URL = URL;
    process.env.BUILD_SERVER_API_KEY = KEY;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("down");
      })
    );
    vi.resetModules();
    const { validateAgainstAnswerKey } = await import("../validate");
    const v = await validateAgainstAnswerKey(buildableKey, CODE);
    expect(v.kind).toBe("executor_unavailable");
  });

  it("fails closed (executor_unavailable) when the build server is unset", async () => {
    // env unset → grader reports unavailable → validate maps to
    // executor_unavailable (completion route denies with 503). This is what
    // keeps prod unchanged.
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    vi.resetModules();
    const { validateAgainstAnswerKey } = await import("../validate");
    const v = await validateAgainstAnswerKey(buildableKey, CODE);
    expect(v.kind).toBe("executor_unavailable");
    expect(spy).not.toHaveBeenCalled();
  });
});
