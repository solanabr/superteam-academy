import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './constants';

/**
 * Derives the singleton Config PDA.
 * Seeds: ["config"]
 */
export function configPda(programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], programId);
}

/**
 * Derives a Course PDA for a given course ID.
 * Seeds: ["course", course_id.as_bytes()]
 */
export function coursePda(
  courseId: string,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    programId,
  );
}

/**
 * Derives an Enrollment PDA for a learner in a specific course.
 * Seeds: ["enrollment", course_id.as_bytes(), learner.key()]
 */
export function enrollmentPda(
  courseId: string,
  learner: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBuffer()],
    programId,
  );
}

/**
 * Derives a MinterRole PDA for a given minter pubkey.
 * Seeds: ["minter", minter.key()]
 */
export function minterRolePda(
  minter: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('minter'), minter.toBuffer()],
    programId,
  );
}

/**
 * Derives an AchievementType PDA for a given achievement ID.
 * Seeds: ["achievement", achievement_id.as_bytes()]
 */
export function achievementTypePda(
  achievementId: string,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('achievement'), Buffer.from(achievementId)],
    programId,
  );
}

/**
 * Derives an AchievementReceipt PDA for a recipient of a specific achievement.
 * Seeds: ["achievement_receipt", achievement_id.as_bytes(), recipient.key()]
 */
export function achievementReceiptPda(
  achievementId: string,
  recipient: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('achievement_receipt'), Buffer.from(achievementId), recipient.toBuffer()],
    programId,
  );
}

/**
 * Derives the track collection PDA for credential NFTs.
 * Seeds: ["track_collection", trackId as u8]
 */
export function trackCollectionPda(
  trackId: number,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('track_collection'), Buffer.from([trackId])],
    programId,
  );
}

/**
 * Extracts the trackId from raw Course account data.
 *
 * Course layout after 8-byte discriminator:
 *   [8..12]  courseId string length (u32 LE)
 *   [12..12+len] courseId bytes
 *   [12+len..12+len+32] creator (Pubkey)
 *   [12+len+32..12+len+64] contentTxId ([u8; 32])
 *   [12+len+64..12+len+66] lessonCount (u16 LE)
 *   [12+len+66..12+len+67] difficulty (u8)
 *   [12+len+67..12+len+71] xpPerLesson (u32 LE)
 *   [12+len+71..12+len+72] trackId (u8)
 */
export function extractTrackIdFromCourseData(
  data: Buffer,
  courseId: string,
): number {
  const DISCRIMINATOR_SIZE = 8;
  const STRING_LEN_SIZE = 4;
  const courseIdLen = Buffer.from(courseId).length;
  const baseOffset = DISCRIMINATOR_SIZE + STRING_LEN_SIZE + courseIdLen;
  // creator(32) + contentTxId(32) + lessonCount(2) + difficulty(1) + xpPerLesson(4) = 71
  const trackIdOffset = baseOffset + 32 + 32 + 2 + 1 + 4;
  return data.readUInt8(trackIdOffset);
}
