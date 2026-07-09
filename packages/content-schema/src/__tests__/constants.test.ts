import { describe, it, expect } from "vitest";
import {
  MAX_XP_PER_MINT,
  MAX_COURSE_ID_BYTES,
  MAX_LESSON_SLOTS,
  QUEST_TYPES,
} from "../constants";

describe("constants", () => {
  it("mirrors the on-chain XP mint ceiling", () => {
    // onchain-academy/programs/onchain-academy/src/utils.rs:15
    expect(MAX_XP_PER_MINT).toBe(5000);
  });

  it("mirrors the PDA seed limit", () => {
    // state/course.rs: MAX_COURSE_ID_LEN
    expect(MAX_COURSE_ID_BYTES).toBe(32);
  });

  it("mirrors the enrollment bitmap width", () => {
    // state/enrollment.rs: lesson_flags: [u64; 4]
    expect(MAX_LESSON_SLOTS).toBe(256);
  });

  it("matches the SQL quest-type enum exactly", () => {
    // supabase/schema.sql: get_daily_quest_state IF/ELSIF chain
    expect([...QUEST_TYPES]).toEqual([
      "lesson",
      "lesson_batch",
      "challenge",
      "login_streak",
      "module",
    ]);
  });
});
