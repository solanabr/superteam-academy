import { describe, it, expect, vi } from "vitest";
import type {
  CourseSnapshot,
  EnrollmentSnapshot,
  ExpectedByCourseId,
  ResetSnapshot,
  ResetVerifyResult,
} from "../reset-verify";
import type { RecreateCourseResult, RecreatePlan } from "../recreate-course";
import {
  assertCensusComplete,
  assertCrossRpcForExecute,
  assertExpectedCoversCensus,
  assertLiveLessonCountsPositive,
  bindRecreate,
  buildExpected,
  findZeroLessonCourses,
  formatCliError,
  orchestrateReset,
  parseCensusExpectation,
  parseFlags,
  redactErrorText,
  redactUrl,
  resolveMode,
  ResetStopError,
  type OrchestrateDeps,
} from "../reset-orchestrator";

// ---------------------------------------------------------------------------
// Fixtures — plain data, no chain. These fakes exercise the ORCHESTRATION
// (call sequencing + STOP-on-fail + completeness guard); the invariant math
// itself is B4's (`reset-verify.test.ts`), so `verify` here is a controllable mock.
// ---------------------------------------------------------------------------

function mkCourse(
  courseId: string,
  creator = `creator-${courseId}`,
  liveLessonCount = 5
): CourseSnapshot {
  return {
    courseId,
    coursePda: `pda-${courseId}`,
    sizeBytes: 253,
    creator,
    creatorRewardXp: 30,
    liveLessonCount,
    activeLessonsOrCount: "0".repeat(64),
    contentTxId: "00".repeat(32),
  };
}

function mkEnrollment(address: string, course: string): EnrollmentSnapshot {
  return { address, course, lessonFlags: "0".repeat(64) };
}

function mkSnapshot(
  courses: CourseSnapshot[],
  enrollments: EnrollmentSnapshot[] = []
): ResetSnapshot {
  return {
    courses,
    enrollments,
    undecodedCourses: [],
    undecodedEnrollments: [],
  };
}

const OK_RESULT: RecreateCourseResult = {
  action: "recreated",
  coursePda: "pda",
  closeSignature: "close-sig",
  createSignature: "create-sig",
  createAttempts: 1,
  lostCounters: { totalCompletions: 0, totalEnrollments: 0 },
  warnings: [],
};

function okVerify(): ResetVerifyResult {
  return { ok: true, perCourse: [], perEnrollment: [], failures: [] };
}

function failVerify(failures: string[]): ResetVerifyResult {
  return { ok: false, perCourse: [], perEnrollment: [], failures };
}

function fakePlan(courseId: string): RecreatePlan {
  return {
    courseId,
    coursePda: "pda",
    createParams: {
      creatorWallet: `creator-${courseId}`,
      creatorRewardXp: 30,
      lessonCount: 5,
    },
    snapshot: { totalCompletions: 0, totalEnrollments: 0 },
  } as unknown as RecreatePlan;
}

/** Build orchestrator deps with sensible defaults; override per test. */
function mkDeps(overrides: Partial<OrchestrateDeps> = {}): {
  deps: OrchestrateDeps;
  recreate: ReturnType<typeof vi.fn>;
  snapshot: ReturnType<typeof vi.fn>;
  verify: ReturnType<typeof vi.fn>;
  preflight: ReturnType<typeof vi.fn>;
} {
  const recreate = vi.fn(async (_courseId: string) => OK_RESULT);
  const snapshot = vi.fn(async () => mkSnapshot([]));
  const verify = vi.fn(() => okVerify());
  const preflight = vi.fn(async (courseId: string) => fakePlan(courseId));
  const deps: OrchestrateDeps = {
    recreate,
    snapshot,
    verify,
    preflight,
    log: () => {},
    ...overrides,
  };
  return { deps, recreate, snapshot, verify, preflight };
}

// ---------------------------------------------------------------------------

