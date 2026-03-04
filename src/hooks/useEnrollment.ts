"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { IDL } from "@/lib/idl";
import { getEnrollmentPda } from "@/lib/pda";

export interface EnrollmentAccount {
  publicKey: PublicKey;
  course: PublicKey;
  enrolledAt: BN;
  completedAt: BN | null;
  lessonFlags: BN[];
  credentialAsset: PublicKey | null;
  bump: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEnrollment(a: any, publicKey: PublicKey): EnrollmentAccount {
  return {
    publicKey,
    course: a.course,
    enrolledAt: a.enrolledAt ?? a.enrolled_at,
    completedAt: a.completedAt ?? a.completed_at ?? null,
    lessonFlags: a.lessonFlags ?? a.lesson_flags,
    credentialAsset: a.credentialAsset ?? a.credential_asset ?? null,
    bump: a.bump,
  };
}

export function useEnrollment(courseId: string | undefined) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery<EnrollmentAccount | null>({
    queryKey: ["enrollment", courseId, publicKey?.toBase58()],
    queryFn: async () => {
      if (!courseId || !publicKey) return null;
      const [enrollmentPda] = getEnrollmentPda(courseId, publicKey);
      const dummyWallet = {
        publicKey: Keypair.generate().publicKey,
        signTransaction: async <T>(tx: T) => tx,
        signAllTransactions: async <T>(txs: T[]) => txs,
      };
      const provider = new AnchorProvider(connection, dummyWallet, {
        commitment: "confirmed",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const program = new Program(IDL as any, provider);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any = await (program.account as any)[
        "enrollment"
      ].fetchNullable(enrollmentPda);
      if (!raw) return null;
      return normalizeEnrollment(raw, enrollmentPda);
    },
    staleTime: 30 * 1000,
    enabled: !!courseId && !!publicKey,
  });
}

export function useAllEnrollments() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  return useQuery<EnrollmentAccount[]>({
    queryKey: ["enrollments", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return [];
      const dummyWallet = {
        publicKey: Keypair.generate().publicKey,
        signTransaction: async <T>(tx: T) => tx,
        signAllTransactions: async <T>(txs: T[]) => txs,
      };
      const provider = new AnchorProvider(connection, dummyWallet, {
        commitment: "confirmed",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const program = new Program(IDL as any, provider);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all = await (program.account as any)["enrollment"].all();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return all.map((e: any) =>
        normalizeEnrollment(e.account, e.publicKey as PublicKey),
      );
    },
    staleTime: 30 * 1000,
    enabled: !!publicKey,
  });
}
