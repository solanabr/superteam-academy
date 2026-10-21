import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import BN from "bn.js";
import V1_IDL from "../idl/superteam_academy.json";
import VNEXT_IDL from "../idl/superteam_academy_vnext.json";
import { COURSE_SIZE_VNEXT } from "../academy-reads";
import {
  courseGeneration,
  enrollmentCourseGeneration,
} from "../course-generation";

// The offsets come from the Pinocchio program's own layout
// (state/course.rs, state/enrollment.rs), not from the IDL, so this pins the
// IDL's `_reserved` words to the program's `generation` / `course_gen`.

const COURSE_ID = "solana-201";
const GENERATION = 0x00abcdef;

async function vnextCourse(): Promise<Buffer> {
  const coder = new BorshCoder(VNEXT_IDL as unknown as Idl);
  const raw = await coder.accounts.encode("Course", {
    course_id: COURSE_ID,
    creator: PublicKey.unique(),
    content_tx_id: Array(32).fill(1),
    version: 1,
    active_lessons: [new BN(3), new BN(0), new BN(0), new BN(0)],
    difficulty: 1,
    xp_per_lesson: 30,
    track_id: 1,
    track_level: 1,
    prerequisite: null,
    creator_reward_xp: 30,
    total_completions: 0,
    total_enrollments: 0,
    is_active: true,
    created_at: new BN(1),
    updated_at: new BN(2),
    collection: PublicKey.unique(),
    _reserved: Array(8).fill(0),
    bump: 254,
  });
  const out = Buffer.alloc(COURSE_SIZE_VNEXT);
  raw.copy(out);
  return out;
}

describe("courseGeneration", () => {
  it("reads the program's Course.generation word", async () => {
    const data = await vnextCourse();
    // 12 + id + 106 (creator..track_level) + 1 (no prerequisite)
    // + 4+4+4+1+8+8 (creator_reward_xp..updated_at) + 32 (collection).
    const oGeneration = 12 + COURSE_ID.length + 106 + 1 + 29 + 32;
    data.writeUInt32LE(GENERATION, oGeneration);

    expect(courseGeneration(data)).toBe(GENERATION);
  });

  it("reads 0 for a course from before generations existed", async () => {
    expect(courseGeneration(await vnextCourse())).toBe(0);
  });
});

describe("enrollmentCourseGeneration", () => {
  it("reads the program's Enrollment.course_gen word", async () => {
    const coder = new BorshCoder(V1_IDL as unknown as Idl);
    const data = await coder.accounts.encode("Enrollment", {
      course: PublicKey.unique(),
      enrolled_at: new BN(1),
      completed_at: null,
      lesson_flags: [new BN(0), new BN(0), new BN(0), new BN(0)],
      credential_asset: null,
      _reserved: Array(4).fill(0),
      bump: 255,
    });
    // Both options None: course_gen sits at byte 82 (enrollment.rs `init`).
    data.writeUInt32LE(GENERATION, 82);

    expect(enrollmentCourseGeneration(data)).toBe(GENERATION);
  });
});