describe("parseFlags / parseCensusExpectation", () => {
  it("parses value + boolean flags", () => {
    const flags = parseFlags([
      "--expect-courses",
      "6",
      "--execute",
      "--rpc2",
      "https://x",
    ]);
    expect(flags["expect-courses"]).toBe("6");
    expect(flags.execute).toBe("true");
    expect(flags.rpc2).toBe("https://x");
  });

  it("requires --expect-courses and --expect-enrollments", () => {
    expect(() => parseCensusExpectation({ "expect-courses": "6" })).toThrow(
      ResetStopError
    );
    expect(
      parseCensusExpectation({
        "expect-courses": "6",
        "expect-enrollments": "42",
      })
    ).toEqual({ expectCourses: 6, expectEnrollments: 42 });
  });

  it("rejects a non-integer count", () => {
    expect(() =>
      parseCensusExpectation({
        "expect-courses": "six",
        "expect-enrollments": "42",
      })
    ).toThrow(/non-negative integer/);
  });
});

describe("assertCensusComplete — completeness guard (#356 §1)", () => {
  it("passes when counts match exactly", () => {
    const snap = mkSnapshot(
      [mkCourse("c1"), mkCourse("c2")],
      [mkEnrollment("e1", "pda-c1"), mkEnrollment("e2", "pda-c2")]
    );
    expect(() =>
      assertCensusComplete(snap, { expectCourses: 2, expectEnrollments: 2 })
    ).not.toThrow();
  });

  it("STOPs when the census is SHORT of --expect-enrollments (partial read)", () => {
    const snap = mkSnapshot(
      [mkCourse("c1")],
      [mkEnrollment("e1", "pda-c1")] // only 1, operator says 3
    );
    try {
      assertCensusComplete(snap, { expectCourses: 1, expectEnrollments: 3 });
      throw new Error("expected a STOP");
    } catch (err) {
      expect(err).toBeInstanceOf(ResetStopError);
      expect((err as ResetStopError).phase).toBe("census");
      expect(
        (err as ResetStopError).failures.some((f) =>
          /partial RPC read; refusing to proceed on an incomplete baseline/.test(
            f
          )
        )
      ).toBe(true);
    }
  });

  it("STOPs on undecoded (corrupt/partial) accounts", () => {
    const snap: ResetSnapshot = {
      courses: [mkCourse("c1")],
      enrollments: [],
      undecodedCourses: [{ address: "bad", sizeBytes: 999, error: "boom" }],
      undecodedEnrollments: [],
    };
    expect(() =>
      assertCensusComplete(snap, { expectCourses: 1, expectEnrollments: 0 })
    ).toThrow(ResetStopError);
  });

  it("STOPs on a cross-RPC account-set mismatch", () => {
    const primary = mkSnapshot(
      [mkCourse("c1"), mkCourse("c2")],
      [mkEnrollment("e1", "pda-c1")]
    );
    const secondary = mkSnapshot(
      [mkCourse("c1")], // second RPC missed c2 — a partial view
      [mkEnrollment("e1", "pda-c1")]
    );
    try {
      assertCensusComplete(
        primary,
        { expectCourses: 2, expectEnrollments: 1 },
        secondary
      );
      throw new Error("expected a STOP");
    } catch (err) {
      expect(err).toBeInstanceOf(ResetStopError);
      expect(
        (err as ResetStopError).failures.some((f) =>
          /cross-RPC course-set mismatch/.test(f)
        )
      ).toBe(true);
    }
  });
});

describe("buildExpected / assertExpectedCoversCensus (#356 §2 — ALL courses)", () => {
  it("builds one entry per course from the full census, defaulting reward to 30", () => {
    const expected = buildExpected([
      { _id: "c1", creatorWallet: "W1" },
      { _id: "c2", creatorWallet: "W2" },
    ]);
    expect(Object.keys(expected).sort()).toEqual(["c1", "c2"]);
    expect(expected.c1).toEqual({
      expectedSize: 253,
      expectedCreator: "W1",
      expectedRewardXp: 30,
    });
    expect(expected.c2?.expectedCreator).toBe("W2");
  });

  it("STOPs when any course lacks a creator wallet", () => {
    try {
      buildExpected([
        { _id: "c1", creatorWallet: "W1" },
        { _id: "c2", creatorWallet: null },
      ]);
      throw new Error("expected a STOP");
    } catch (err) {
      expect(err).toBeInstanceOf(ResetStopError);
      expect((err as ResetStopError).phase).toBe("expected");
      expect((err as ResetStopError).failures).toEqual(["c2"]);
    }
  });

  it("catches a course present on-chain but MISSING from expected", () => {
    const snap = mkSnapshot([mkCourse("c1"), mkCourse("c2"), mkCourse("c3")]);
    const expected: ExpectedByCourseId = {
      c1: { expectedSize: 253, expectedCreator: "W1", expectedRewardXp: 30 },
      c2: { expectedSize: 253, expectedCreator: "W2", expectedRewardXp: 30 },
    };
    expect(() => assertExpectedCoversCensus(snap, expected)).toThrow(
      /NOT in the expected map/
    );
  });
});

