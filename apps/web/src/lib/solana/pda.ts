import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
    "GmLKszNTdCgYYkrspmi9sRFWj3ZiCamkc4YrppKJRUhh"
);

const MAX_COURSE_ID_BYTES = 32;
const MAX_ACHIEVEMENT_ID_BYTES = 32;

function assertIdLength(id: string, max: number, label: string): void {
  const len = Buffer.byteLength(id, "utf8");
  if (len === 0 || len > max) {
    throw new Error(`${label} must be 1-${max} bytes (got ${len})`);
  }
}

export function findConfigPDA(
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
}

export function findCoursePDA(
  courseId: string,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  assertIdLength(courseId, MAX_COURSE_ID_BYTES, "courseId");
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    programId
  );
}

export function findEnrollmentPDA(
  courseId: string,
  user: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  assertIdLength(courseId, MAX_COURSE_ID_BYTES, "courseId");
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), user.toBuffer()],
    programId
  );
}

export function findMinterRolePDA(
  minter: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    programId
  );
}

export function findAchievementTypePDA(
  achievementId: string,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  assertIdLength(achievementId, MAX_ACHIEVEMENT_ID_BYTES, "achievementId");
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(achievementId)],
    programId
  );
}

export function findAchievementReceiptPDA(
  achievementId: string,
  recipient: PublicKey,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  assertIdLength(achievementId, MAX_ACHIEVEMENT_ID_BYTES, "achievementId");
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("achievement_receipt"),
      Buffer.from(achievementId),
      recipient.toBuffer(),
    ],
    programId
  );
}
