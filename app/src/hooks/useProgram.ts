// app/src/hooks/useProgram.ts
import { useMemo, useCallback } from "react";
import { 
  AnchorProvider, 
  Program, 
  setProvider 
} from "@coral-xyz/anchor";
import { 
  useAnchorWallet, 
  useConnection 
} from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

import idl from "@/lib/idl/onchain_academy.json";
import type { OnchainAcademy } from "@/types/onchain_academy";
import { PROGRAM_ID, XP_MINT } from "@/lib/constants";
import * as web3 from "@solana/web3.js";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    const provider = wallet 
      ? new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions())
      : new AnchorProvider(connection, {
          publicKey: PublicKey.default,
          signTransaction: async () => { throw new Error("Read-only") },
          signAllTransactions: async () => { throw new Error("Read-only") },
        }, AnchorProvider.defaultOptions());

    setProvider(provider);
    
    // @ts-ignore - игнорируем несовпадение типов IDL, так как мы знаем, что JSON валиден
    return new Program<OnchainAcademy>(idl, provider);
  }, [connection, wallet]);

  const fetchCourses = useCallback(async () => {
    try {
      // @ts-ignore
      const allCourses = await program.account.course.all();
      return allCourses.filter((c: any) => c.account.isActive);
    } catch (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
  }, [program]);

  

  const getXPBalance = useCallback(async () => {
    if (!wallet) return 0;

    try {
      const userAta = getAssociatedTokenAddressSync(
        XP_MINT,
        wallet.publicKey,
        false,
        new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
      );

      const balance = await connection.getTokenAccountBalance(userAta);
      return Number(balance.value.amount);
    } catch (error: any) {
      // Игнорируем ошибку, если аккаунт просто не найден (это нормально)
      if (error.message?.includes("could not find account")) {
        return 0;
      }
      console.error("Error fetching XP:", error);
      return 0;
    }
  }, [connection, wallet]);

  const getUserEnrollment = useCallback(async (courseId: string) => {
    if (!wallet) return null;

    try {
      const [enrollmentPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("enrollment"),
          Buffer.from(courseId),
          wallet.publicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      return await program.account.enrollment.fetchNullable(enrollmentPda);
    } catch (error) {
      console.error("Error fetching enrollment:", error);
      return null;
    }
  }, [program, wallet]);

    const enrollInCourse = useCallback(async (courseId: string) => {
    if (!wallet) throw new Error("Wallet not connected");

    try {
      const [coursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("course"), Buffer.from(courseId)],
        PROGRAM_ID
      );

      const [enrollmentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("enrollment"), Buffer.from(courseId), wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );

      // В реальном проекте нужно проверять пререквизиты (prerequisite)
      // Для хакатона предполагаем, что их нет (null)
      
      const tx = await program.methods
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        } as const)  // или as any, если TS всё равно ругается
        .rpc();
      
      console.log("Enrolled! Tx:", tx);
      return tx;
    } catch (error) {
      console.error("Enrollment error:", error);
      throw error;
    }
  }, [program, wallet]);

  return {
    program,
    fetchCourses,
    getUserEnrollment,
    getXPBalance,
    enrollInCourse,
  };
}