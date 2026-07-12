/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module imports so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Call-ORDER log. The safety property of this feature is an ordering one:
// pre-flight must fully validate BEFORE `close_course` destroys the account. So
// every on-chain / DB effect appends to this log and the tests assert the exact
// sequence, not just that the calls happened.
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
  fetchCourse: async () => onChainCourse,
}));

vi.mock("@/lib/content/deployment-writes", () => ({
  writeCourseOnChainStatus: vi.fn(async (_id: string, status: string) => {
    calls.push(`db:${status}`);
    if (dbThrows) throw new Error("supabase down");
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
  authority = AUTHORITY;
  courses = [validCourse()];
  // The course exists on-chain (so there IS something to recreate).
  accounts = new Map([[coursePda(COURSE_ID), { lamports: 1 } as object]]);
  onChainCourse = {
    total_completions: 42,
    total_enrollments: 100,
    is_active: true,
    collection: COLLECTION,
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
// PRE-FLIGHT: must refuse WITHOUT ever calling close. This is the whole safety
// property — it must be impossible to close a course and only then discover the
// create params were bad.
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
    // THE assertion: close_course was never sent, and nothing else was either.
    expect(closeCoursePda).not.toHaveBeenCalled();
    expect(deployCoursePda).not.toHaveBeenCalled();
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
// HAPPY PATH
// ---------------------------------------------------------------------------
describe("close → create happy path", () => {
  it("closes, recreates, re-binds the collection, and persists a synced row IN THAT ORDER", async () => {
    const result = await recreateCourse(COURSE_ID);

    // The ordering IS the safety property: close strictly before create, and the
    // DB row written only after the create landed.
    expect(calls).toEqual(["close", "create", "bind", "db:synced"]);

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
    // The reset re-opens finalize_course's bounded creator-reward window — the
    // one anti-Sybil cap on creator XP. It must be surfaced, never silent.
    expect(result.warnings.join(" ")).toMatch(
      /total_completions was reset from 42 to 0.*RE-OPENS the bounded creator-reward window/is
    );
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
      "close",
      "create",
      "bind",
      "deactivate",
      "db:synced",
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
    expect(calls).toEqual(["close", "create", "create", "bind", "db:synced"]);
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
    expect(calls).toEqual(["close"]);
  });
});
