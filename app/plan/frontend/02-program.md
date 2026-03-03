# Program Service

## Overview

The Program Service provides Anchor program interaction utilities.

## Configuration

```typescript
// lib/constants.ts
import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || 'ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf'
);

export const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT || 'xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3'
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  'CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d'
);
```

## PDA Derivation Utilities

```typescript
// lib/pda.ts
import { PublicKey, PublicKeyInitData } from '@solana/web3.js';

export function deriveConfigPda(programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    programId
  );
  return pda;
}

export function deriveCoursePda(
  courseId: string,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    programId
  );
  return pda;
}

export function deriveEnrollmentPda(
  courseId: string,
  learner: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBuffer()],
    programId
  );
  return pda;
}

export function deriveMinterRolePda(
  minter: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('minter'), minter.toBuffer()],
    programId
  );
  return pda;
}

export function deriveAchievementTypePda(
  achievementId: string,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('achievement'), Buffer.from(achievementId)],
    programId
  );
  return pda;
}

export function deriveAchievementReceiptPda(
  achievementId: string,
  recipient: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('achievement_receipt'), Buffer.from(achievementId), recipient.toBuffer()],
    programId
  );
  return pda;
}
```

## Program Hook

```typescript
// hooks/useProgram.ts
import { useMemo } from 'react';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { IDL, SuperteamAcademy } from '@/target/types/superteam_academy';
import { PROGRAM_ID } from '@/lib/constants';

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const provider = useMemo(() => {
    return new AnchorProvider(connection, wallet as any, {
      commitment: 'confirmed',
    });
  }, [connection, wallet]);
  
  const program = useMemo(() => {
    return new Program<SuperteamAcademy>(IDL, PROGRAM_ID, provider);
  }, [provider]);
  
  return { program, provider };
}
```

## Account Fetching

```typescript
// lib/account.ts
import { Program, Account } from '@coral-xyz/anchor';

export async function fetchConfig(
  program: Program<SuperteamAcademy>,
  configPda: PublicKey
) {
  return program.account.config.fetch(configPda);
}

export async function fetchCourse(
  program: Program<SuperteamAcademy>,
  coursePda: PublicKey
) {
  return program.account.course.fetch(coursePda);
}

export async function fetchEnrollment(
  program: Program<SuperteamAcademy>,
  enrollmentPda: PublicKey
) {
  return program.account.enrollment.fetchNullable(enrollmentPda);
}

export async function fetchMinterRole(
  program: Program<SuperteamAcademy>,
  minterRolePda: PublicKey
) {
  return program.account.minterRole.fetch(minterRolePda);
}

export async function fetchAchievementType(
  program: Program<SuperteamAcademy>,
  achievementTypePda: PublicKey
) {
  return program.account.achievementType.fetch(achievementTypePda);
}

export async function fetchAchievementReceipt(
  program: Program<SuperteamAcademy>,
  receiptPda: PublicKey
) {
  return program.account.achievementReceipt.fetchNullable(receiptPda);
}

export async function fetchAllCourses(
  program: Program<SuperteamAcademy>
) {
  return program.account.course.all();
}

export async function fetchAllEnrollments(
  program: Program<SuperteamAcademy>
) {
  return program.account.enrollment.all();
}
```

## Transaction Building

```typescript
// lib/transactions.ts
import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

export async function buildEnrollTransaction(
  program: Program<SuperteamAcademy>,
  learner: PublicKey,
  courseId: string,
  coursePda: PublicKey,
  enrollmentPda: PublicKey,
  hasPrerequisite: boolean,
  prereqCoursePda?: PublicKey,
  prereqEnrollmentPda?: PublicKey
): Promise<Transaction> {
  const tx = await program.methods
    .enroll(courseId)
    .accountsPartial({
      course: coursePda,
      enrollment: enrollmentPda,
      learner,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
    
  if (hasPrerequisite && prereqCoursePda && prereqEnrollmentPda) {
    tx.addRemainingAccounts([
      { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
      { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
    ]);
  }
  
  return tx;
}

export async function buildCloseEnrollmentTransaction(
  program: Program<SuperteamAcademy>,
  coursePda: PublicKey,
  enrollmentPda: PublicKey,
  learner: PublicKey
): Promise<Transaction> {
  return program.methods
    .closeEnrollment()
    .accountsPartial({
      course: coursePda,
      enrollment: enrollmentPda,
      learner,
    })
    .transaction();
}
```

## Lesson Bitmap Utilities

```typescript
// lib/bitmap.ts
import { BN } from '@coral-xyz/anchor';

export function isLessonComplete(lessonFlags: BN[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  return !lessonFlags[wordIndex]?.and(new BN(1).shln(bitIndex)).isZero();
}

export function countCompletedLessons(lessonFlags: BN[], lessonCount: number): number {
  let count = 0;
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) count++;
  }
  return count;
}

export function getCompletedLessonIndices(lessonFlags: BN[], lessonCount: number): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) completed.push(i);
  }
  return completed;
}

export function getProgressPercentage(lessonFlags: BN[], lessonCount: number): number {
  if (lessonCount === 0) return 0;
  const completed = countCompletedLessons(lessonFlags, lessonCount);
  return Math.round((completed / lessonCount) * 100);
}
```
