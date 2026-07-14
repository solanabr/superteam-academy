import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import BN from "bn.js";
import V1_IDL from "../idl/superteam_academy.json";
import VNEXT_IDL from "../idl/superteam_academy_vnext.json";
import {
  decodeCourse,
  COURSE_SIZE_V1,
  COURSE_SIZE_VNEXT,
} from "../academy-reads";

// Independent coders built straight from the committed IDL files — mirrors
// how academy-reads.ts builds coderV1/coderVNext internally, but kept
// separate here so the test constructs its own synthetic account bytes
// rather than reaching into the module's private coders.
const coderV1 = new BorshCoder(V1_IDL as unknown as Idl);
const coderVNext = new BorshCoder(VNEXT_IDL as unknown as Idl);

/**
 * `.accounts.encode()` returns discriminator + serialized fields only — it is
 * NOT padded to the account's allocated `space`. A real on-chain account's
 * `data` is always the full allocated size (zero-padded), so the length
 * dispatch in decodeCourse needs fixtures padded out to the real size.
 */
function padToSize(buf: Buffer, size: number): Buffer {
  if (buf.length > size) {
    throw new Error(
      `encoded buffer (${buf.length}b) exceeds target size ${size}b`
    );
  }
  const out = Buffer.alloc(size);
  buf.copy(out);
  return out;
}

const CREATOR = PublicKey.unique();
const COLLECTION = PublicKey.unique();
const CONTENT_TX_ID = Array(32).fill(7);
const RESERVED = Array(8).fill(0);

interface V1Fixture {
  course_id: string;
  creator: PublicKey;
  content_tx_id: number[];
  version: number;
  lesson_count: number;
  difficulty: number;
  xp_per_lesson: number;
  track_id: number;
  track_level: number;
  prerequisite: PublicKey | null;
  creator_reward_xp: number;
  min_completions_for_reward: number;
  total_completions: number;
  total_enrollments: number;
  is_active: boolean;
  created_at: BN;
  updated_at: BN;
  collection: PublicKey;
  _reserved: number[];
  bump: number;
}

function makeV1Fixture(overrides: Partial<V1Fixture> = {}): V1Fixture {
  return {
    course_id: "solana-101",
    creator: CREATOR,
    content_tx_id: CONTENT_TX_ID,
    version: 1,
    lesson_count: 12,
    difficulty: 1,
    xp_per_lesson: 25,
    track_id: 0,
    track_level: 1,
    prerequisite: null,
    creator_reward_xp: 100,
    min_completions_for_reward: 0,
    total_completions: 5,
    total_enrollments: 10,
    is_active: true,
    created_at: new BN(1_700_000_000),
    updated_at: new BN(1_700_000_100),
    collection: COLLECTION,
    _reserved: RESERVED,
    bump: 254,
    ...overrides,
  };
}

interface VNextFixture {
  course_id: string;
  creator: PublicKey;
  content_tx_id: number[];
  version: number;
  active_lessons: BN[];
  difficulty: number;
  xp_per_lesson: number;
  track_id: number;
  track_level: number;
  prerequisite: PublicKey | null;
  creator_reward_xp: number;
  total_completions: number;
  total_enrollments: number;
  is_active: boolean;
  created_at: BN;
  updated_at: BN;
  collection: PublicKey;
  _reserved: number[];
  bump: number;
}

function makeVNextFixture(overrides: Partial<VNextFixture> = {}): VNextFixture {
  return {
    course_id: "solana-201",
    creator: CREATOR,
    content_tx_id: CONTENT_TX_ID,
    version: 1,
    active_lessons: [new BN(0), new BN(0), new BN(0), new BN(0)],
    difficulty: 2,
    xp_per_lesson: 30,
    track_id: 1,
    track_level: 2,
    prerequisite: null,
    creator_reward_xp: 150,
    total_completions: 3,
    total_enrollments: 7,
    is_active: true,
    created_at: new BN(1_700_000_200),
    updated_at: new BN(1_700_000_300),
    collection: COLLECTION,
    _reserved: RESERVED,
    bump: 253,
    ...overrides,
  };
}

