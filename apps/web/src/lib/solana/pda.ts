import { PublicKey } from "@solana/web3.js";

let _programId: PublicKey | undefined;

export function getProgramId(): PublicKey {
  if (!_programId) {
    const id = process.env.NEXT_PUBLIC_PROGRAM_ID;
    if (!id) {
      throw new Error("NEXT_PUBLIC_PROGRAM_ID env var is required");
    }
    _programId = new PublicKey(id);
  }
  return _programId;
}

const MAX_COURSE_ID_BYTES = 32;
const MAX_ACHIEVEMENT_ID_BYTES = 32;

function assertIdLength(id: string, max: number, label: string): void {
  const len = Buffer.byteLength(id, "utf8");
  if (len === 0 || len > max) {
    throw new Error(`${label} must be 1-${max} bytes (got ${len})`);
  }
}

export function findConfigPDA(
  programId: PublicKey = getProgramId()
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
}

export function findCoursePDA(
  courseId: string,
  programId: PublicKey = getProgramId()
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
  programId: PublicKey = getProgramId()
): [PublicKey, number] {
  assertIdLength(courseId, MAX_COURSE_ID_BYTES, "courseId");
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), user.toBuffer()],
    programId
  );
}

export function findMinterRolePDA(
  minter: PublicKey,
  programId: PublicKey = getProgramId()
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    programId
  );
}

export function findAchievementTypePDA(
  achievementId: string,
  programId: PublicKey = getProgramId()
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
  programId: PublicKey = getProgramId()
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
