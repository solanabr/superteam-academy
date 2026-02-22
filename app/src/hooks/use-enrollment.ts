"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { toast } from "sonner";
import type { OnchainAcademy } from "@/lib/solana/types";
import IDL from "@/lib/solana/idl.json";
import {
  fetchEnrollment,
  getCoursePDA,
  getEnrollmentPDA,
  type OnChainEnrollment,
} from "@/lib/solana/enrollments";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics/events";

export function parseEnrollError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.toLowerCase().includes("user rejected") || msg.toLowerCase().includes("rejected the request"))
    return "Transaction rejected.";
  if (msg.includes("AlreadyEnrolled")) return "You are already enrolled in this course.";
  if (msg.includes("PrerequisiteNotMet")) return "You must complete the prerequisite course first.";
  if (msg.includes("CourseNotActive")) return "This course is not currently active.";
  if (msg.includes("UnenrollCooldown")) return "You must wait 24h after enrolling to unenroll from an incomplete course.";
  if (msg.includes("NotEnrolled")) return "You are not enrolled in this course.";
  return msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
}

export function useEnrollment(courseId?: string, totalLessons = 0, prerequisiteCourseId?: string) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<OnChainEnrollment | null>(null);
  const [checking, setChecking] = useState(false);

  const enrolled = enrollment !== null;
  const progress = enrollment?.progressPct ?? 0;

  const fetchAndStore = useCallback((): Promise<void> => {
    if (!publicKey || !courseId) {
      setEnrollment(null);
      return Promise.resolve();
    }
    setChecking(true);
    return fetchEnrollment(courseId, publicKey, totalLessons)
      .then(setEnrollment)
      .catch(() => setEnrollment(null))
      .finally(() => setChecking(false));
  }, [publicKey, courseId, totalLessons]);

  // Re-fetch whenever wallet, course, or connection changes
  useEffect(() => {
    fetchAndStore();
  }, [fetchAndStore, connection]);

  const enroll = useCallback(
    async (id: string): Promise<string | null> => {
      if (!publicKey || !signTransaction || !signAllTransactions) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const provider = new AnchorProvider(
          connection,
          { publicKey, signTransaction, signAllTransactions },
          { commitment: "confirmed" },
        );
        const prog = new Program<OnchainAcademy>(IDL as OnchainAcademy, provider);
        const coursePda = getCoursePDA(id);
        const enrollmentPda = getEnrollmentPDA(id, publicKey);

        let builder = prog.methods
          .enroll(id)
          .accountsPartial({
            course: coursePda,
            enrollment: enrollmentPda,
            learner: publicKey,
            systemProgram: SystemProgram.programId,
          });

        if (prerequisiteCourseId) {
          const prereqCoursePda = getCoursePDA(prerequisiteCourseId);
          const prereqEnrollmentPda = getEnrollmentPDA(prerequisiteCourseId, publicKey);
          builder = builder.remainingAccounts([
            { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
            { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
          ]);
        }

        const tx = await builder.rpc();

        trackEvent(ANALYTICS_EVENTS.ENROLLMENT, {
          courseId: id,
          wallet: publicKey.toBase58(),
          tx,
        });

        toast.success("Enrolled! Confirming on-chain… It may take upto 10-15 secs based on RPC lag…");

        // Poll until the enrollment PDA is visible on the RPC node.
        // loading stays true throughout so the button stays in loading state.
        for (let attempt = 0; attempt < 15; attempt++) {
          const result = await fetchEnrollment(id, publicKey, totalLessons);
          if (result) {
            setEnrollment(result);
            break;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }

        return tx;
      } catch (err) {
        const msg = parseEnrollError(err);
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, signTransaction, signAllTransactions, connection, fetchAndStore],
  );

  const closeEnrollment = useCallback(
    async (id: string): Promise<string | null> => {
      if (!publicKey || !signTransaction || !signAllTransactions) {
        setError("Wallet not connected");
        return null;
      }

      setClosing(true);
      setError(null);

      try {
        const provider = new AnchorProvider(
          connection,
          { publicKey, signTransaction, signAllTransactions },
          { commitment: "confirmed" },
        );
        const prog = new Program<OnchainAcademy>(IDL as OnchainAcademy, provider);
        // Anchor cannot auto-derive course/enrollment seeds from closeEnrollment()
        // because it takes no instruction arguments — pass PDAs explicitly.
        const coursePda = getCoursePDA(id);
        const enrollmentPda = getEnrollmentPDA(id, publicKey);
        const tx = await prog.methods
          .closeEnrollment()
          .accountsPartial({
            learner: publicKey,
            course: coursePda,
            enrollment: enrollmentPda,
          })
          .rpc();

        setEnrollment(null);
        toast.success("Enrollment closed.");
        return tx;
      } catch (err) {
        const msg = parseEnrollError(err);
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setClosing(false);
      }
    },
    [publicKey, signTransaction, signAllTransactions, connection],
  );

  /** Returns true if the lesson at `lessonIndex` is marked complete in the on-chain bitmap. */
  const isLessonComplete = useMemo(() => {
    return (lessonIndex: number): boolean => {
      if (!enrollment) return false;
      const flagIndex = Math.floor(lessonIndex / 64);
      const bitIndex = lessonIndex % 64;
      if (flagIndex >= enrollment.lessonFlags.length) return false;
      return enrollment.lessonFlags[flagIndex].testn(bitIndex);
    };
  }, [enrollment]);

  return {
    enroll,
    closeEnrollment,
    refreshEnrollment: fetchAndStore,
    isLessonComplete,
    loading,
    closing,
    error,
    enrolled,
    checking,
    enrollment,
    progress,
  };
}
