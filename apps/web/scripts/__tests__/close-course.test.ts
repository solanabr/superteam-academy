/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module imports so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";

vi.mock("server-only", () => ({}));

const COURSE_ID = "aD45H1NEbb1bqELwloGCqI";
const OTHER_COURSE_ID = "some-other-course";

// F3 — devnet's real, public genesis hash. The mocked Connection returns this
// by default so every test exercises the "authenticated" path unless a test
// overrides it.
const DEVNET_GENESIS_HASH = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

const CREATOR = Keypair.generate().publicKey;

// ---------------------------------------------------------------------------
// Mutable mock state, reset per test. Kept as plain outer `let`s (not
// re-assigned via `mockImplementation`) so `vi.clearAllMocks()` in beforeEach
// can never leave a stale per-test override behind — every mock factory below
// reads these closures fresh on each call.
// ---------------------------------------------------------------------------
let accounts: Map<string, { lamports: number; data: Buffer } | null>;
let decodedCourse: {
  creator: PublicKey;
  is_active: boolean;
  total_enrollments: number;
  total_completions: number;
} | null;
let fetchCourseThrows = false;
let closeResult: { success: boolean; signature?: string; error?: string };
let genesisHash = DEVNET_GENESIS_HASH;
let genesisHashThrows = false;
/** Per-test hook for what a "successful" closeCoursePda does to on-chain state. */
let onCloseCalled: (courseId: string) => void = () => {};

vi.mock("@/lib/solana/admin-signer", () => ({
  closeCoursePda: vi.fn(async (courseId: string) => {
    onCloseCalled(courseId);
    return closeResult;
  }),
}));

