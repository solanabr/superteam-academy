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

// F3 — devnet's real, public genesis hash. The mocked Connection returns this
// by default so every existing test exercises the "authenticated" path.
const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

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
// F3 mock controls — the connection's own genesis hash, independent of the
// NEXT_PUBLIC_SOLANA_NETWORK label.
let genesisHash = DEVNET_GENESIS_HASH;
let genesisHashThrows = false;
// Mainnet freeze re-check: the course as read back after deactivating it, and
// the deactivation's slot as the RPC reports it (null = not seen).
let recheckCourse: Record<string, unknown> | null = null;
let deactivationSlot: number | null = 123;
const MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
// The RPC endpoint the mainnet course-identity guard reads (SOLANA_RPC_URL).
// Independent of the label and the genesis hash, so a mainnet host can be
// simulated while rail 4 still passes.
const DEVNET_RPC = "https://api.devnet.solana.com";
let rpcUrl = DEVNET_RPC;
const BACKEND_SIGNER = Keypair.generate().publicKey;

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    get SOLANA_RPC_URL() {
      return rpcUrl;
    },
  },
}));

// The REAL #427 guard (assertCreatorAllowed + CREATOR_DENYLIST) is kept via
// importOriginal — mocking it would test the mock, not the guard. Only the
// tx-sending functions are stubbed.
vi.mock("@/lib/solana/admin-signer", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/solana/admin-signer")>();
  return {
    ...actual,
    getAuthorityPublicKey: () => authority,
    getPlatformBackendSigners: async () => [BACKEND_SIGNER],
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
    updateCoursePda: vi.fn(async (p: { newIsActive?: boolean }) => {
      calls.push(p.newIsActive === true ? "activate" : "deactivate");
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
  decodeCourse: () => recheckCourse,
}));

vi.mock("@/lib/content/deployment-writes", () => ({
  writeCourseOnChainStatus: vi.fn(async (_id: string, status: string) => {
    calls.push(`db:${status}`);
    if (dbThrows) throw new Error("supabase down");
  }),
  writeCourseMaintenanceFlag: vi.fn(async (_id: string, on: boolean) => {
    calls.push(on ? "gate:on" : "gate:off");
  }),
  // F2 — the conditional acquire. Default: always succeeds (this call holds
  // the gate), matching the pre-F2 unconditional-SET behaviour for every
  // existing test. Individual tests override via `vi.mocked(...)` to
  // exercise contention (`mockResolvedValueOnce(false)`) or a DB error
  // (`mockRejectedValueOnce(...)`).
  acquireCourseMaintenanceGate: vi.fn(async (_id: string) => {
    calls.push("gate:on");
    return true;
  }),
}));

// #738 — the recreate now records a `recreated` changelog entry (non-fatal,
// last). Mock it so the test stays hermetic (no real supabase) and so we can
// assert it fires on the happy path and its ordering (after synced + gate off).
vi.mock("@/lib/content/changelog-writes", () => ({
  recordCourseRecreated: vi.fn(async () => {
    calls.push("changelog:recreated");
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
      async getGenesisHash() {
        if (genesisHashThrows) throw new Error("RPC unreachable");
        return genesisHash;
      }
      async getSignatureStatus() {
        return {
          context: { slot: 1 },
          value: deactivationSlot == null ? null : { slot: deactivationSlot },
        };
      }
    },
  };
});

import { recreateCourse, RecreateCourseError } from "../recreate-course";
import { findCoursePDA, getProgramId } from "@/lib/solana/pda";
import { closeCoursePda, deployCoursePda } from "@/lib/solana/admin-signer";
import {
  writeCourseMaintenanceFlag,
  acquireCourseMaintenanceGate,
} from "@/lib/content/deployment-writes";

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
  genesisHash = DEVNET_GENESIS_HASH;
  genesisHashThrows = false;
  recheckCourse = null;
  deactivationSlot = 123;
  rpcUrl = DEVNET_RPC;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// RAIL 4 — the cluster. The RPC's genesis hash identifies it and the label must
// agree; anything else is refused before anything is touched.
// ---------------------------------------------------------------------------
describe("rail 4 — genesis hash and label must agree on devnet or mainnet", () => {
  const expectRefused = async (pattern: RegExp) => {
    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse(COURSE_ID);
    } catch (e) {
      thrown = e as RecreateCourseError;
    }
    expect(thrown).toBeInstanceOf(RecreateCourseError);
    expect(thrown!.phase).toBe("preflight");
    expect(thrown!.courseIntact).toBe(true);
    expect(thrown!.message).toMatch(pattern);
    expect(closeCoursePda).not.toHaveBeenCalled();
    expect(writeCourseMaintenanceFlag).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  };

  it.each(["mainnet", "mainnet-beta"])(
    'refuses a "%s" label on devnet\'s genesis',
    async (label) => {
      process.env.NEXT_PUBLIC_SOLANA_NETWORK = label;
      await expectRefused(/do not identify devnet or mainnet together/i);
    }
  );

  it("refuses an unset label (default-deny, not default-allow)", async () => {
    delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
    await expectRefused(/"unset"/);
  });

  it('refuses a "devnet" label on mainnet\'s genesis', async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
    genesisHash = MAINNET_GENESIS_HASH;
    await expectRefused(/genesis hash/i);
  });

  it("refuses a genesis hash that is neither devnet's nor mainnet's", async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
    genesisHash = "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY"; // testnet
    await expectRefused(/do not identify devnet or mainnet together/i);
  });

  it("fail-safe: refuses when the genesis hash cannot be fetched at all", async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
    genesisHashThrows = true;
    await expectRefused(/could not verify/i);
  });

  it("proceeds on devnet when the label AND the genesis hash say devnet", async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "devnet";
    const result = await recreateCourse(COURSE_ID);
    expect(result.action).toBe("recreated");
    expect(closeCoursePda).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// MAINNET — only while nobody is enrolled. Pre-flight checks the live count;
// after the gate, the course is deactivated (enroll is learner-signed, the gate
// can't stop it) and the count is re-read before the close.
// ---------------------------------------------------------------------------
describe("mainnet recreate — zero enrollments only", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "mainnet";
    genesisHash = MAINNET_GENESIS_HASH;
    onChainCourse = { ...onChainCourse, total_enrollments: 0 };
    recheckCourse = { is_active: false, total_enrollments: 0 };
  });

  it("recreates a course with zero enrollments, deactivating it before the close", async () => {
    const result = await recreateCourse(COURSE_ID);

    expect(result.action).toBe("recreated");
    expect(calls.slice(0, 3)).toEqual(["gate:on", "deactivate", "close"]);
    expect(calls).toContain("create");
    // create_course sets is_active=true and the course was active before, so
    // nothing re-deactivates it afterwards.
    expect(calls.filter((c) => c === "deactivate")).toHaveLength(1);
  });

  it("refuses a course with one or more enrollments, touching nothing", async () => {
    onChainCourse = { ...onChainCourse, total_enrollments: 1 };

    const err = await captureError(recreateCourse(COURSE_ID));

    expect(err.phase).toBe("preflight");
    expect(err.courseIntact).toBe(true);
    expect(err.message).toMatch(/1 enrollment\(s\)/);
    expect(calls).toEqual([]);
  });

  it("refuses when an enrollment appears between the pre-flight read and the close", async () => {
    recheckCourse = { is_active: false, total_enrollments: 1 };

    const err = await captureError(recreateCourse(COURSE_ID));

    expect(err.phase).toBe("preflight");
    expect(err.courseIntact).toBe(true);
    expect(err.message).toMatch(/someone enrolled after the pre-flight/i);
    // Deactivated, found the enrollment, re-activated, released the gate.
    expect(calls).toEqual(["gate:on", "deactivate", "activate", "gate:off"]);
    expect(closeCoursePda).not.toHaveBeenCalled();
  });

  it("refuses when the course does not read back inactive", async () => {
    recheckCourse = { is_active: true, total_enrollments: 0 };

    const err = await captureError(recreateCourse(COURSE_ID));

    expect(err.message).toMatch(/did not read back as inactive/i);
    expect(closeCoursePda).not.toHaveBeenCalled();
  });

  it("refuses when the RPC has not seen the deactivation", async () => {
    deactivationSlot = null;

    const err = await captureError(recreateCourse(COURSE_ID));

    expect(err.message).toMatch(/could not confirm the deactivation/i);
    expect(calls).toEqual(["gate:on", "deactivate", "activate", "gate:off"]);
  });

  it("refuses when the live course cannot be read to prove zero enrollments", async () => {
    onChainCourse = null;

    const err = await captureError(recreateCourse(COURSE_ID));

    expect(err.message).toMatch(/confirm it has no enrollments/i);
    expect(calls).toEqual([]);
  });

  it("ignores allowUnusualCreator: creator == authority is refused", async () => {
    courses = [validCourse({ creatorWallet: AUTHORITY.toBase58() })];

    const err = await captureError(recreateCourse(COURSE_ID, true));

    expect(err.phase).toBe("preflight");
    expect(err.message).toMatch(/equals the platform authority/i);
    expect(calls).toEqual([]);
  });

  it("puts is_active back when the close fails after the freeze", async () => {
    closeResult = { success: false, signature: "" };

    const err = await captureError(recreateCourse(COURSE_ID));

    expect(err.phase).toBe("close");
    expect(err.courseIntact).toBe(true);
    expect(calls).toEqual([
      "gate:on",
      "deactivate",
      "close",
      "activate",
      "gate:off",
    ]);
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

  it("refuses (rather than falling back to the content bundle's lessonCount) when the live account exists but is undecodable", async () => {
    fetchCourseThrows = true;
    courses = [validCourse({ lessonCount: 5 })];

    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse(COURSE_ID);
    } catch (e) {
      thrown = e as RecreateCourseError;
    }
    expect(thrown).toBeInstanceOf(RecreateCourseError);
    expect(thrown!.phase).toBe("preflight");
    // Nothing was destroyed — the refusal happens before the close.
    expect(thrown!.courseIntact).toBe(true);
    expect(thrown!.message).toMatch(/could not be decoded/i);
    expect(thrown!.message).toMatch(/cannot verify the on-chain lesson count/i);
    expect(closeCoursePda).not.toHaveBeenCalled();
    expect(deployCoursePda).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it("still refuses when the content bundle's lessonCount would have matched the on-chain value (undecodable blocks ANY recreate, not just supersets)", async () => {
    // Distinguishes "refuse because we can't verify" from "refuse because the
    // bundle wants a superset" — this case has no superset, only an
    // undecodable account, and must still refuse.
    fetchCourseThrows = true;
    courses = [validCourse({ lessonCount: 3 })];

    await expect(recreateCourse(COURSE_ID)).rejects.toBeInstanceOf(
      RecreateCourseError
    );
    expect(closeCoursePda).not.toHaveBeenCalled();
  });

  it("the course-not-yet-deployed case is unaffected — that still refuses earlier with its own message, never reaching the decode try/catch", async () => {
    accounts = new Map(); // no account at all — a genuinely different case from "exists but corrupt"
    fetchCourseThrows = true; // would blow up if the code ever reached fetchCourse for this course
    courses = [validCourse({ lessonCount: 5 })];

    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse(COURSE_ID);
    } catch (e) {
      thrown = e as RecreateCourseError;
    }
    expect(thrown!.message).toMatch(
      /not deployed on-chain.*nothing to recreate/is
    );
    expect(closeCoursePda).not.toHaveBeenCalled();
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
      // #738 — the changelog entry is recorded LAST (non-fatal), after the
      // course is fully up, restored, and the gate is cleared.
      "changelog:recreated",
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

  it("ABORTS before the close when the maintenance gate ACQUIRE write fails — never closes unguarded", async () => {
    // The acquire is the FIRST gate operation, before the close. A lost
    // acquire must not be silently swallowed: closing without the guard in
    // place would leave the absent-PDA window completely unprotected. Better
    // to not start than to close unguarded.
    vi.mocked(acquireCourseMaintenanceGate).mockRejectedValueOnce(
      new Error("supabase down")
    );

    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse(COURSE_ID);
    } catch (e) {
      thrown = e as RecreateCourseError;
    }
    expect(thrown).toBeInstanceOf(RecreateCourseError);
    expect(thrown!.courseIntact).toBe(true);
    expect(thrown!.message).toMatch(/maintenance gate/i);
    expect(closeCoursePda).not.toHaveBeenCalled();
    expect(deployCoursePda).not.toHaveBeenCalled();
    // The rejected acquire call never recorded "gate:on" (the mock's real
    // implementation, which pushes to `calls`, was overridden for this one
    // call) — nothing else should have run either.
    expect(calls).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // F2 — mutual exclusion. A concurrent recreate (a UI double-click) must not
  // both proceed: the SECOND caller's acquire fails (0 rows / already held)
  // and it must abort BEFORE ever closing anything — so it can never clear the
  // FIRST caller's gate out from under it (the exact bug this fix closes).
  // ---------------------------------------------------------------------------
  it("F2: ABORTS before the close when a concurrent recreate already holds the gate", async () => {
    vi.mocked(acquireCourseMaintenanceGate).mockResolvedValueOnce(false);

    let thrown: RecreateCourseError | undefined;
    try {
      await recreateCourse(COURSE_ID);
    } catch (e) {
      thrown = e as RecreateCourseError;
    }
    expect(thrown).toBeInstanceOf(RecreateCourseError);
    expect(thrown!.phase).toBe("preflight");
    expect(thrown!.courseIntact).toBe(true);
    expect(thrown!.message).toMatch(/already in progress/i);
    // The losing caller never reaches close — and therefore never reaches a
    // clear either, so it cannot touch whatever gate state the WINNER is
    // relying on for its own in-flight recreate.
    expect(closeCoursePda).not.toHaveBeenCalled();
    expect(deployCoursePda).not.toHaveBeenCalled();
    expect(writeCourseMaintenanceFlag).not.toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it("a maintenance-flag CLEAR write failure does not block an otherwise-successful recreate", async () => {
    // CLEAR (turning the gate back off, at the very end) is best-effort: the
    // course is already correctly recreated by the time it runs, so a lost
    // clear only means the gate stays on a little longer, not that anything
    // is unprotected. `writeCourseMaintenanceFlag` is only ever called for the
    // CLEAR half now (the SET half is `acquireCourseMaintenanceGate`), so
    // there is exactly one call to reject here.
    vi.mocked(writeCourseMaintenanceFlag).mockRejectedValueOnce(
      new Error("supabase down")
    );

    const result = await recreateCourse(COURSE_ID);
    expect(result.action).toBe("recreated");
    expect(closeCoursePda).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // F1(b) — the success-path gate clear must survive a THROWING status write.
  // ---------------------------------------------------------------------------
  it("F1(b): the success-clear survives a throwing status write — the gate still comes off", async () => {
    // dbThrows makes writeCourseOnChainStatus throw for EVERY status,
    // including the success path's "synced" write.
    dbThrows = true;

    const result = await recreateCourse(COURSE_ID);

    expect(result.action).toBe("recreated");
    // The DB write was attempted (and threw, swallowed internally), but the
    // gate clear still ran right after it — never skipped by the throw.
    expect(calls).toEqual([
      "gate:on",
      "close",
      "create",
      "bind",
      "db:synced",
      "gate:off",
      "changelog:recreated",
    ]);
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
      "changelog:recreated",
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
      "changelog:recreated",
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
    // ...and says what the learner side loses: XP stays, on-chain progress
    // does not carry over (the recreated course gets a new generation).
    expect(thrown.message).toMatch(/Already-minted XP is unaffected/i);
    expect(thrown.message).toMatch(
      /on-chain progress does not carry over to the recreated course/i
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
      "changelog:recreated",
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

// ---------------------------------------------------------------------------
// Mainnet course-identity guard. The same guard deployCoursePda runs, but in
// pre-flight so a refusal happens BEFORE the close. Reached here by pointing
// SOLANA_RPC_URL at a mainnet host while the label and genesis say devnet.
// ---------------------------------------------------------------------------
describe("mainnet course-identity guard runs in pre-flight, before the close", () => {
  const MAINNET_RPC = "https://mainnet.helius-rpc.com/?api-key=x";

  it("refuses trackId 0 and touches nothing", async () => {
    rpcUrl = MAINNET_RPC;
    courses = [validCourse({ trackId: 0 })];

    const err = await captureError(recreateCourse(COURSE_ID));

    expect(err).toBeInstanceOf(RecreateCourseError);
    expect(err.phase).toBe("preflight");
    expect(err.courseIntact).toBe(true);
    expect(err.errorId).toBe("COURSE_IDENTITY_001");
    expect(calls).toEqual([]);
    expect(closeCoursePda).not.toHaveBeenCalled();
    expect(deployCoursePda).not.toHaveBeenCalled();
  });

  it("refuses creator == authority even with allowUnusualCreator", async () => {
    rpcUrl = MAINNET_RPC;
    courses = [validCourse({ creatorWallet: AUTHORITY.toBase58() })];

    const err = await captureError(recreateCourse(COURSE_ID, true));

    expect(err.errorId).toBe("COURSE_IDENTITY_001");
    expect(calls).toEqual([]);
  });

  it("refuses creator == backend signer", async () => {
    rpcUrl = MAINNET_RPC;
    courses = [validCourse({ creatorWallet: BACKEND_SIGNER.toBase58() })];

    const err = await captureError(recreateCourse(COURSE_ID));

    expect(err.errorId).toBe("COURSE_IDENTITY_001");
    expect(calls).toEqual([]);
  });

  it("lets a course with a real track, level and instructor through", async () => {
    rpcUrl = MAINNET_RPC;

    const result = await recreateCourse(COURSE_ID);

    expect(result.action).toBe("recreated");
    expect(calls).toContain("close");
    expect(calls).toContain("create");
  });
});
