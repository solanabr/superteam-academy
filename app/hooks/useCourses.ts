"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { mockCourses } from "@/lib/mockData";
import { fetchEnrollment, buildEnrollTransaction } from "@/lib/onchain/LearningProgressService";

export function useCourses() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load enrollment status from devnet on wallet connect
  useEffect(() => {
    if (!publicKey) {
      setEnrolledIds(new Set());
      return;
    }

    const loadEnrollments = async () => {
      setLoading(true);
      try {
        // Check each course on-chain
        const enrolled = new Set<string>();
        await Promise.all(
          mockCourses.map(async (course) => {
            const data = await fetchEnrollment(publicKey, course.id);
            if (data) enrolled.add(course.id);
          })
        );
        setEnrolledIds(enrolled);
      } catch (err) {
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem(`enrollments_${publicKey.toBase58()}`);
          if (stored) setEnrolledIds(new Set(JSON.parse(stored)));
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    loadEnrollments();
  }, [publicKey]);

  function isEnrolled(courseId: string): boolean {
    return enrolledIds.has(courseId);
  }

  // Real devnet enrollment — learner signs transaction
  const enroll = useCallback(async (courseId: string) => {
    if (!publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    setEnrollingId(courseId);
    setError(null);

    try {
      // Build and send real devnet transaction
      const transaction = await buildEnrollTransaction(publicKey, courseId);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      // Update local state
      const updated = new Set(enrolledIds);
      updated.add(courseId);
      setEnrolledIds(updated);

      // Also save to localStorage as backup
      localStorage.setItem(
        `enrollments_${publicKey.toBase58()}`,
        JSON.stringify(Array.from(updated))
      );

      return signature;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Enrollment failed";

      // Handle already enrolled (account already exists on-chain)
      if (message.includes("already in use") || message.includes("0x0")) {
        const updated = new Set(enrolledIds);
        updated.add(courseId);
        setEnrolledIds(updated);
        return;
      }

      setError(message);
      throw err;
    } finally {
      setEnrollingId(null);
    }
  }, [publicKey, sendTransaction, connection, enrolledIds]);

  return {
    courses: mockCourses,
    enrolledIds,
    isEnrolled,
    enroll,
    enrollingId,
    loading,
    error,
  };
}
