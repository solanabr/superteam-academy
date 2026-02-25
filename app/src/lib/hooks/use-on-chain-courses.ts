"use client";

import { useConnection } from "@/lib/wallet/context";
import type { PublicKey } from "@solana/web3.js";
import { useState, useEffect, useCallback } from "react";
import {
  getReadonlyProgram,
  getAccounts,
  type CourseAccount,
} from "@/lib/solana/program";

export type OnChainCourse = CourseAccount & { publicKey: PublicKey };

export function useOnChainCourses() {
  const { connection } = useConnection();
  const [courses, setCourses] = useState<OnChainCourse[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const program = getReadonlyProgram(connection);
      const allCourses = await getAccounts(program).course.all();
      setCourses(
        allCourses.map((acc) => ({
          ...acc.account,
          publicKey: acc.publicKey,
        })),
      );
    } catch (error) {
      console.error("[useOnChainCourses] Failed to fetch courses:", error);
      setCourses([]);
    }
    setLoading(false);
  }, [connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { courses, loading, refresh };
}
