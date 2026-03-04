// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PublicKey } from "@solana/web3.js";
import type { ConfigAccount, CourseAccount, EnrollmentAccount } from "@/types/program";

// ---------------------------------------------------------------------------
// Mock all Solana dependencies BEFORE importing the module under test.
// vi.mock is hoisted, so we CANNOT reference variables defined outside the factory.
// ---------------------------------------------------------------------------

vi.mock("../program", () => ({
  getProgram: vi.fn().mockResolvedValue({}),
  getConnection: vi.fn().mockReturnValue({
    getTokenAccountBalance: vi.fn(),
    getMultipleAccountsInfo: vi.fn(),
  }),
}));

vi.mock("../pdas", async () => {
  const { PublicKey: PK } = await import("@solana/web3.js");
  return {
    getConfigPda: vi.fn().mockReturnValue([new PK("11111111111111111111111111111112"), 255]),
    getCoursePda: vi.fn().mockReturnValue([new PK("11111111111111111111111111111113"), 254]),
    getEnrollmentPda: vi.fn().mockReturnValue([new PK("11111111111111111111111111111114"), 253]),
  };
});

vi.mock("../typed-program", () => ({
  getTypedAccounts: vi.fn(),
  getTypedCoder: vi.fn().mockReturnValue({
    accounts: { decode: vi.fn() },
  }),
}));

vi.mock("@solana/spl-token", async () => {
  const { PublicKey: PK } = await import("@solana/web3.js");
  return {
    getAssociatedTokenAddressSync: vi.fn().mockReturnValue(new PK("11111111111111111111111111111115")),
  };
});

