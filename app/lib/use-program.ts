'use client';

import { useMemo } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import IDL from './idl/onchain_academy.json';

export const PROGRAM_ID = new PublicKey(
  '3Yr5EZrq8t4fMunuHUZoN9Q6cn4Sf6p3AFAdvWEMaxKU'
);

const TOKEN_2022_PROGRAM_ID = new PublicKey(
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
);

export function getConfigPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  );
  return pda;
}

export function getCoursePDA(courseId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    PROGRAM_ID
  );
  return pda;
}

export function getEnrollmentPDA(
  courseId: string,
  learner: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBytes()],
    PROGRAM_ID
  );
  return pda;
}

export function getMinterRolePDA(minter: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('minter'), minter.toBytes()],
    PROGRAM_ID
  );
  return pda;
}

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    return new Program(IDL as never, provider);
  }, [connection, wallet]);
}

export interface EnrollResult {
  signature: string;
  enrollmentPDA: PublicKey;
}

export async function enrollInCourse(
  program: Program,
  courseId: string,
  learner: PublicKey
): Promise<EnrollResult> {
  const coursePDA = getCoursePDA(courseId);
  const enrollmentPDA = getEnrollmentPDA(courseId, learner);

  const signature = await (program.methods as never as {
    enroll: (courseId: string) => {
      accounts: (accounts: Record<string, PublicKey>) => {
        rpc: () => Promise<string>;
      };
    };
  })
    .enroll(courseId)
    .accounts({
      course: coursePDA,
      enrollment: enrollmentPDA,
      learner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { signature, enrollmentPDA };
}

export async function completeLessonOnChain(
  program: Program,
  courseId: string,
  lessonIndex: number,
  learner: PublicKey,
  configData: { xpMint: PublicKey; backendSigner: PublicKey }
): Promise<string> {
  const coursePDA = getCoursePDA(courseId);
  const enrollmentPDA = getEnrollmentPDA(courseId, learner);

  // Derive learner's Token-2022 ATA for XP mint
  const [learnerAta] = PublicKey.findProgramAddressSync(
    [
      learner.toBytes(),
      TOKEN_2022_PROGRAM_ID.toBytes(),
      configData.xpMint.toBytes(),
    ],
    new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // Associated Token Program
  );

  const signature = await (program.methods as never as {
    completeLesson: (lessonIndex: number) => {
      accounts: (accounts: Record<string, PublicKey>) => {
        rpc: () => Promise<string>;
      };
    };
  })
    .completeLesson(lessonIndex)
    .accounts({
      config: getConfigPDA(),
      course: coursePDA,
      enrollment: enrollmentPDA,
      learner,
      learnerTokenAccount: learnerAta,
      xpMint: configData.xpMint,
      backendSigner: configData.backendSigner,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();

  return signature;
}

export function explorerUrl(
  signature: string,
  cluster: 'devnet' | 'mainnet-beta' = 'devnet'
): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
