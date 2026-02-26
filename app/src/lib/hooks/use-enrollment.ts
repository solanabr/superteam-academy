"use client";

import { useWallet, useConnection } from "@/lib/wallet/context";
import { useState, useEffect, useCallback } from "react";
import {
  getReadonlyProgram,
  getAccounts,
  type EnrollmentAccount,
} from "@/lib/solana/program";
import { findEnrollmentPDA } from "@/lib/solana/pda";

export type OnChainEnrollment = EnrollmentAccount;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const BN = require("bn.js");

type BNInstance = InstanceType<typeof BN>;
type BNConvertible = number | string | BNInstance;

function toBN(val: BNConvertible): BNInstance {
  if (val instanceof BN) return val;
  if (typeof val === "number" || typeof val === "string") return new BN(val);
  return new BN(val.toString());
}

// Check if bit is set in the lesson bitmap (safe for all 256 bits)
export function isLessonComplete(
  lessonFlags: BNConvertible[],
  lessonIndex: number,
): boolean {
  const word = Math.floor(lessonIndex / 64);
  const bit = lessonIndex % 64;
  if (word >= lessonFlags.length) return false;
  const flag = toBN(lessonFlags[word]);
  return !flag.and(new BN(1).shln(bit)).isZero();
}

// Count completed lessons from bitmap (safe for all 256 bits)
export function countCompletedLessons(lessonFlags: BNConvertible[]): number {
  let count = 0;
  for (const flag of lessonFlags) {
    let w = toBN(flag).clone();
    while (!w.isZero()) {
      count += w.and(new BN(1)).toNumber();
      w = w.shrn(1);
    }
  }
  return count;
}

export function useEnrollment(courseId: string | null) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [enrollment, setEnrollment] = useState<OnChainEnrollment | null>(null);
  const [loading, setLoading] = useState(false);
  const [exists, setExists] = useState(false);

  const refresh = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !courseId) {
      setEnrollment(null);
      setExists(false);
      return false;
    }

    setLoading(true);
    try {
      const program = getReadonlyProgram(connection);
      const [pda] = findEnrollmentPDA(courseId, publicKey);
      const enrollment = await getAccounts(program).enrollment.fetch(pda);
      setEnrollment(enrollment);
      setExists(true);
      setLoading(false);
      return true;
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : String(error);
      const isNotFound =
        msg.includes("Account does not exist") ||
        msg.includes("has no data");
      if (!isNotFound) {
        console.error("[useEnrollment] Failed to fetch enrollment:", error);
      }
      setEnrollment(null);
      setExists(false);
      setLoading(false);
      return false;
    }
  }, [publicKey, courseId, connection]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { enrollment, loading, exists, refresh };
}
