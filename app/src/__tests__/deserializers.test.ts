import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  deserializeConfig,
  deserializeCourse,
  deserializeEnrollment,
} from "@/lib/onchain/deserializers";

// ── Helpers ──────────────────────────────────────────────────────────────────

function writeU8(buf: Buffer, offset: number, value: number): void {
  buf.writeUInt8(value, offset);
}

function writeU16LE(buf: Buffer, offset: number, value: number): void {
  buf.writeUInt16LE(value, offset);
}

function writeU32LE(buf: Buffer, offset: number, value: number): void {
  buf.writeUInt32LE(value, offset);
}

function writePubkey(buf: Buffer, offset: number, pubkey: PublicKey): void {
  pubkey.toBuffer().copy(buf, offset);
}

function writeString(buf: Buffer, offset: number, value: string): number {
  writeU32LE(buf, offset, value.length);
  buf.write(value, offset + 4, "utf8");
  return 4 + value.length;
}

function writeI64LE(buf: Buffer, offset: number, value: number): void {
  const lo = value >>> 0;
  const hi = Math.floor(value / 0x100000000);
  buf.writeUInt32LE(lo, offset);
  buf.writeInt32LE(hi, offset + 4);
}

function writeU64LE(buf: Buffer, offset: number, bn: BN): void {
  const bytes = bn.toArray("le", 8);
  for (let i = 0; i < 8; i++) {
    buf[offset + i] = bytes[i];
  }
}

const DISCRIMINATOR_SIZE = 8;

// ── Test keys ────────────────────────────────────────────────────────────────

const KEY_A = PublicKey.unique();
const KEY_B = PublicKey.unique();
const KEY_C = PublicKey.unique();

// ── Tests ────────────────────────────────────────────────────────────────────