vi.mock("@/lib/solana/academy-reads", () => ({
  fetchCourse: vi.fn(async () => {
    if (fetchCourseThrows) throw new Error("unexpected Course account length");
    return decodedCourse;
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
    },
  };
});

import {
  runCloseCourse,
  previewCourse,
  parseArgs,
  assertDevnetGenesis,
  redactRpcUrls,
  redactUrl,
  CloseCourseRefusal,
  DEVNET_GENESIS_HASH as EXPORTED_HASH,
  type CloseCourseArgs,
} from "../close-course";
import { closeCoursePda } from "@/lib/solana/admin-signer";
import { fetchCourse } from "@/lib/solana/academy-reads";
import { findCoursePDA, getProgramId } from "@/lib/solana/pda";
import { Connection } from "@solana/web3.js";

const coursePda = (id: string) =>
  findCoursePDA(id, getProgramId())[0].toBase58();

/** Args for a plain dry-run preview (no --execute). */
function dryRunArgs(courseId: string | undefined = COURSE_ID): CloseCourseArgs {
  return { courseId, execute: false, confirmed: false };
}

/** Args for --execute with the exact confirmation token present. */
function executeArgs(courseId = COURSE_ID): CloseCourseArgs {
  return { courseId, execute: true, confirmed: true };
}

/** Args for --execute WITHOUT the confirmation token (or a mismatched one). */
function unconfirmedExecuteArgs(courseId = COURSE_ID): CloseCourseArgs {
  return { courseId, execute: true, confirmed: false };
}

const noopLog = () => {};
const connection = () =>
  new Connection("https://example-rpc.test", "confirmed");

beforeEach(() => {
  accounts = new Map([
    [coursePda(COURSE_ID), { lamports: 1, data: Buffer.alloc(224) }],
  ]);
  decodedCourse = {
    creator: CREATOR,
    is_active: true,
    total_enrollments: 3,
    total_completions: 1,
  };
  fetchCourseThrows = false;
  closeResult = { success: true, signature: "close-sig" };
  genesisHash = DEVNET_GENESIS_HASH;
  genesisHashThrows = false;
  onCloseCalled = () => {};
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// parseArgs — pure argv parsing
// ---------------------------------------------------------------------------
describe("parseArgs", () => {
  it("parses --course-id, --execute and the exact confirmation token", () => {
    const args = parseArgs([
      "--course-id",
      COURSE_ID,
      "--execute",
      `--i-understand-this-closes-${COURSE_ID}`,
    ]);
    expect(args).toEqual({
      courseId: COURSE_ID,
      execute: true,
      confirmed: true,
    });
  });

  it("is not confirmed when --execute is given without any token", () => {
    const args = parseArgs(["--course-id", COURSE_ID, "--execute"]);
    expect(args).toEqual({
      courseId: COURSE_ID,
      execute: true,
      confirmed: false,
    });
  });

  it("is not confirmed when the token names a DIFFERENT course id", () => {
    const args = parseArgs([
      "--course-id",
      COURSE_ID,
      "--execute",
      `--i-understand-this-closes-${OTHER_COURSE_ID}`,
    ]);
    expect(args.confirmed).toBe(false);
  });

  it("leaves courseId undefined when --course-id is absent", () => {
    const args = parseArgs(["--execute"]);
    expect(args.courseId).toBeUndefined();
  });

  it("dry-run by default (no --execute at all)", () => {
    const args = parseArgs(["--course-id", COURSE_ID]);
    expect(args.execute).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// redaction helpers
// ---------------------------------------------------------------------------
describe("redaction", () => {
  it("redactRpcUrls strips any bare http(s) URL from arbitrary text", () => {
    const text =
      "fetch failed: https://devnet.helius-rpc.com/?api-key=SECRET123 timed out";
    const redacted = redactRpcUrls(text);
    expect(redacted).not.toContain("SECRET123");
    expect(redacted).not.toContain("https://");
    expect(redacted).toContain("[redacted-rpc-url]");
  });

  it("redactRpcUrls strips multiple URLs", () => {
    const text = "a https://one.test/x b http://two.test/y";
    expect(redactRpcUrls(text)).not.toMatch(/https?:\/\//);
  });

  it("redactUrl keeps only protocol + host", () => {
    expect(redactUrl("https://devnet.helius-rpc.com/?api-key=SECRET")).toBe(
      "https://devnet.helius-rpc.com"
    );
  });

  it("redactUrl fails safe on an unparseable string", () => {
    expect(redactUrl("not a url")).toBe("[unparseable-url]");
  });
});

// ---------------------------------------------------------------------------
// assertDevnetGenesis
// ---------------------------------------------------------------------------
describe("assertDevnetGenesis", () => {
  it("passes silently when the genesis hash matches devnet", async () => {
    await expect(assertDevnetGenesis(connection())).resolves.toBeUndefined();
  });

  it("throws when the genesis hash does not match devnet", async () => {
    genesisHash = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d"; // mainnet-beta-shaped
    await expect(assertDevnetGenesis(connection())).rejects.toThrow(
      /does not match devnet/i
    );
  });

  it("fails closed when the genesis hash cannot be fetched at all", async () => {
    genesisHashThrows = true;
    await expect(assertDevnetGenesis(connection())).rejects.toThrow(
      /could not verify/i
    );
  });

  it("uses the same well-known devnet hash the recreate path pins to", () => {
    expect(EXPORTED_HASH).toBe(DEVNET_GENESIS_HASH);
  });
});

// ---------------------------------------------------------------------------
// previewCourse — the read-only preview
// ---------------------------------------------------------------------------
describe("previewCourse", () => {
  it("reports exists+size even when decode fails, and surfaces the decode error", async () => {
    fetchCourseThrows = true;
    const preview = await previewCourse(
      COURSE_ID,
      connection(),
      getProgramId()
    );
    expect(preview.exists).toBe(true);
    expect(preview.sizeBytes).toBe(224);
    expect(preview.creator).toBeNull();
    expect(preview.decodeError).toMatch(/unexpected Course account length/i);
  });

  it("reports not-exists when there's no account at all", async () => {
    accounts = new Map();
    const preview = await previewCourse(
      COURSE_ID,
      connection(),
      getProgramId()
    );
    expect(preview.exists).toBe(false);
    expect(preview.sizeBytes).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// runCloseCourse — dry-run default: ZERO closeCoursePda calls
// ---------------------------------------------------------------------------
describe("runCloseCourse — dry-run makes ZERO closeCoursePda calls", () => {
  it("dry-run (no --execute) reads the course and calls closeCoursePda ZERO times", async () => {
    const outcome = await runCloseCourse(
      dryRunArgs(),
      connection(),
      getProgramId(),
      noopLog
    );
    expect(outcome).toEqual({ kind: "dry-run" });
    expect(closeCoursePda).not.toHaveBeenCalled();
  });

  it("dry-run still reads and reports size/creator via the length-aware fetchCourse", async () => {
    await runCloseCourse(dryRunArgs(), connection(), getProgramId(), noopLog);
    expect(fetchCourse).toHaveBeenCalledWith(
      COURSE_ID,
      expect.anything(),
      getProgramId()
    );
  });

  it("--execute WITHOUT the exact token stays dry-run — ZERO closeCoursePda calls", async () => {
    const outcome = await runCloseCourse(
      unconfirmedExecuteArgs(),
      connection(),
      getProgramId(),
      noopLog
    );
    expect(outcome).toEqual({ kind: "refused-unconfirmed" });
    expect(closeCoursePda).not.toHaveBeenCalled();
  });

  it("--execute with a token for a DIFFERENT course id stays dry-run", async () => {
    // parseArgs would compute `confirmed: false` for a mismatched id — this
    // exercises runCloseCourse's own handling of that already-resolved input.
    const outcome = await runCloseCourse(
      unconfirmedExecuteArgs(),
      connection(),
      getProgramId(),
      noopLog
    );
    expect(outcome).toEqual({ kind: "refused-unconfirmed" });
    expect(closeCoursePda).not.toHaveBeenCalled();
  });

  it("refuses with CloseCourseRefusal when --course-id is missing, before any read", async () => {
    const args: CloseCourseArgs = {
      courseId: undefined,
      execute: false,
      confirmed: false,
    };
    await expect(
      runCloseCourse(args, connection(), getProgramId(), noopLog)
    ).rejects.toBeInstanceOf(CloseCourseRefusal);
    expect(closeCoursePda).not.toHaveBeenCalled();
    expect(fetchCourse).not.toHaveBeenCalled();
  });

  it("reports not-deployed and never calls closeCoursePda when the PDA doesn't exist, even with --execute + token", async () => {
    accounts = new Map(); // nothing on-chain
    const outcome = await runCloseCourse(
      executeArgs(),
      connection(),
      getProgramId(),
      noopLog
    );
    expect(outcome).toEqual({ kind: "not-deployed" });
    expect(closeCoursePda).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// runCloseCourse — the destructive path
// ---------------------------------------------------------------------------
describe("runCloseCourse — --execute + exact token", () => {
  it("calls closeCoursePda(courseId) exactly once, then confirms the PDA is gone", async () => {
    onCloseCalled = (id) => {
      accounts.delete(coursePda(id));
    };

    const outcome = await runCloseCourse(
      executeArgs(),
      connection(),
      getProgramId(),
      noopLog
    );

    expect(closeCoursePda).toHaveBeenCalledTimes(1);
    expect(closeCoursePda).toHaveBeenCalledWith(COURSE_ID);
    expect(outcome).toEqual({ kind: "closed", signature: "close-sig" });
  });

  it("also passes when the account is still physically present post-close (pending GC) but no longer decodes as a Course", async () => {
    onCloseCalled = (id) => {
      accounts.set(coursePda(id), { lamports: 0, data: Buffer.alloc(0) });
      decodedCourse = null; // fetchCourse now resolves null -> "doesn't decode"
    };

    const outcome = await runCloseCourse(
      executeArgs(),
      connection(),
      getProgramId(),
      noopLog
    );
    expect(closeCoursePda).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({ kind: "closed", signature: "close-sig" });
  });

  it("throws a loud post-close assertion failure if the PDA STILL decodes as a Course after a 'successful' close", async () => {
    // onCloseCalled left as the default no-op: the account + decodedCourse are
    // untouched, so the post-close re-read still finds a live Course — this
    // must be caught and refused, not reported as closed.
    await expect(
      runCloseCourse(executeArgs(), connection(), getProgramId(), noopLog)
    ).rejects.toThrow(/Post-close assertion FAILED/i);
    expect(closeCoursePda).toHaveBeenCalledTimes(1);
  });

  it("throws when closeCoursePda itself fails, with any RPC URL in the error redacted", async () => {
    closeResult = {
      success: false,
      error: "fetch failed: https://leaked-rpc.test/?api-key=SECRET",
    };

    let thrown: Error | undefined;
    try {
      await runCloseCourse(
        executeArgs(),
        connection(),
        getProgramId(),
        noopLog
      );
    } catch (err) {
      thrown = err as Error;
    }
    expect(thrown?.message).toMatch(/closeCoursePda failed/);
    expect(thrown?.message).not.toContain("SECRET");
    expect(thrown?.message).not.toContain("https://");
  });
});

// ---------------------------------------------------------------------------
// Wrong-genesis (non-devnet) — refuses before any close
// ---------------------------------------------------------------------------
describe("runCloseCourse — wrong genesis refuses before any close", () => {
  it("refuses when the RPC genesis hash does not match devnet, and never calls closeCoursePda", async () => {
    genesisHash = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

    await expect(
      runCloseCourse(executeArgs(), connection(), getProgramId(), noopLog)
    ).rejects.toThrow(/does not match devnet/i);
    expect(closeCoursePda).not.toHaveBeenCalled();
  });

  it("refuses (fail-closed) when the genesis hash cannot be fetched, and never calls closeCoursePda", async () => {
    genesisHashThrows = true;

    await expect(
      runCloseCourse(executeArgs(), connection(), getProgramId(), noopLog)
    ).rejects.toThrow(/could not verify/i);
    expect(closeCoursePda).not.toHaveBeenCalled();
  });

  it("a wrong genesis does NOT affect a plain dry-run (the pin is never reached without --execute)", async () => {
    genesisHash = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
    const outcome = await runCloseCourse(
      dryRunArgs(),
      connection(),
      getProgramId(),
      noopLog
    );
    expect(outcome).toEqual({ kind: "dry-run" });
    expect(closeCoursePda).not.toHaveBeenCalled();
  });
});
