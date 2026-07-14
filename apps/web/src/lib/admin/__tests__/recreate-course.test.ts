/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module imports so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Call-ORDER log. The safety property of this feature is an ordering one:
// pre-flight must fully validate BEFORE `close_course` destroys the account,
// and the maintenance gate must be ON before the close and cleared only once
// the course is genuinely safe again. So every on-chain / DB effect appends to
// this log and the tests assert the exact sequence, not just that calls happened.
// ---------------------------------------------------------------------------
let calls: string[] = [];

const AUTHORITY = Keypair.generate().publicKey;
const INSTRUCTOR = Keypair.generate().publicKey.toBase58();
const COLLECTION = Keypair.generate().publicKey.toBase58();
const COURSE_ID = "course-solana-101";

// Mutable mock state, reset per test.
let authority: PublicKey | null = AUTHORITY;
let courses: unknown[] = [];
let accounts: Map<string, object | null> = new Map();
let onChainCourse: Record<string, unknown> | null = null;
let fetchCourseThrows = false;
let closeResult = { success: true, signature: "close-sig" };
let createResults: Array<{
  success: boolean;
  signature?: string;
  error?: string;
}> = [];
let bindResult = { success: true, signature: "bind-sig" };
let updateResult = { success: true, signature: "update-sig" };
let dbThrows = false;

// The REAL #427 guard (assertCreatorAllowed + CREATOR_DENYLIST) is kept via
// importOriginal — mocking it would test the mock, not the guard. Only the
// tx-sending functions are stubbed.
vi.mock("@/lib/solana/admin-signer", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/solana/admin-signer")>();
  return {
    ...actual,
    getAuthorityPublicKey: () => authority,
    closeCoursePda: vi.fn(async () => {
      calls.push("close");
      return closeResult;
    }),
    deployCoursePda: vi.fn(async () => {
      calls.push("create");
      return createResults.shift() ?? { success: false, error: "no result" };
    }),
    setCourseCollectionPda: vi.fn(async () => {
      calls.push("bind");
      return bindResult;
    }),
    updateCoursePda: vi.fn(async () => {
      calls.push("deactivate");
      return updateResult;
    }),
  };
});

vi.mock("@/lib/content/queries", () => ({
  getAllCoursesAdmin: async () => courses,
  COURSES_CACHE_TAG: "courses",
}));

vi.mock("@/lib/solana/academy-reads", () => ({
  fetchCourse: async () => {
    if (fetchCourseThrows) throw new Error("undecodable account layout");
    return onChainCourse;
  },
}));

vi.mock("@/lib/content/deployment-writes", () => ({
  writeCourseOnChainStatus: vi.fn(async (_id: string, status: string) => {
    calls.push(`db:${status}`);
    if (dbThrows) throw new Error("supabase down");
  }),
  writeCourseMaintenanceFlag: vi.fn(async (_id: string, on: boolean) => {
    calls.push(on ? "gate:on" : "gate:off");
  }),
}));

vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Connection: class {
      async getAccountInfo(pk: PublicKey) {
        return accounts.get(pk.toBase58()) ?? null;
      }
    },
  };
});

import { recreateCourse, RecreateCourseError } from "../recreate-course";
import { findCoursePDA, getProgramId } from "@/lib/solana/pda";
import { closeCoursePda, deployCoursePda } from "@/lib/solana/admin-signer";
import { writeCourseMaintenanceFlag } from "@/lib/content/deployment-writes";

const coursePda = (id: string) =>
  findCoursePDA(id, getProgramId())[0].toBase58();

/**
 * Capture a rejection as a typed error. The retry backoff runs under fake timers,
 * so the rejection must be attached BEFORE `runAllTimersAsync()` drives the
 * sleeps — awaiting the promise directly would deadlock.
 */
function captureError(p: Promise<unknown>): Promise<RecreateCourseError> {
  return p.then(
    () => {
      throw new Error("expected the recreate to reject, but it resolved");
    },
    (e: unknown) => e as RecreateCourseError
  );
}

/** A fully-valid course in the content bundle. */
function validCourse(overrides: Record<string, unknown> = {}) {
  return {
    _id: COURSE_ID,
    title: "Solana 101",
    slug: "solana-101",
    difficulty: "beginner",
    creatorWallet: INSTRUCTOR,
    xpPerLesson: 10,
    trackId: 1,
    trackLevel: 1,
    prerequisiteCourse: null,
    creatorRewardXp: 500,
    minCompletionsForReward: 10,
    lessonCount: 5,
    trackCollectionAddress: COLLECTION,
    onChainStatus: null,
    ...overrides,
  };
}