describe("deserializers", () => {
  describe("deserializeConfig", () => {
    it("deserializes authority, backendSigner, and xpMint", () => {
      const size = DISCRIMINATOR_SIZE + 32 + 32 + 32;
      const buf = Buffer.alloc(size);

      // 8-byte discriminator (skipped)
      let offset = DISCRIMINATOR_SIZE;
      writePubkey(buf, offset, KEY_A);
      offset += 32; // authority
      writePubkey(buf, offset, KEY_B);
      offset += 32; // backendSigner
      writePubkey(buf, offset, KEY_C); // xpMint

      const config = deserializeConfig(buf);
      expect(config.authority.equals(KEY_A)).toBe(true);
      expect(config.backendSigner.equals(KEY_B)).toBe(true);
      expect(config.xpMint.equals(KEY_C)).toBe(true);
    });
  });

  describe("deserializeCourse", () => {
    function buildCourseBuf(opts: {
      courseId: string;
      lessonCount: number;
      xpPerLesson: number;
      trackId: number;
      trackLevel: number;
      hasPrereq: boolean;
      isActive: boolean;
    }): Buffer {
      // Compute size: 8 disc + courseId(4+len) + 32*3 + 2 + 1 + 1 + 4 + 2 + 1 + 1 + (0|32) + 4 + 2 + 4 + 4 + 1
      const courseIdLen = opts.courseId.length;
      const prereqSize = opts.hasPrereq ? 32 : 0;
      const size =
        DISCRIMINATOR_SIZE +
        4 +
        courseIdLen + // courseId string
        32 +
        32 +
        32 + // creator, authority, contentTxId
        2 + // version
        1 + // lessonCount
        1 + // difficulty
        4 + // xpPerLesson
        2 + // trackId
        1 + // trackLevel
        1 +
        prereqSize + // hasPrereq + optional pubkey
        4 + // creatorRewardXp
        2 + // minCompletionsForReward
        4 + // totalCompletions
        4 + // totalEnrollments
        1; // isActive

      const buf = Buffer.alloc(size);
      let offset = DISCRIMINATOR_SIZE;

      offset += writeString(buf, offset, opts.courseId);
      writePubkey(buf, offset, KEY_A);
      offset += 32; // creator
      writePubkey(buf, offset, KEY_B);
      offset += 32; // authority
      writePubkey(buf, offset, KEY_C);
      offset += 32; // contentTxId
      writeU16LE(buf, offset, 1);
      offset += 2; // version
      writeU8(buf, offset, opts.lessonCount);
      offset += 1;
      writeU8(buf, offset, 1);
      offset += 1; // difficulty
      writeU32LE(buf, offset, opts.xpPerLesson);
      offset += 4;
      writeU16LE(buf, offset, opts.trackId);
      offset += 2;
      writeU8(buf, offset, opts.trackLevel);
      offset += 1;
      writeU8(buf, offset, opts.hasPrereq ? 1 : 0);
      offset += 1;
      if (opts.hasPrereq) {
        writePubkey(buf, offset, KEY_A);
        offset += 32;
      }
      writeU32LE(buf, offset, 0);
      offset += 4; // creatorRewardXp
      writeU16LE(buf, offset, 0);
      offset += 2; // minCompletionsForReward
      writeU32LE(buf, offset, 100);
      offset += 4; // totalCompletions
      writeU32LE(buf, offset, 500);
      offset += 4; // totalEnrollments
      writeU8(buf, offset, opts.isActive ? 1 : 0);

      return buf;
    }

    it("deserializes course fields correctly", () => {
      const buf = buildCourseBuf({
        courseId: "intro-to-solana",
        lessonCount: 12,
        xpPerLesson: 25,
        trackId: 3,
        trackLevel: 2,
        hasPrereq: false,
        isActive: true,
      });

      const course = deserializeCourse(buf);
      expect(course.courseId).toBe("intro-to-solana");
      expect(course.lessonCount).toBe(12);
      expect(course.xpPerLesson).toBe(25);
      expect(course.trackId).toBe(3);
      expect(course.trackLevel).toBe(2);
      expect(course.isActive).toBe(true);
    });

    it("handles course with prerequisite", () => {
      const buf = buildCourseBuf({
        courseId: "advanced-defi",
        lessonCount: 20,
        xpPerLesson: 50,
        trackId: 1,
        trackLevel: 3,
        hasPrereq: true,
        isActive: true,
      });

      const course = deserializeCourse(buf);
      expect(course.courseId).toBe("advanced-defi");
      expect(course.lessonCount).toBe(20);
    });

    it("deserializes inactive course", () => {
      const buf = buildCourseBuf({
        courseId: "deprecated-course",
        lessonCount: 5,
        xpPerLesson: 10,
        trackId: 0,
        trackLevel: 1,
        hasPrereq: false,
        isActive: false,
      });

      const course = deserializeCourse(buf);
      expect(course.isActive).toBe(false);
    });
  });

  describe("deserializeEnrollment", () => {
    function buildEnrollmentBuf(opts: {
      course: PublicKey;
      enrolledAt: number;
      completedAt: number | null;
      lessonFlags: BN[];
      credentialAsset?: PublicKey | null;
    }): Buffer {
      const completedSize = opts.completedAt !== null ? 8 : 0;
      const credentialAsset = opts.credentialAsset ?? null;
      const credentialSize = credentialAsset !== null ? 32 : 0;
      const size =
        DISCRIMINATOR_SIZE +
        32 + // course pubkey
        2 + // enrolledVersion
        8 + // enrolledAt (i64)
        1 + // hasCompleted flag
        completedSize + // completedAt (optional i64)
        32 + // lessonFlags [u64; 4]
        1 + // hasCredential flag
        credentialSize; // credentialAsset (optional pubkey)

      const buf = Buffer.alloc(size);
      let offset = DISCRIMINATOR_SIZE;

      writePubkey(buf, offset, opts.course);
      offset += 32;
      writeU16LE(buf, offset, 1);
      offset += 2; // enrolledVersion
      writeI64LE(buf, offset, opts.enrolledAt);
      offset += 8;

      if (opts.completedAt !== null) {
        writeU8(buf, offset, 1);
        offset += 1;
        writeI64LE(buf, offset, opts.completedAt);
        offset += 8;
      } else {
        writeU8(buf, offset, 0);
        offset += 1;
      }

      for (let i = 0; i < 4; i++) {
        const bn = opts.lessonFlags[i] || new BN(0);
        writeU64LE(buf, offset, bn);
        offset += 8;
      }

      if (credentialAsset !== null) {
        writeU8(buf, offset, 1);
        offset += 1;
        writePubkey(buf, offset, credentialAsset);
      } else {
        writeU8(buf, offset, 0);
      }

      return buf;
    }

    it("deserializes active enrollment (not completed)", () => {
      const enrolledAt = Math.floor(Date.now() / 1000);
      const buf = buildEnrollmentBuf({
        course: KEY_A,
        enrolledAt,
        completedAt: null,
        lessonFlags: [new BN(0), new BN(0), new BN(0), new BN(0)],
      });

      const enrollment = deserializeEnrollment(buf);
      expect(enrollment.course.equals(KEY_A)).toBe(true);
      expect(enrollment.enrolledAt).toBe(enrolledAt);
      expect(enrollment.completedAt).toBeNull();
    });

    it("deserializes completed enrollment", () => {
      const enrolledAt = 1700000000;
      const completedAt = 1700100000;
      const buf = buildEnrollmentBuf({
        course: KEY_B,
        enrolledAt,
        completedAt,
        lessonFlags: [new BN(0xff), new BN(0), new BN(0), new BN(0)],
      });

      const enrollment = deserializeEnrollment(buf);
      expect(enrollment.enrolledAt).toBe(enrolledAt);
      expect(enrollment.completedAt).toBe(completedAt);
    });

    it("deserializes lesson completion flags", () => {
      const flags = [
        new BN(7), // lessons 0, 1, 2 complete (0b111)
        new BN(0),
        new BN(0),
        new BN(0),
      ];
      const buf = buildEnrollmentBuf({
        course: KEY_A,
        enrolledAt: 1700000000,
        completedAt: null,
        lessonFlags: flags,
      });

      const enrollment = deserializeEnrollment(buf);
      expect(enrollment.lessonFlags).toHaveLength(4);
      // First flag should equal 7 (bits 0,1,2 set)
      expect(enrollment.lessonFlags[0].toNumber()).toBe(7);
      expect(enrollment.lessonFlags[1].toNumber()).toBe(0);
    });

    it("deserializes credentialAsset when present", () => {
      const buf = buildEnrollmentBuf({
        course: KEY_A,
        enrolledAt: 1700000000,
        completedAt: 1700100000,
        lessonFlags: [new BN(0), new BN(0), new BN(0), new BN(0)],
        credentialAsset: KEY_C,
      });

      const enrollment = deserializeEnrollment(buf);
      expect(enrollment.credentialAsset).not.toBeNull();
      expect(enrollment.credentialAsset?.equals(KEY_C)).toBe(true);
    });

    it("deserializes null credentialAsset when absent", () => {
      const buf = buildEnrollmentBuf({
        course: KEY_A,
        enrolledAt: 1700000000,
        completedAt: null,
        lessonFlags: [new BN(0), new BN(0), new BN(0), new BN(0)],
        credentialAsset: null,
      });

      const enrollment = deserializeEnrollment(buf);
      expect(enrollment.credentialAsset).toBeNull();
    });
  });
});
