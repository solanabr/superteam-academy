import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

export function getConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  return pda;
}

export function getCoursePda(courseId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID
  );
  return pda;
}

export function getEnrollmentPda(
  courseId: string,
  learner: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getMinterRolePda(minter: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getAchievementTypePda(achievementId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(achievementId)],
    PROGRAM_ID
  );
  return pda;
}

export function getAchievementReceiptPda(
  achievementId: string,
  recipient: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("achievement_receipt"),
      Buffer.from(achievementId),
      recipient.toBuffer(),
    ],
    PROGRAM_ID
  );
  return pda;
}

export function isLessonComplete(
  lessonFlags: { words: number[] } | number[],
  lessonIndex: number
): boolean {
  const words = Array.isArray(lessonFlags)
    ? lessonFlags
    : lessonFlags.words ?? [];
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  if (wordIndex >= words.length) return false;
  return (words[wordIndex] & (1 << bitIndex)) !== 0;
}

export function countCompletedLessons(
  lessonFlags: number[],
  lessonCount: number
): number {
  let count = 0;
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) count++;
  }
  return count;
}