describe("resolveMode — dry-run default, destruction gated", () => {
  it("stays DRY-RUN with no --execute", () => {
    expect(resolveMode({}, 6).execute).toBe(false);
  });

  it("stays DRY-RUN with --execute but NO confirm token", () => {
    expect(resolveMode({ execute: "true" }, 6).execute).toBe(false);
  });

  it("stays DRY-RUN when the token's count is wrong (stale token)", () => {
    const flags = {
      execute: "true",
      "i-understand-this-destroys-5-courses": "true",
    };
    expect(resolveMode(flags, 6).execute).toBe(false);
  });

  it("EXECUTEs only with --execute AND the exact-count token", () => {
    const flags = {
      execute: "true",
      "i-understand-this-destroys-6-courses": "true",
    };
    expect(resolveMode(flags, 6).execute).toBe(true);
  });
});

describe("bindRecreate — allowUnusualCreator is NEVER true", () => {
  it("always calls the impl with allowUnusualCreator=false", async () => {
    const impl = vi.fn(async () => OK_RESULT);
    const bound = bindRecreate(impl);
    await bound("c1");
    expect(impl).toHaveBeenCalledWith("c1", false);
  });
});

describe("orchestrateReset — DRY-RUN", () => {
  it("makes ZERO recreate calls and runs preflight per course", async () => {
    const { deps, recreate, preflight, snapshot } = mkDeps();
    const pre = mkSnapshot([mkCourse("c1"), mkCourse("c2")]);
    const expected = buildExpected([
      { _id: "c1", creatorWallet: "creator-c1" },
      { _id: "c2", creatorWallet: "creator-c2" },
    ]);

    const result = await orchestrateReset(deps, {
      preSnapshot: pre,
      expected,
      execute: false,
    });

    expect(result.dryRun).toBe(true);
    expect(result.recreated).toEqual([]);
    expect(recreate).not.toHaveBeenCalled();
    expect(snapshot).not.toHaveBeenCalled();
    expect(preflight).toHaveBeenCalledTimes(2);
  });

  it("STOPs the dry-run when a preflight refuses (readiness blocker)", async () => {
    const preflight = vi.fn(async (courseId: string) => {
      if (courseId === "c2") throw new Error("creator == platform authority");
      return fakePlan(courseId);
    });
    const { deps, recreate } = mkDeps({ preflight });
    const pre = mkSnapshot([mkCourse("c1"), mkCourse("c2")]);
    const expected = buildExpected([
      { _id: "c1", creatorWallet: "creator-c1" },
      { _id: "c2", creatorWallet: "creator-c2" },
    ]);

    await expect(
      orchestrateReset(deps, { preSnapshot: pre, expected, execute: false })
    ).rejects.toMatchObject({ phase: "preflight" });
    expect(recreate).not.toHaveBeenCalled();
  });
});

describe("orchestrateReset — EXECUTE happy path", () => {
  it("recreates every course then runs a final full-set verify", async () => {
    const { deps, recreate, snapshot, verify } = mkDeps();
    const pre = mkSnapshot(
      [mkCourse("c1"), mkCourse("c2")],
      [mkEnrollment("e1", "pda-c1")]
    );
    const expected = buildExpected([
      { _id: "c1", creatorWallet: "creator-c1" },
      { _id: "c2", creatorWallet: "creator-c2" },
    ]);

    const result = await orchestrateReset(deps, {
      preSnapshot: pre,
      expected,
      execute: true,
    });

    expect(result.dryRun).toBe(false);
    expect(result.recreated).toEqual(["c1", "c2"]);
    expect(recreate).toHaveBeenCalledTimes(2);
    // 2 per-course POST reads + 1 final read.
    expect(snapshot).toHaveBeenCalledTimes(3);
    // 2 per-course verifies + 1 final.
    expect(verify).toHaveBeenCalledTimes(3);
    // The FINAL verify uses the FULL expected map (both courses).
    const finalCall = verify.mock.calls[2]!;
    expect(Object.keys(finalCall[2]).sort()).toEqual(["c1", "c2"]);
    // Each per-course verify uses a single-course expected slice.
    expect(Object.keys(verify.mock.calls[0]![2])).toEqual(["c1"]);
    expect(Object.keys(verify.mock.calls[1]![2])).toEqual(["c2"]);
  });
});

