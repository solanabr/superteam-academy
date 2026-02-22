"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { toast } from "sonner";
import type { OnchainAcademy } from "@/lib/solana/types";
import IDL from "@/lib/solana/idl.json";
import { getCoursePDA, getEnrollmentPDA } from "@/lib/solana/enrollments";
import { parseEnrollError } from "@/hooks/use-enrollment";
import { Coins, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ClosableEnrollment {
  courseId: string;
  title: string;
}

export function RentReclaimBanner({ courses }: { courses: ClosableEnrollment[] }) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [dismissed, setDismissed] = useState(false);
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());
  const [closingId, setClosingId] = useState<string | null>(null);

  const visible = courses.filter((c) => !closedIds.has(c.courseId));

  if (dismissed || visible.length === 0) return null;

  async function handleClose(courseId: string) {
    if (!publicKey || !signTransaction || !signAllTransactions) return;
    setClosingId(courseId);
    try {
      const provider = new AnchorProvider(
        connection,
        { publicKey, signTransaction, signAllTransactions },
        { commitment: "confirmed" },
      );
      const prog = new Program<OnchainAcademy>(IDL as OnchainAcademy, provider);
      await prog.methods
        .closeEnrollment()
        .accountsPartial({
          learner: publicKey,
          course: getCoursePDA(courseId),
          enrollment: getEnrollmentPDA(courseId, publicKey),
        })
        .rpc();
      setClosedIds((prev) => new Set([...prev, courseId]));
      toast.success("Enrollment closed. Rent reclaimed!");
    } catch (err) {
      toast.error(parseEnrollError(err));
    } finally {
      setClosingId(null);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Coins className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Reclaim rent from completed courses</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Closing a completed enrollment account returns ~0.002 SOL per course.
            </p>
            <div className="mt-3 space-y-2">
              {visible.map((c) => (
                <div
                  key={c.courseId}
                  className="flex items-center justify-between gap-4 rounded-md bg-background/60 px-3 py-2"
                >
                  <span className="truncate text-sm">{c.title}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 border-green-500/40 text-xs text-green-600 hover:bg-green-500/10"
                    disabled={closingId === c.courseId}
                    onClick={() => handleClose(c.courseId)}
                  >
                    {closingId === c.courseId ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Closing…
                      </>
                    ) : (
                      "Close & Reclaim"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
