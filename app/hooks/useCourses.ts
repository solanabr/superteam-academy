"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { mockCourses } from "@/lib/mockData";

export function useCourses() {
  const { publicKey } = useWallet();
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setEnrolledIds(new Set());
      return;
    }
    // Load from localStorage for now (swap for on-chain later)
    try {
      const stored = localStorage.getItem(`enrollments_${publicKey.toBase58()}`);
      if (stored) {
        setEnrolledIds(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, [publicKey]);

  function isEnrolled(courseId: string): boolean {
    return enrolledIds.has(courseId);
  }

  function enroll(courseId: string) {
    if (!publicKey) return;
    const updated = new Set(enrolledIds);
    updated.add(courseId);
    setEnrolledIds(updated);
    localStorage.setItem(
      `enrollments_${publicKey.toBase58()}`,
      JSON.stringify(Array.from(updated))
    );
  }

  return {
    courses: mockCourses,
    enrolledIds,
    isEnrolled,
    enroll,
    loading,
  };
}