describe("orchestrateReset — STOP-on-fail halts the loop (#356 §15.3)", () => {
  it("a verify failure on course #2 means course #3's recreate is NEVER called", async () => {
    // verify returns ok for c1's slice, FAILS for c2's slice.
    const verify = vi.fn((_pre, _post, expected: ExpectedByCourseId) => {
      return "c2" in expected
        ? failVerify(["course c2: sizeBytes=224, expected 253"])
        : okVerify();
    });
    const { deps, recreate } = mkDeps({ verify });
    const pre = mkSnapshot([mkCourse("c1"), mkCourse("c2"), mkCourse("c3")]);
    const expected = buildExpected([
      { _id: "c1", creatorWallet: "creator-c1" },
      { _id: "c2", creatorWallet: "creator-c2" },
      { _id: "c3", creatorWallet: "creator-c3" },
    ]);

    await expect(
      orchestrateReset(deps, { preSnapshot: pre, expected, execute: true })
    ).rejects.toMatchObject({ phase: "verify" });

    // c1 and c2 were recreated; the loop STOPPED before c3.
    expect(recreate).toHaveBeenCalledTimes(2);
    expect(recreate).toHaveBeenNthCalledWith(1, "c1");
    expect(recreate).toHaveBeenNthCalledWith(2, "c2");
    const recreatedIds = recreate.mock.calls.map((c) => c[0]);
    expect(recreatedIds).not.toContain("c3");
  });

  it("a recreateCourse throw halts the loop before the next course", async () => {
    const recreate = vi.fn(async (courseId: string) => {
      if (courseId === "c2") {
        // Shape of a RecreateCourseError with courseIntact === false (course DOWN).
        const err = Object.assign(new Error("closed but create failed"), {
          phase: "create",
          courseIntact: false,
        });
        throw err;
      }
      return OK_RESULT;
    });
    const { deps } = mkDeps({ recreate });
    const pre = mkSnapshot([mkCourse("c1"), mkCourse("c2"), mkCourse("c3")]);
    const expected = buildExpected([
      { _id: "c1", creatorWallet: "creator-c1" },
      { _id: "c2", creatorWallet: "creator-c2" },
      { _id: "c3", creatorWallet: "creator-c3" },
    ]);

    try {
      await orchestrateReset(deps, {
        preSnapshot: pre,
        expected,
        execute: true,
      });
      throw new Error("expected a STOP");
    } catch (err) {
      expect(err).toBeInstanceOf(ResetStopError);
      expect((err as ResetStopError).phase).toBe("recreate");
      expect((err as ResetStopError).message).toMatch(/COURSE IS DOWN/);
    }
    expect(recreate).toHaveBeenCalledTimes(2);
    expect(recreate.mock.calls.map((c) => c[0])).not.toContain("c3");
  });

  it("a preflight creator-refusal (recreate throws, courseIntact) STOPs execute", async () => {
    // In execute mode the refusal surfaces as recreateCourse throwing (its own
    // preflight runs first); the loop must STOP without touching the next course.
    const recreate = vi.fn(async (courseId: string) => {
      if (courseId === "c1") {
        const err = Object.assign(
          new Error("creator is on the denylist (#427)"),
          { phase: "preflight", courseIntact: true }
        );
        throw err;
      }
      return OK_RESULT;
    });
    const { deps } = mkDeps({ recreate });
    const pre = mkSnapshot([mkCourse("c1"), mkCourse("c2")]);
    const expected = buildExpected([
      { _id: "c1", creatorWallet: "creator-c1" },
      { _id: "c2", creatorWallet: "creator-c2" },
    ]);

    await expect(
      orchestrateReset(deps, { preSnapshot: pre, expected, execute: true })
    ).rejects.toMatchObject({ phase: "recreate" });
    // STOPPED on the very first course; c2 never touched.
    expect(recreate).toHaveBeenCalledTimes(1);
    expect(recreate).toHaveBeenCalledWith("c1");
  });
});