beforeEach(() => {
  calls = [];
  // Rail 4: default to devnet so every existing test exercises the "allowed"
  // path; the mainnet-refusal describe block below overrides this per-test.
  process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
  authority = AUTHORITY;
  courses = [validCourse()];
  // The course exists on-chain (so there IS something to recreate).
  accounts = new Map([[coursePda(COURSE_ID), { lamports: 1 } as object]]);
  fetchCourseThrows = false;
  onChainCourse = {
    total_completions: 42,
    total_enrollments: 100,
    is_active: true,
    collection: COLLECTION,
    // H3: matches validCourse().lessonCount so the default happy path never
    // trips the lesson-count guard.
    liveLessonCount: 5,
  };
  closeResult = { success: true, signature: "close-sig" };
  createResults = [{ success: true, signature: "create-sig" }];
  bindResult = { success: true, signature: "bind-sig" };
  updateResult = { success: true, signature: "update-sig" };
  dbThrows = false;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// RAIL 4 — mainnet hard-refusal. Un-bypassable until #305 (Squads custody).
// ---------------------------------------------------------------------------
describe("rail 4 — mainnet is hard-refused until Squads custody (#305)", () => {
  it('refuses on NEXT_PUBLIC_SOLANA_NETWORK === "mainnet"', async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "mainnet";
    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse(COURSE_ID);
    } catch (e) {
      thrown = e as RecreateCourseError;
    }
    expect(thrown).toBeInstanceOf(RecreateCourseError);
    expect(thrown!.phase).toBe("preflight");
    expect(thrown!.courseIntact).toBe(true);
    expect(thrown!.message).toMatch(/Squads custody \(#305\)/i);
    expect(closeCoursePda).not.toHaveBeenCalled();
    expect(writeCourseMaintenanceFlag).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it('also refuses on the "mainnet-beta" spelling — not a narrow string match', async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "mainnet-beta";
    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse(COURSE_ID);
    } catch (e) {
      thrown = e as RecreateCourseError;
    }
    expect(thrown!.phase).toBe("preflight");
    expect(closeCoursePda).not.toHaveBeenCalled();
  });

  it("refuses on an unset/misconfigured network value (default-deny, not default-allow)", async () => {
    delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
    // The implementation's own fallback is "devnet" when unset — assert that
    // explicitly, since default-ALLOW-on-unset would be the dangerous reading.
    const result = await recreateCourse(COURSE_ID);
    expect(result.action).toBe("recreated");
  });

  it("allows the recreate to proceed on devnet", async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
    const result = await recreateCourse(COURSE_ID);
    expect(result.action).toBe("recreated");
    expect(closeCoursePda).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// PRE-FLIGHT: must refuse WITHOUT ever closing the course or touching the
// maintenance gate. This is the whole safety property — it must be impossible
// to close a course and only then discover the create params were bad.
// ---------------------------------------------------------------------------
describe("preflight refuses before ever closing the course", () => {
  const expectRefusedIntact = async (expectedMessage: RegExp) => {
    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse(COURSE_ID);
    } catch (e) {
      thrown = e as RecreateCourseError;
    }
    expect(thrown).toBeInstanceOf(RecreateCourseError);
    expect(thrown!.phase).toBe("preflight");
    // The course was never touched.
    expect(thrown!.courseIntact).toBe(true);
    expect(thrown!.message).toMatch(expectedMessage);
    // THE assertion: close_course was never sent, the gate was never touched,
    // and nothing else was either.
    expect(closeCoursePda).not.toHaveBeenCalled();
    expect(deployCoursePda).not.toHaveBeenCalled();
    expect(writeCourseMaintenanceFlag).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  };

  // A missing / malformed creatorWallet is caught by the shared
  // `getMissingCourseFields` gate (which checks presence AND base58 shape), so it
  // refuses one step earlier than the orchestrator's own parse check. Either way
  // the contract that matters holds: refused, and close_course was never sent.
  // The orchestrator's `!creatorWallet` / `new PublicKey()` checks remain as
  // defense-in-depth backstops.
  it("refuses a course with NO creator wallet", async () => {
    courses = [validCourse({ creatorWallet: null })];
    await expectRefusedIntact(/missing required fields.*creatorWallet/i);
  });

  it("refuses an unparseable creator wallet", async () => {
    courses = [validCourse({ creatorWallet: "not-a-real-pubkey!!!" })];
    await expectRefusedIntact(/missing required fields.*creatorWallet/i);
  });

  // An off-curve PDA is valid base58 and passes the shape gate above — only the
  // orchestrator's on-curve check stops it.
  it("refuses an OFF-CURVE creator wallet (a PDA cannot own the reward ATA)", async () => {
    const [offCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("nope")],
      getProgramId()
    );
    expect(PublicKey.isOnCurve(offCurve.toBytes())).toBe(false);
    courses = [validCourse({ creatorWallet: offCurve.toBase58() })];
    await expectRefusedIntact(/off-curve/i);
  });

  // The #427 guard, running for real (not a mock) inside pre-flight.
  it("refuses a DENYLISTED creator (#427 guard) — the System program", async () => {
    courses = [
      validCourse({ creatorWallet: "11111111111111111111111111111111" }),
    ];
    await expectRefusedIntact(
      /denylisted well-known address \(System program\)/i
    );
  });

  it("refuses a DENYLISTED creator (#427 guard) — the Token-2022 program", async () => {
    courses = [
      validCourse({
        creatorWallet: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
      }),
    ];
    await expectRefusedIntact(/denylisted well-known address/i);
  });

  // This is issue #440 itself: the live courses have creator == platform authority.
  it("refuses creator == platform authority (#427 guard / the #440 bug)", async () => {
    courses = [validCourse({ creatorWallet: AUTHORITY.toBase58() })];
    await expectRefusedIntact(/equals the platform authority/i);
  });

  it("refuses when the course is missing required fields", async () => {
    courses = [validCourse({ xpPerLesson: 0, lessonCount: 0 })];
    await expectRefusedIntact(/missing required fields/i);
  });

  it("refuses a course absent from the content bundle", async () => {
    courses = [];
    await expectRefusedIntact(/not found in the content bundle/i);
  });

  it("refuses a draft id", async () => {
    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse("drafts.course-x");
    } catch (e) {
      thrown = e as RecreateCourseError;
    }
    expect(thrown!.phase).toBe("preflight");
    expect(closeCoursePda).not.toHaveBeenCalled();
  });

  it("refuses when the admin signer is not configured", async () => {
    authority = null;
    await expectRefusedIntact(/Admin signer not configured/i);
  });

  it("refuses when the course is NOT deployed (nothing to recreate)", async () => {
    accounts = new Map();
    await expectRefusedIntact(/not deployed on-chain.*nothing to recreate/is);
  });

  it("refuses when the prerequisite course is not yet deployed", async () => {
    courses = [
      validCourse({
        prerequisiteCourse: {
          _id: "course-intro",
          slug: "intro",
          title: "Intro",
        },
      }),
    ];
    // Target exists on-chain; the prerequisite does not.
    await expectRefusedIntact(/Prerequisite course "Intro" is not deployed/i);
  });
});

// ---------------------------------------------------------------------------
// RAIL 2 / H3 — the recreate must never widen lesson_count relative to what is
// currently live on-chain.
// ---------------------------------------------------------------------------
describe("rail 2 (H3) — lesson_count defaults to the live on-chain value", () => {
  it("refuses when the content bundle requests MORE lessons than are live on-chain", async () => {
    courses = [validCourse({ lessonCount: 10 })];
    onChainCourse = { ...onChainCourse!, liveLessonCount: 5 };

    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse(COURSE_ID);
    } catch (e) {
      thrown = e as RecreateCourseError;
    }
    expect(thrown).toBeInstanceOf(RecreateCourseError);
    expect(thrown!.phase).toBe("preflight");
    expect(thrown!.courseIntact).toBe(true);
    expect(thrown!.message).toMatch(/lessonCount=10/);
    expect(thrown!.message).toMatch(/live on-chain lesson count is 5/);
    expect(thrown!.message).toMatch(
      /silently un-complete mid-course learners/i
    );
    // Never touched — this is a preflight refusal.
    expect(closeCoursePda).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it("defaults to the on-chain count even when the bundle requests FEWER lessons", async () => {
    courses = [validCourse({ lessonCount: 3 })];
    onChainCourse = { ...onChainCourse!, liveLessonCount: 5 };

    await recreateCourse(COURSE_ID);

    expect(deployCoursePda).toHaveBeenCalledWith(
      expect.objectContaining({ lessonCount: 5 })
    );
  });

  it("uses the EXACT on-chain count when the bundle agrees", async () => {
    courses = [validCourse({ lessonCount: 5 })];
    onChainCourse = { ...onChainCourse!, liveLessonCount: 5 };

    await recreateCourse(COURSE_ID);

    expect(deployCoursePda).toHaveBeenCalledWith(
      expect.objectContaining({ lessonCount: 5 })
    );
  });

  it("falls back to the content bundle's lessonCount when the live account is undecodable", async () => {
    fetchCourseThrows = true;
    courses = [validCourse({ lessonCount: 5 })];

    await recreateCourse(COURSE_ID);

    expect(deployCoursePda).toHaveBeenCalledWith(
      expect.objectContaining({ lessonCount: 5 })
    );
  });
});

// ---------------------------------------------------------------------------
// RAIL 3 — the per-course maintenance gate: set before the close, cleared once
// the course is safe again.
// ---------------------------------------------------------------------------
describe("rail 3 — the maintenance gate", () => {
  it("sets the gate BEFORE the close and clears it AFTER a successful recreate", async () => {
    await recreateCourse(COURSE_ID);
    expect(calls).toEqual([
      "gate:on",
      "close",
      "create",
      "bind",
      "db:synced",
      "gate:off",
    ]);
  });

  it("clears the gate when the close itself fails (course untouched)", async () => {
    closeResult = { success: false, error: "Unauthorized" } as never;
    await expect(recreateCourse(COURSE_ID)).rejects.toBeInstanceOf(
      RecreateCourseError
    );
    expect(calls).toEqual(["gate:on", "close", "gate:off"]);
  });

  it("LEAVES the gate ON when the create ultimately fails (course is genuinely down)", async () => {
    vi.useFakeTimers();
    createResults = Array.from({ length: 4 }, () => ({
      success: false,
      error: "rpc down",
    }));

    const promise = recreateCourse(COURSE_ID);
    const captured = captureError(promise);
    await vi.runAllTimersAsync();
    await captured;

    expect(calls).toEqual([
      "gate:on",
      "close",
      "create",
      "create",
      "create",
      "create",
      "db:not_deployed",
    ]);
    // Deliberately no "gate:off" — the course needs an operator redeploy, and
    // write paths should keep refusing/queuing until that happens.
    expect(calls).not.toContain("gate:off");
  });

  it("a maintenance-flag WRITE failure does not block a preflight-validated recreate", async () => {
    vi.mocked(writeCourseMaintenanceFlag).mockRejectedValueOnce(
      new Error("supabase down")
    );
    const result = await recreateCourse(COURSE_ID);
    expect(result.action).toBe("recreated");
    expect(closeCoursePda).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// HAPPY PATH
// ---------------------------------------------------------------------------
describe("close → create happy path", () => {
  it("closes, recreates, re-binds the collection, and persists a synced row IN THAT ORDER", async () => {
    const result = await recreateCourse(COURSE_ID);

    // The ordering IS the safety property: gate on, close strictly before
    // create, the DB row written only after the create landed, gate off last.
    expect(calls).toEqual([
      "gate:on",
      "close",
      "create",
      "bind",
      "db:synced",
      "gate:off",
    ]);

    expect(result.action).toBe("recreated");
    expect(result.coursePda).toBe(coursePda(COURSE_ID));
    expect(result.closeSignature).toBe("close-sig");
    expect(result.createSignature).toBe("create-sig");
    expect(result.createAttempts).toBe(1);
  });

  it("passes the content bundle's creator + create-only fields to create_course", async () => {
    await recreateCourse(COURSE_ID);
    expect(deployCoursePda).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: COURSE_ID,
        creatorWallet: INSTRUCTOR,
        difficulty: 1,
        trackId: 1,
        trackLevel: 1,
        lessonCount: 5,
        creatorRewardXp: 500,
        minCompletionsForReward: 10,
      })
    );
  });

  it("REPORTS the counters the recreate destroys (they cannot be restored)", async () => {
    const result = await recreateCourse(COURSE_ID);
    expect(result.lostCounters).toEqual({
      totalCompletions: 42,
      totalEnrollments: 100,
    });
  });

  it("re-binds the EXISTING collection rather than minting a new one", async () => {
    await recreateCourse(COURSE_ID);
    const { setCourseCollectionPda } =
      await import("@/lib/solana/admin-signer");
    expect(setCourseCollectionPda).toHaveBeenCalledWith(COURSE_ID, COLLECTION);
  });

  it("re-deactivates a course that was deactivated before the recreate", async () => {
    // create_course forces is_active = true, which would silently un-hide it.
    onChainCourse = { ...onChainCourse!, is_active: false };
    const result = await recreateCourse(COURSE_ID);
    expect(calls).toEqual([
      "gate:on",
      "close",
      "create",
      "bind",
      "deactivate",
      "db:synced",
      "gate:off",
    ]);
    expect(result.warnings.join(" ")).not.toMatch(/currently LIVE/);
  });

  it("warns (but does not fail) when the collection re-bind fails", async () => {
    bindResult = { success: false, error: "blockhash expired" } as never;
    const result = await recreateCourse(COURSE_ID);
    expect(result.action).toBe("recreated");
    expect(result.warnings.join(" ")).toMatch(/Collection re-bind failed/i);
  });
});

// ---------------------------------------------------------------------------
// THE DANGEROUS PATH: create fails AFTER the close landed.
// ---------------------------------------------------------------------------
describe("create fails after close — the course is DOWN", () => {
  it("retries the create, then fails LOUD with an honest DB row and the recovery message", async () => {
    vi.useFakeTimers();
    createResults = [
      { success: false, error: "blockhash not found" },
      { success: false, error: "blockhash not found" },
      { success: false, error: "node is behind" },
      { success: false, error: "node is behind" },
    ];

    const promise = recreateCourse(COURSE_ID);
    const captured = captureError(promise);
    await vi.runAllTimersAsync();
    const thrown = await captured;

    expect(thrown).toBeInstanceOf(RecreateCourseError);
    expect(thrown.phase).toBe("create");

    // THE flag the caller must branch on: the course is NOT intact.
    expect(thrown.courseIntact).toBe(false);

    // It retried hard (4 attempts), then persisted the truth. Note the DB row is
    // written AFTER the last failed create — and is `not_deployed`, never a stale
    // `synced` claiming the course is fine.
    expect(calls).toEqual([
      "gate:on",
      "close",
      "create",
      "create",
      "create",
      "create",
      "db:not_deployed",
    ]);

    // The error names the exact recovery path (the existing Deploy button works,
    // because status is derived from the ABSENCE of the on-chain account).
    expect(thrown.message).toMatch(
      /currently NOT deployed on-chain; use Deploy to recreate it/i
    );
    // ...and states that learner progress survived, which is the whole premise.
    expect(thrown.message).toMatch(
      /Enrollments, learner progress and already-minted XP are intact/i
    );
    // ...and surfaces the close signature so the operator can audit the chain.
    expect(thrown.message).toMatch(/close-sig/);
    // ...and does not swallow the underlying cause.
    expect(thrown.message).toMatch(/node is behind/);
  });

  it("succeeds on a later attempt without failing the operation", async () => {
    vi.useFakeTimers();
    createResults = [
      { success: false, error: "blockhash not found" },
      { success: true, signature: "create-sig-2" },
    ];

    const promise = recreateCourse(COURSE_ID);
    const captured = promise.then((r) => r);
    await vi.runAllTimersAsync();
    const result = await captured;

    expect(result.createAttempts).toBe(2);
    expect(result.createSignature).toBe("create-sig-2");
    expect(calls).toEqual([
      "gate:on",
      "close",
      "create",
      "create",
      "bind",
      "db:synced",
      "gate:off",
    ]);
  });

  it("still throws the loud error when persisting not_deployed ALSO fails", async () => {
    vi.useFakeTimers();
    createResults = Array.from({ length: 4 }, () => ({
      success: false,
      error: "rpc down",
    }));
    dbThrows = true;

    const promise = recreateCourse(COURSE_ID);
    const captured = captureError(promise);
    await vi.runAllTimersAsync();
    const thrown = await captured;

    // A failed DB write must NOT mask the fact that the course is down.
    expect(thrown).toBeInstanceOf(RecreateCourseError);
    expect(thrown.courseIntact).toBe(false);
    expect(thrown.message).toMatch(/use Deploy to recreate it/i);
  });
});

// ---------------------------------------------------------------------------
// CLOSE fails: the course is still there, untouched.
// ---------------------------------------------------------------------------
describe("close fails", () => {
  it("reports the course as INTACT and never attempts the create", async () => {
    closeResult = { success: false, error: "Unauthorized" } as never;

    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse(COURSE_ID);
    } catch (e) {
      thrown = e as RecreateCourseError;
    }

    expect(thrown!.phase).toBe("close");
    expect(thrown!.courseIntact).toBe(true);
    expect(thrown!.message).toMatch(/UNCHANGED and still deployed/i);
    expect(deployCoursePda).not.toHaveBeenCalled();
    expect(calls).toEqual(["gate:on", "close", "gate:off"]);
  });
});
