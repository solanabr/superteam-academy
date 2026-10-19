import { describe, it, expect, afterEach, vi } from "vitest";
import { BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  buildCreateCourseOnChainParams,
  buildUpdateCourseOnChainParams,
  encodeActiveLessonsMask,
  isValidLessonCount,
  MainnetCourseIdentityError,
  type ActiveLessonsMask,
  type CourseIdentityGuard,
  type CreateCourseOnChainParams,
} from "../course-write-params";

const CREATOR = new PublicKey("11111111111111111111111111111112");
const PREREQ = new PublicKey("SysvarRent111111111111111111111111111111111");

const AUTHORITY = Keypair.generate().publicKey;
const BACKEND_SIGNER = Keypair.generate().publicKey;
const INSTRUCTOR = Keypair.generate().publicKey;
const DEVNET_RPC = "https://devnet.helius-rpc.com/?api-key=x";
const MAINNET_RPC = "https://mainnet.helius-rpc.com/?api-key=x";

function guard(rpcUrl: string): CourseIdentityGuard {
  return { rpcUrl, authority: AUTHORITY, backendSigner: BACKEND_SIGNER };
}

describe("buildCreateCourseOnChainParams (v-next create_course)", () => {
  it("emits the v-next CreateCourseParams shape: lessonCount kept, NO minCompletionsForReward", () => {
    const params = buildCreateCourseOnChainParams(
      {
        courseId: "solana-101",
        creator: CREATOR,
        contentTxId: Array(32).fill(0) as number[],
        lessonCount: 12,
        difficulty: 1,
        xpPerLesson: 10,
        trackId: 1,
        trackLevel: 1,
        prerequisite: PREREQ,
        creatorRewardXp: 30,
        collection: null,
      },
      guard(DEVNET_RPC)
    );

    expect(Object.keys(params).sort()).toEqual(
      [
        "collection",
        "contentTxId",
        "courseId",
        "creator",
        "creatorRewardXp",
        "difficulty",
        "lessonCount",
        "prerequisite",
        "trackId",
        "trackLevel",
        "xpPerLesson",
      ].sort()
    );
    // The dropped v1 field must NOT reappear (the program derives the mask from
    // lessonCount; sending min_completions_for_reward would misalign Borsh).
    expect(params).not.toHaveProperty("minCompletionsForReward");
    expect(params.lessonCount).toBe(12);
    expect(params.creator.equals(CREATOR)).toBe(true);
  });
});

describe("mainnet course identity guard (in buildCreateCourseOnChainParams)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function course(
    overrides: Partial<CreateCourseOnChainParams> = {}
  ): CreateCourseOnChainParams {
    return {
      courseId: "course-speedrun",
      creator: INSTRUCTOR,
      contentTxId: Array(32).fill(0) as number[],
      lessonCount: 8,
      difficulty: 1,
      xpPerLesson: 10,
      trackId: 1,
      trackLevel: 1,
      prerequisite: null,
      creatorRewardXp: 30,
      collection: null,
      ...overrides,
    };
  }

  function refusal(
    input: CreateCourseOnChainParams,
    rpcUrl = MAINNET_RPC
  ): MainnetCourseIdentityError {
    try {
      buildCreateCourseOnChainParams(input, guard(rpcUrl));
    } catch (e) {
      expect(e).toBeInstanceOf(MainnetCourseIdentityError);
      return e as MainnetCourseIdentityError;
    }
    throw new Error("expected the guard to refuse");
  }

  it("refuses trackId 0 on mainnet, with the error id", () => {
    const err = refusal(course({ trackId: 0 }));
    expect(err.problems).toEqual(["trackId"]);
    expect(err.errorId).toBe(ERROR_IDS.MAINNET_COURSE_IDENTITY_REFUSED);
    expect(err.courseId).toBe("course-speedrun");
  });

  it("refuses trackLevel 0 on mainnet", () => {
    expect(refusal(course({ trackLevel: 0 })).problems).toEqual(["trackLevel"]);
  });

  it("refuses creator == platform authority on mainnet", () => {
    expect(refusal(course({ creator: AUTHORITY })).problems).toEqual([
      "creator",
    ]);
  });

  it("refuses creator == backend signer on mainnet", () => {
    expect(refusal(course({ creator: BACKEND_SIGNER })).problems).toEqual([
      "creator",
    ]);
  });

  it("reports every problem at once", () => {
    expect(
      refusal(course({ trackId: 0, trackLevel: 0, creator: AUTHORITY }))
        .problems
    ).toEqual(["trackId", "trackLevel", "creator"]);
  });

  // The Borsh encoder writes NaN/undefined as 0 and truncates floats, so these
  // would land on-chain as unset (or wrong) values.
  it.each([Number.NaN, 1.5, -1, 65_536])(
    "refuses an unencodable trackId %s on mainnet",
    (trackId) => {
      expect(refusal(course({ trackId })).problems).toEqual(["trackId"]);
    }
  );

  it.each([Number.NaN, 2.5, 256])(
    "refuses an unencodable trackLevel %s on mainnet",
    (trackLevel) => {
      expect(refusal(course({ trackLevel })).problems).toEqual(["trackLevel"]);
    }
  );

  it("detects mainnet from the network label even with an anonymous RPC host", () => {
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "mainnet");
    expect(
      refusal(course({ trackId: 0 }), "https://rpc.example.com").problems
    ).toEqual(["trackId"]);
  });

  it("detects mainnet from the RPC host even when the label says devnet", () => {
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet");
    expect(refusal(course({ trackId: 0 }), MAINNET_RPC).problems).toEqual([
      "trackId",
    ]);
  });

  it("allows a mainnet course with a real track, level and instructor", () => {
    const params = buildCreateCourseOnChainParams(
      course({ trackId: 3, trackLevel: 4 }),
      guard(MAINNET_RPC)
    );
    expect(params.trackId).toBe(3);
    expect(params.trackLevel).toBe(4);
    expect(params.creator.equals(INSTRUCTOR)).toBe(true);
  });

  it("allows the u16/u8 maximums on mainnet", () => {
    expect(() =>
      buildCreateCourseOnChainParams(
        course({ trackId: 65_535, trackLevel: 255 }),
        guard(MAINNET_RPC)
      )
    ).not.toThrow();
  });

  it("leaves devnet unchanged: 0/0 and creator == authority still build", () => {
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "devnet");
    const params = buildCreateCourseOnChainParams(
      course({ trackId: 0, trackLevel: 0, creator: AUTHORITY }),
      guard(DEVNET_RPC)
    );
    expect(params.trackId).toBe(0);
    expect(params.trackLevel).toBe(0);
    expect(params.creator.equals(AUTHORITY)).toBe(true);
  });

  it("leaves localnet unchanged: 0/0 still builds", () => {
    vi.stubEnv("NEXT_PUBLIC_SOLANA_NETWORK", "localnet");
    expect(() =>
      buildCreateCourseOnChainParams(
        course({ trackId: 0, trackLevel: 0 }),
        guard("http://127.0.0.1:8899")
      )
    ).not.toThrow();
  });
});