// ---------------------------------------------------------------------------
// FIX 1 (HIGH) — live-lesson-count >= 1 guard (permanent-loss prevention)
// ---------------------------------------------------------------------------

describe("FIX 1 — live lesson_count >= 1 precondition", () => {
  it("findZeroLessonCourses flags only count-0 courses", () => {
    const snap = mkSnapshot([
      mkCourse("c1"),
      mkCourse("c-zero", "creator-c-zero", 0),
      mkCourse("c3"),
    ]);
    expect(findZeroLessonCourses(snap)).toEqual(["c-zero"]);
  });

  it("all-≥1 census does NOT throw (no false positive)", () => {
    const snap = mkSnapshot([mkCourse("c1"), mkCourse("c2")]);
    expect(findZeroLessonCourses(snap)).toEqual([]);
    expect(() => assertLiveLessonCountsPositive(snap)).not.toThrow();
  });

  it("EXECUTE: a count-0 course STOPs before ANY recreate call", async () => {
    const { deps, recreate, snapshot } = mkDeps();
    const pre = mkSnapshot([mkCourse("c1"), mkCourse("c2", "creator-c2", 0)]);
    const expected = buildExpected([
      { _id: "c1", creatorWallet: "creator-c1" },
      { _id: "c2", creatorWallet: "creator-c2" },
    ]);

    await expect(
      orchestrateReset(deps, { preSnapshot: pre, expected, execute: true })
    ).rejects.toMatchObject({ phase: "preflight" });

    // The whole-run precondition fires BEFORE the first close: zero recreates,
    // zero POST re-snapshots.
    expect(recreate).toHaveBeenCalledTimes(0);
    expect(snapshot).not.toHaveBeenCalled();
  });

  it("EXECUTE STOP names the course(s) and the create_course reason", async () => {
    const { deps } = mkDeps();
    const pre = mkSnapshot([
      mkCourse("c1"),
      mkCourse("c-zero", "creator-c-zero", 0),
    ]);
    const expected = buildExpected([
      { _id: "c1", creatorWallet: "creator-c1" },
      { _id: "c-zero", creatorWallet: "creator-c-zero" },
    ]);

    try {
      await orchestrateReset(deps, {
        preSnapshot: pre,
        expected,
        execute: true,
      });
      throw new Error("expected a STOP");
    } catch (err) {
      expect(err).toBeInstanceOf(ResetStopError);
      expect((err as ResetStopError).failures).toEqual(["c-zero"]);
      expect((err as ResetStopError).message).toMatch(
        /create_course \(count must be > 0\)/
      );
      expect((err as ResetStopError).message).toContain("c-zero");
    }
  });

  it("DRY-RUN: a count-0 course is a WOULD-BLOCK (not 'preflight clean')", async () => {
    const logs: string[] = [];
    const { deps, recreate, preflight } = mkDeps({ log: (l) => logs.push(l) });
    const pre = mkSnapshot([mkCourse("c1"), mkCourse("c2", "creator-c2", 0)]);
    const expected = buildExpected([
      { _id: "c1", creatorWallet: "creator-c1" },
      { _id: "c2", creatorWallet: "creator-c2" },
    ]);

    await expect(
      orchestrateReset(deps, { preSnapshot: pre, expected, execute: false })
    ).rejects.toMatchObject({ phase: "preflight" });

    // Reported as a would-block, and NOT declared clean.
    expect(logs.some((l) => /WOULD-BLOCK/.test(l))).toBe(true);
    expect(logs.some((l) => /preflight clean/.test(l))).toBe(false);
    // Dry-run never touches the chain; the count-0 course is not preflighted.
    expect(recreate).not.toHaveBeenCalled();
    expect(preflight).not.toHaveBeenCalledWith("c2");
  });
});

