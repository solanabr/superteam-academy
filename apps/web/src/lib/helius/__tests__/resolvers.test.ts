/* eslint-disable import/order -- vi.mock calls must precede importing the module. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// resolveLessonId maps an on-chain LessonCompleted event index → lessonId. That
// index IS the permanent slot (#741), so resolution must go through the slot
// lock, not array position. resolveLessonId dynamically imports lesson-slot, so
// mocking that module intercepts the resolution.
const { slotToLiveLessonId } = vi.hoisted(() => ({
  slotToLiveLessonId: vi.fn<(courseId: string) => Map<number, string>>(),
}));
vi.mock("@/lib/courses/lesson-slot", () => ({ slotToLiveLessonId }));

const { decodeCourse } = vi.hoisted(() => ({
  decodeCourse: vi.fn<(data: Buffer) => { course_id: string }>(),
}));
vi.mock("@/lib/solana/academy-reads", () => ({ decodeCourse }));

import { Connection, PublicKey } from "@solana/web3.js";
import { getProgramId } from "@/lib/solana/pda";
import {
  clearCoursePdaCache,
  resolveCourseId,
  resolveLessonId,
} from "../resolvers";

// C3-shaped: a later-authored lesson keeps slot 5 while sitting at array pos 4
// (an earlier lesson was retired), and slot 14 is retired entirely.
const LIVE = new Map<number, string>([
  [0, "lesson-intro"],
  [5, "lesson-keeps-slot-5"], // array pos 4, slot 5 — the repro
  [15, "lesson-capstone"],
]);

beforeEach(() => {
  vi.clearAllMocks();
  slotToLiveLessonId.mockReturnValue(LIVE);
});

describe("resolveCourseId", () => {
  const COURSE_PDA = new PublicKey(Buffer.alloc(32, 7)).toBase58();
  const OTHER_OWNER = new PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
  );

  function connectionReturning(owner: PublicKey | null) {
    const getAccountInfo = vi.fn(async () =>
      owner ? { owner, data: Buffer.from([1, 2, 3]) } : null
    );
    return {
      connection: { getAccountInfo } as unknown as Connection,
      getAccountInfo,
    };
  }

  beforeEach(() => {
    clearCoursePdaCache();
    decodeCourse.mockReturnValue({ course_id: "course-solana-101" });
  });

  it("resolves an account owned by our program", async () => {
    const { connection } = connectionReturning(getProgramId());
    await expect(resolveCourseId(COURSE_PDA, connection)).resolves.toBe(
      "course-solana-101"
    );
  });

  it("returns null without decoding an account another program owns", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { connection } = connectionReturning(OTHER_OWNER);
    await expect(resolveCourseId(COURSE_PDA, connection)).resolves.toBeNull();
    expect(decodeCourse).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("does not cache a rejected account", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const rejected = connectionReturning(OTHER_OWNER);
    await resolveCourseId(COURSE_PDA, rejected.connection);
    await resolveCourseId(COURSE_PDA, rejected.connection);
    expect(rejected.getAccountInfo).toHaveBeenCalledTimes(2);

    const accepted = connectionReturning(getProgramId());
    await expect(
      resolveCourseId(COURSE_PDA, accepted.connection)
    ).resolves.toBe("course-solana-101");
    warn.mockRestore();
  });

  it("returns null when the account does not exist", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { connection } = connectionReturning(null);
    await expect(resolveCourseId(COURSE_PDA, connection)).resolves.toBeNull();
    warn.mockRestore();
  });
});

describe("resolveLessonId — event index is the slot, not array position (#741)", () => {
  it("resolves the slot to the correct lesson even when array order disagrees", async () => {
    // The event carries slot 5 → must resolve lesson-keeps-slot-5, NOT whatever
    // sits at array index 5 (which array-position resolution would have picked).
    expect(await resolveLessonId("course-c3", 5)).toBe("lesson-keeps-slot-5");
    expect(await resolveLessonId("course-c3", 15)).toBe("lesson-capstone");
  });

  it("returns null for a retired/unknown slot (caller skips gracefully, no throw)", async () => {
    // Slot 14 is retired — no live lesson. Must return null (the handler then
    // skips the upsert and falls the XP reason back to the raw index), never
    // throw the webhook into a retry loop.
    await expect(resolveLessonId("course-c3", 14)).resolves.toBeNull();
  });

  it("returns null (never throws) if slot resolution itself errors", async () => {
    slotToLiveLessonId.mockImplementation(() => {
      throw new Error("store unavailable");
    });
    await expect(resolveLessonId("course-c3", 5)).resolves.toBeNull();
  });
});