async function encodeV1(fixture: V1Fixture): Promise<Buffer> {
  const raw = await coderV1.accounts.encode("Course", fixture);
  return padToSize(raw, COURSE_SIZE_V1);
}

async function encodeVNext(fixture: VNextFixture): Promise<Buffer> {
  const raw = await coderVNext.accounts.encode("Course", fixture);
  return padToSize(raw, COURSE_SIZE_VNEXT);
}

describe("decodeCourse — v1 (224 bytes)", () => {
  it("dense mask: liveLessonCount matches lesson_count, popcount === 12, bits 0..11 set", async () => {
    const data = await encodeV1(makeV1Fixture({ lesson_count: 12 }));
    const course = decodeCourse(data);

    expect(course.liveLessonCount).toBe(12);
    expect(course.activeLessons).toHaveLength(4);
    expect(course.activeLessons[0]).toBe(0xfffn);
    expect(course.activeLessons[1]).toBe(0n);
    expect(course.activeLessons[2]).toBe(0n);
    expect(course.activeLessons[3]).toBe(0n);

    const popcount = course.activeLessons.reduce(
      (sum, word) => sum + word.toString(2).split("1").length - 1,
      0
    );
    expect(popcount).toBe(12);
  });

  it("behaviour-neutrality: liveLessonCount equals the encoded lesson_count", async () => {
    for (const lessonCount of [0, 1, 5, 64, 65, 200]) {
      const data = await encodeV1(makeV1Fixture({ lesson_count: lessonCount }));
      const course = decodeCourse(data);
      expect(course.liveLessonCount).toBe(lessonCount);
    }
  });

  it("does not expose lesson_count or min_completions_for_reward", async () => {
    const data = await encodeV1(makeV1Fixture());
    const course = decodeCourse(data);
    expect("lesson_count" in course).toBe(false);
    expect("min_completions_for_reward" in course).toBe(false);
    expect("active_lessons" in course).toBe(false);
  });
});

describe("decodeCourse — v-next (253 bytes)", () => {
  it("sparse mask: preserves the exact mask and popcount, including a retired slot (bit 3 gap)", async () => {
    // Bits {0,1,2,4} set, bit 3 deliberately absent (a retired slot) — proves
    // the mask is carried through as-is rather than re-derived from a count.
    const sparseMask = (1n << 0n) | (1n << 1n) | (1n << 2n) | (1n << 4n);
    const data = await encodeVNext(
      makeVNextFixture({
        active_lessons: [
          new BN(sparseMask.toString()),
          new BN(0),
          new BN(0),
          new BN(0),
        ],
      })
    );
    const course = decodeCourse(data);

    expect(course.activeLessons).toEqual([sparseMask, 0n, 0n, 0n]);
    expect(course.liveLessonCount).toBe(4);
  });

  it("does not expose active_lessons", async () => {
    const data = await encodeVNext(makeVNextFixture());
    const course = decodeCourse(data);
    expect("active_lessons" in course).toBe(false);
    expect("lesson_count" in course).toBe(false);
  });
});

describe("decodeCourse — unknown length", () => {
  it("throws on a 255-byte buffer (never-deployed v2), naming the length", async () => {
    const data = Buffer.alloc(255);
    expect(() => decodeCourse(data)).toThrow(/255/);
  });

  it("throws on an arbitrary short buffer, naming the length", () => {
    const data = Buffer.alloc(100);
    expect(() => decodeCourse(data)).toThrow(/100/);
  });
});

describe("decodeCourse — shared fields round-trip identically through both branches", () => {
  it("xp_per_lesson and creator survive the v1 branch", async () => {
    const data = await encodeV1(
      makeV1Fixture({ xp_per_lesson: 42, creator: CREATOR })
    );
    const course = decodeCourse(data);
    expect(course.xp_per_lesson).toBe(42);
    expect(course.creator.equals(CREATOR)).toBe(true);
  });

  it("xp_per_lesson and creator survive the v-next branch", async () => {
    const data = await encodeVNext(
      makeVNextFixture({ xp_per_lesson: 42, creator: CREATOR })
    );
    const course = decodeCourse(data);
    expect(course.xp_per_lesson).toBe(42);
    expect(course.creator.equals(CREATOR)).toBe(true);
  });
});