// ---------------------------------------------------------------------------
// FIX 2 — --rpc2 is mandatory for --execute
// ---------------------------------------------------------------------------

describe("FIX 2 — assertCrossRpcForExecute", () => {
  it("dry-run (no --execute) does NOT require --rpc2", () => {
    expect(() => assertCrossRpcForExecute({})).not.toThrow();
    expect(() =>
      assertCrossRpcForExecute({ "expect-courses": "6" })
    ).not.toThrow();
  });

  it("--execute WITHOUT --rpc2 refuses in the args phase", () => {
    try {
      assertCrossRpcForExecute({ execute: "true" });
      throw new Error("expected a STOP");
    } catch (err) {
      expect(err).toBeInstanceOf(ResetStopError);
      expect((err as ResetStopError).phase).toBe("args");
      expect((err as ResetStopError).message).toMatch(
        /--execute requires --rpc2/
      );
    }
  });

  it("--execute with a bare boolean --rpc2 (no url) still refuses", () => {
    expect(() =>
      assertCrossRpcForExecute({ execute: "true", rpc2: "true" })
    ).toThrow(ResetStopError);
  });

  it("--execute WITH --rpc2 <url> proceeds past the gate", () => {
    expect(() =>
      assertCrossRpcForExecute({
        execute: "true",
        rpc2: "https://rpc2.example",
      })
    ).not.toThrow();
  });

  it("the gate runs before orchestrate, so a refused --execute makes ZERO recreate calls", () => {
    const { recreate } = mkDeps();
    const flags = {
      execute: "true",
      "i-understand-this-destroys-1-courses": "true",
    };
    // Mirror the CLI ordering: the gate throws before orchestrateReset is invoked.
    expect(() => assertCrossRpcForExecute(flags)).toThrow(ResetStopError);
    expect(recreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// FIX 3 — every CLI error line is redacted of URLs/keys
// ---------------------------------------------------------------------------

describe("FIX 3 — error/URL redaction", () => {
  it("redactUrl strips a query-string key (host only)", () => {
    const out = redactUrl("https://rpc.example/?api-key=SECRET");
    expect(out).not.toContain("SECRET");
    expect(out).toBe("https://rpc.example");
  });

  it("redactUrl strips a PATH-embedded token (not just the query)", () => {
    const out = redactUrl("https://rpc.example/SECRETTOKEN/rpc");
    expect(out).not.toContain("SECRETTOKEN");
    expect(out).toBe("https://rpc.example");
  });

  it("redactErrorText nukes a query-form tokened URL", () => {
    const out = redactErrorText(
      "fetch failed for https://rpc.example/?api-key=SECRET oops"
    );
    expect(out).not.toContain("SECRET");
    expect(out).toContain("[redacted-url]");
  });

  it("redactErrorText nukes a path-embedded tokened URL", () => {
    const out = redactErrorText(
      "Error: https://rpc.example/SECRETTOKEN/rpc timed out"
    );
    expect(out).not.toContain("SECRETTOKEN");
    expect(out).toContain("[redacted-url]");
  });

  it("formatCliError redacts a tokened-URL fetch error the catch would print (query + path)", () => {
    const queryErr = new Error(
      "FetchError: request to https://rpc.example/?api-key=SECRET failed"
    );
    const pathErr = new Error(
      "FetchError: request to https://rpc.example/SECRETTOKEN failed"
    );
    const queryOut = formatCliError(queryErr).join("\n");
    const pathOut = formatCliError(pathErr).join("\n");
    expect(queryOut).not.toContain("SECRET");
    expect(pathOut).not.toContain("SECRETTOKEN");
    expect(queryOut).toContain("[redacted-url]");
    expect(pathOut).toContain("[redacted-url]");
  });

  it("formatCliError redacts URLs inside ResetStopError message + failures too", () => {
    const stop = new ResetStopError(
      "boom against https://rpc.example/?api-key=SECRET",
      ["cross-RPC mismatch at https://rpc2.example/OTHERSECRET/rpc"],
      "census"
    );
    const out = formatCliError(stop).join("\n");
    expect(out).not.toContain("SECRET");
    expect(out).not.toContain("OTHERSECRET");
    expect(out).toContain("STOP [census]");
    expect(out).toContain("[redacted-url]");
  });
});