vi.mock("@/lib/logger", () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Now import modules (after all mocks are set up)
import { fetchConfig, fetchAllCourses, fetchEnrollment, fetchXpBalance } from "../queries";
import { getTypedAccounts } from "../typed-program";
import { getConnection } from "../program";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALICE = new PublicKey("11111111111111111111111111111112");
const XP_MINT = new PublicKey("11111111111111111111111111111116");

// Builds a full mock accounts object satisfying TypedAccounts shape.
// Uses `as unknown` to bypass strict checking — this is intentional in tests.
function setupMockAccounts(opts: {
  configFetch?: unknown;
  configFetchReject?: unknown;
  courseAll?: unknown;
  courseAllReject?: unknown;
  enrollmentFetchNullable?: unknown;
  enrollmentFetchNullableReject?: unknown;
}) {
  const configFetch = vi.fn();
  if (opts.configFetchReject !== undefined) {
    configFetch.mockRejectedValue(opts.configFetchReject);
  } else if (opts.configFetch !== undefined) {
    configFetch.mockResolvedValue(opts.configFetch);
  }

  const courseAll = vi.fn();
  if (opts.courseAllReject !== undefined) {
    courseAll.mockRejectedValue(opts.courseAllReject);
  } else if (opts.courseAll !== undefined) {
    courseAll.mockResolvedValue(opts.courseAll);
  }

  const enrollmentFetchNullable = vi.fn();
  if (opts.enrollmentFetchNullableReject !== undefined) {
    enrollmentFetchNullable.mockRejectedValue(opts.enrollmentFetchNullableReject);
  } else if (opts.enrollmentFetchNullable !== undefined) {
    enrollmentFetchNullable.mockResolvedValue(opts.enrollmentFetchNullable);
  }

  vi.mocked(getTypedAccounts).mockReturnValue({
    config: { fetch: configFetch, fetchNullable: vi.fn(), all: vi.fn() },
    course: { fetch: vi.fn(), fetchNullable: vi.fn(), all: courseAll },
    enrollment: { fetch: vi.fn(), fetchNullable: enrollmentFetchNullable, all: vi.fn() },
  } as unknown as ReturnType<typeof getTypedAccounts>);
}

function makeConfigAccount(): ConfigAccount {
  return {
    authority: ALICE,
    backendSigner: ALICE,
    xpMint: XP_MINT,
    bump: 255,
  };
}

function makeCourseAccount(courseId = "course-001"): CourseAccount {
  return {
    courseId,
    creator: ALICE,
    contentTxId: [],
    version: 1,
    lessonCount: 5,
    difficulty: 1,
    xpPerLesson: 50,
    trackId: 1,
    trackLevel: 1,
    prerequisite: null,
    creatorRewardXp: 100,
    minCompletionsForReward: 10,
    totalCompletions: 0,
    totalEnrollments: 0,
    isActive: true,
    createdAt: { toNumber: () => 0 } as unknown as import("@coral-xyz/anchor").BN,
    updatedAt: { toNumber: () => 0 } as unknown as import("@coral-xyz/anchor").BN,
    bump: 254,
  };
}

function makeEnrollmentAccount(): EnrollmentAccount {
  return {
    course: ALICE,
    enrolledAt: { toNumber: () => 1000 } as unknown as import("@coral-xyz/anchor").BN,
    completedAt: null,
    lessonFlags: [],
    credentialAsset: null,
    bump: 253,
  };
}

// ---------------------------------------------------------------------------
// fetchConfig
// ---------------------------------------------------------------------------

describe("fetchConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a ConfigAccount when the PDA exists", async () => {
    setupMockAccounts({ configFetch: makeConfigAccount() });
    const result = await fetchConfig();
    expect(result).not.toBeNull();
    expect(result?.bump).toBe(255);
  });

  it("returns the correct xpMint field", async () => {
    setupMockAccounts({ configFetch: makeConfigAccount() });
    const result = await fetchConfig();
    expect(result?.xpMint.toBase58()).toBe(XP_MINT.toBase58());
  });

  it("returns the correct authority field", async () => {
    setupMockAccounts({ configFetch: makeConfigAccount() });
    const result = await fetchConfig();
    expect(result?.authority.toBase58()).toBe(ALICE.toBase58());
  });

  it("returns null when fetch throws (account not found)", async () => {
    setupMockAccounts({ configFetchReject: new Error("Account not found") });
    const result = await fetchConfig();
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    setupMockAccounts({ configFetchReject: new Error("Network timeout") });
    const result = await fetchConfig();
    expect(result).toBeNull();
  });

  it("returns null on malformed data error", async () => {
    setupMockAccounts({ configFetchReject: new TypeError("Cannot read properties of undefined") });
    const result = await fetchConfig();
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchAllCourses
// ---------------------------------------------------------------------------

describe("fetchAllCourses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array of courses when they exist", async () => {
    const courses = [
      { publicKey: ALICE, account: makeCourseAccount("course-001") },
      { publicKey: ALICE, account: makeCourseAccount("course-002") },
    ];
    setupMockAccounts({ courseAll: courses });
    const result = await fetchAllCourses();
    expect(result).toHaveLength(2);
    expect(result[0]?.account.courseId).toBe("course-001");
    expect(result[1]?.account.courseId).toBe("course-002");
  });

  it("returns empty array when no courses exist", async () => {
    setupMockAccounts({ courseAll: [] });
    const result = await fetchAllCourses();
    expect(result).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    setupMockAccounts({ courseAllReject: new Error("RPC error") });
    const result = await fetchAllCourses();
    expect(result).toEqual([]);
  });

  it("returns each course with its publicKey", async () => {
    setupMockAccounts({ courseAll: [{ publicKey: ALICE, account: makeCourseAccount("course-001") }] });
    const result = await fetchAllCourses();
    expect(result[0]?.publicKey.toBase58()).toBe(ALICE.toBase58());
  });

  it("returns empty array on malformed response", async () => {
    setupMockAccounts({ courseAllReject: new TypeError("Unexpected token") });
    const result = await fetchAllCourses();
    expect(result).toEqual([]);
  });

  it("handles a single course response correctly", async () => {
    setupMockAccounts({ courseAll: [{ publicKey: ALICE, account: makeCourseAccount("solo-course") }] });
    const result = await fetchAllCourses();
    expect(result).toHaveLength(1);
    expect(result[0]?.account.lessonCount).toBe(5);
  });

  it("returns courses with correct account data fields", async () => {
    const account = makeCourseAccount("my-course");
    account.xpPerLesson = 75;
    setupMockAccounts({ courseAll: [{ publicKey: ALICE, account }] });
    const result = await fetchAllCourses();
    expect(result[0]?.account.xpPerLesson).toBe(75);
  });

  it("returns courses with isActive flag", async () => {
    const account = makeCourseAccount("active-course");
    account.isActive = true;
    setupMockAccounts({ courseAll: [{ publicKey: ALICE, account }] });
    const result = await fetchAllCourses();
    expect(result[0]?.account.isActive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// fetchEnrollment
// ---------------------------------------------------------------------------

describe("fetchEnrollment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when learner is not enrolled (fetchNullable returns null)", async () => {
    setupMockAccounts({ enrollmentFetchNullable: null });
    const result = await fetchEnrollment("course-001", ALICE);
    expect(result).toBeNull();
  });

  it("returns enrollment account when learner is enrolled", async () => {
    setupMockAccounts({ enrollmentFetchNullable: makeEnrollmentAccount() });
    const result = await fetchEnrollment("course-001", ALICE);
    expect(result).not.toBeNull();
    expect(result?.bump).toBe(253);
  });

  it("returns enrollment with null completedAt for incomplete course", async () => {
    setupMockAccounts({ enrollmentFetchNullable: makeEnrollmentAccount() });
    const result = await fetchEnrollment("course-001", ALICE);
    expect(result?.completedAt).toBeNull();
  });

  it("returns enrollment with null credentialAsset for incomplete course", async () => {
    setupMockAccounts({ enrollmentFetchNullable: makeEnrollmentAccount() });
    const result = await fetchEnrollment("course-001", ALICE);
    expect(result?.credentialAsset).toBeNull();
  });

  it("returns null on network error", async () => {
    setupMockAccounts({ enrollmentFetchNullableReject: new Error("Connection refused") });
    const result = await fetchEnrollment("course-001", ALICE);
    expect(result).toBeNull();
  });

  it("returns null on malformed PDA data", async () => {
    setupMockAccounts({ enrollmentFetchNullableReject: new TypeError("Cannot decode") });
    const result = await fetchEnrollment("course-001", ALICE);
    expect(result).toBeNull();
  });

  it("handles different courseIds correctly", async () => {
    setupMockAccounts({ enrollmentFetchNullable: makeEnrollmentAccount() });
    const result = await fetchEnrollment("course-xyz", ALICE);
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchXpBalance
// ---------------------------------------------------------------------------

describe("fetchXpBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 when token account does not exist (error path)", async () => {
    const conn = vi.mocked(getConnection)();
    vi.mocked(conn.getTokenAccountBalance).mockRejectedValue(new Error("Account not found"));
    const result = await fetchXpBalance(ALICE, XP_MINT);
    expect(result).toBe(0);
  });

  it("returns positive balance when token account exists", async () => {
    const conn = vi.mocked(getConnection)();
    vi.mocked(conn.getTokenAccountBalance).mockResolvedValue({
      value: { amount: "1500", decimals: 0, uiAmount: 1500, uiAmountString: "1500" },
      context: { slot: 1 },
    });
    const result = await fetchXpBalance(ALICE, XP_MINT);
    expect(result).toBe(1500);
  });

  it("returns 0 for zero balance token account", async () => {
    const conn = vi.mocked(getConnection)();
    vi.mocked(conn.getTokenAccountBalance).mockResolvedValue({
      value: { amount: "0", decimals: 0, uiAmount: 0, uiAmountString: "0" },
      context: { slot: 1 },
    });
    const result = await fetchXpBalance(ALICE, XP_MINT);
    expect(result).toBe(0);
  });

  it("returns 0 on network error", async () => {
    const conn = vi.mocked(getConnection)();
    vi.mocked(conn.getTokenAccountBalance).mockRejectedValue(new Error("Network timeout"));
    const result = await fetchXpBalance(ALICE, XP_MINT);
    expect(result).toBe(0);
  });

  it("correctly converts amount string to number", async () => {
    const conn = vi.mocked(getConnection)();
    vi.mocked(conn.getTokenAccountBalance).mockResolvedValue({
      value: { amount: "999999", decimals: 0, uiAmount: 999999, uiAmountString: "999999" },
      context: { slot: 1 },
    });
    const result = await fetchXpBalance(ALICE, XP_MINT);
    expect(result).toBe(999999);
  });

  it("returns 0 on malformed response", async () => {
    const conn = vi.mocked(getConnection)();
    vi.mocked(conn.getTokenAccountBalance).mockRejectedValue(new TypeError("Cannot read properties"));
    const result = await fetchXpBalance(ALICE, XP_MINT);
    expect(result).toBe(0);
  });
});