describe("buildUpdateCourseOnChainParams (v-next update_course)", () => {
  it("replaces newLessonCount + newMinCompletionsForReward with newActiveLessons", () => {
    const mask: ActiveLessonsMask = [0xfffn, 0n, 0n, 0n];
    const params = buildUpdateCourseOnChainParams({ newActiveLessons: mask });

    expect(Object.keys(params).sort()).toEqual(
      [
        "newActiveLessons",
        "newCollection",
        "newContentTxId",
        "newCreatorRewardXp",
        "newIsActive",
        "newXpPerLesson",
      ].sort()
    );
    expect(params).not.toHaveProperty("newLessonCount");
    expect(params).not.toHaveProperty("newMinCompletionsForReward");
    expect(params.newActiveLessons).not.toBeNull();
    expect(params.newActiveLessons).toHaveLength(4);
  });

  it("maps absent optionals to null (Anchor Option::None → field unchanged)", () => {
    const params = buildUpdateCourseOnChainParams({});
    expect(params.newContentTxId).toBeNull();
    expect(params.newIsActive).toBeNull();
    expect(params.newXpPerLesson).toBeNull();
    expect(params.newCreatorRewardXp).toBeNull();
    expect(params.newCollection).toBeNull();
    expect(params.newActiveLessons).toBeNull();
  });

  it("threads a mask with bits above 2^32 through without truncation", () => {
    const highWord = (1n << 50n) + 7n; // 2^50 range — impossible in 32 bits
    const params = buildUpdateCourseOnChainParams({
      newActiveLessons: [highWord, 0n, 0n, 0n],
    });
    expect(params.newActiveLessons).not.toBeNull();
    expect(params.newActiveLessons![0]!.toString()).toBe(highWord.toString());
  });
});

describe("encodeActiveLessonsMask (BigInt → BN, no truncation)", () => {
  it("encodes a full [u64; 4] mask with high bits exactly", () => {
    const highBit = 1n << 40n; // 2^40 — above the int32 truncation boundary
    const nearMax = (1n << 63n) | 0x1234_5678_9abcn;
    const u64Max = (1n << 64n) - 1n; // 18446744073709551615
    const mask: ActiveLessonsMask = [highBit, nearMax, 0n, u64Max];

    const encoded = encodeActiveLessonsMask(mask);

    expect(encoded).toHaveLength(4);
    expect(encoded[0]!.toString()).toBe(highBit.toString());
    expect(encoded[1]!.toString()).toBe(nearMax.toString());
    expect(encoded[2]!.toString()).toBe("0");
    expect(encoded[3]!.toString()).toBe(u64Max.toString());

    // A `Number(word) & 0xffffffff` truncation bug would collapse these to their
    // low 32 bits; prove the value survives in full.
    expect(encoded[0]!.eq(new BN(highBit.toString()))).toBe(true);
    expect(encoded[0]!.gt(new BN("4294967295"))).toBe(true); // > 2^32 - 1
    expect(encoded[3]!.eq(new BN(u64Max.toString()))).toBe(true);
  });
});

describe("isValidLessonCount (#332 guard)", () => {
  it("rejects 0, 256, and non-integers", () => {
    expect(isValidLessonCount(0)).toBe(false);
    expect(isValidLessonCount(256)).toBe(false);
    expect(isValidLessonCount(1.5)).toBe(false);
    expect(isValidLessonCount(-1)).toBe(false);
    expect(isValidLessonCount(Number.NaN)).toBe(false);
    expect(isValidLessonCount("5")).toBe(false);
    expect(isValidLessonCount(null)).toBe(false);
    expect(isValidLessonCount(undefined)).toBe(false);
  });

  it("allows the u8 boundaries 1 and 255 (and values between)", () => {
    expect(isValidLessonCount(1)).toBe(true);
    expect(isValidLessonCount(12)).toBe(true);
    expect(isValidLessonCount(255)).toBe(true);
  });
});
