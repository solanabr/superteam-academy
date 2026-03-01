import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@/config/constants';
import BN from 'bn.js';

// --- PDA Derivation ---

export function getConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  );
  return pda;
}

export function getCoursePda(courseId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    PROGRAM_ID
  );
  return pda;
}

export function getEnrollmentPda(courseId: string, learner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getMinterRolePda(minter: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('minter'), minter.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getAchievementTypePda(achievementId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('achievement'), Buffer.from(achievementId)],
    PROGRAM_ID
  );
  return pda;
}

export function getAchievementReceiptPda(achievementId: string, recipient: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('achievement_receipt'), Buffer.from(achievementId), recipient.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getXpAta(wallet: PublicKey, xpMint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(xpMint, wallet, false, TOKEN_2022_PROGRAM_ID);
}

// --- Bitmap Helpers ---

export function isLessonComplete(lessonFlags: BN[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  if (wordIndex >= lessonFlags.length) return false;
  return !lessonFlags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
}

export function countCompletedLessons(lessonFlags: BN[]): number {
  return lessonFlags.reduce((sum, word) => {
    let count = 0;
    let w = word.clone();
    while (!w.isZero()) {
      count += w.and(new BN(1)).toNumber();
      w = w.shrn(1);
    }
    return sum + count;
  }, 0);
}

export function getCompletedLessonIndices(lessonFlags: BN[], lessonCount: number): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) completed.push(i);
  }
  return completed;
}

// --- XP / Level ---

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function xpProgress(xp: number): { level: number; currentXp: number; nextLevelXp: number; progress: number } {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress = nextLevelXp > currentLevelXp
    ? ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 0;
  return { level, currentXp: xp - currentLevelXp, nextLevelXp: nextLevelXp - currentLevelXp, progress };
}

// --- Formatting ---

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatXp(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`;
  return xp.toString();
}

export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString();
}
