"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SOLANA_EXPLORER_URL,
  SOLANA_NETWORK,
} from "@/lib/constants";
import { findCoursePDA } from "@/lib/solana/pda";

interface OnchainRegistrationProps {
  courseId: string;
  courseSlug: string;
}

type RegistrationStatus = "unknown" | "checking" | "registered" | "unregistered" | "error";

export function OnchainRegistration({
  courseId,
  courseSlug,
}: OnchainRegistrationProps) {
  const [status, setStatus] = useState<RegistrationStatus>("unknown");
  const [registering, setRegistering] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [coursePDA] = findCoursePDA(courseSlug || courseId);
  const pdaAddress = coursePDA.toBase58();

  const explorerUrl = SOLANA_EXPLORER_URL.replace("%s", pdaAddress);
  const txExplorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}${SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : ""}`
    : null;

  const checkStatus = useCallback(async () => {
    setStatus("checking");
    try {
      const res = await fetch(`/api/admin/courses`);
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const courses = await res.json();
      const courseList = Array.isArray(courses) ? courses : [];
      const found = courseList.find(
        (c: { courseId: string; onChain: boolean }) =>
          (c.courseId === courseSlug || c.courseId === courseId) && c.onChain,
      );
      setStatus(found ? "registered" : "unregistered");
    } catch {
      setStatus("error");
    }
  }, [courseSlug, courseId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleRegister = async () => {
    setRegistering(true);
    setErrorMessage(null);
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/register-onchain`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      const data = await res.json();
      if (data.alreadyDone) {
        setStatus("registered");
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      setTxSignature(data.signature);
      setStatus("registered");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Registration failed",
      );
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--c-text)] flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-[var(--c-text-2)]" />
          On-Chain Registration
        </h2>
        <button
          onClick={checkStatus}
          disabled={status === "checking"}
          className="p-1.5 rounded hover:bg-[var(--c-border-subtle)] text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Refresh status"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Status Display */}
      <div className="flex items-center gap-3 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg)] p-3">
        {status === "checking" && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[var(--c-text-2)]" />
            <span className="text-xs text-[var(--c-text-2)]">
              Checking on-chain status...
            </span>
          </>
        )}
        {status === "registered" && (
          <>
            <CheckCircle2 className="h-4 w-4 text-[#55E9AB]" />
            <span className="text-xs text-[#55E9AB]">
              Registered on-chain
            </span>
          </>
        )}
        {status === "unregistered" && (
          <>
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-amber-400">
              Not registered on-chain
            </span>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="h-4 w-4 text-[#EF4444]" />
            <span className="text-xs text-[#EF4444]">
              Could not check status
            </span>
          </>
        )}
        {status === "unknown" && (
          <>
            <AlertCircle className="h-4 w-4 text-[var(--c-text-dim)]" />
            <span className="text-xs text-[var(--c-text-dim)]">
              Status unknown
            </span>
          </>
        )}
      </div>

      {/* PDA Address */}
      <div>
        <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
          Course PDA
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-[10px] font-mono text-[var(--c-text)] bg-[var(--c-bg)] border border-[var(--c-border-subtle)] rounded-[2px] px-2 py-1.5 truncate">
            {pdaAddress}
          </code>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-[#00FFA3] hover:text-[#00FFA3]/80 transition-colors shrink-0"
          >
            Explorer
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Transaction Signature */}
      {txSignature && txExplorerUrl && (
        <div>
          <label className="block text-[10px] font-medium text-[var(--c-text-2)] mb-1">
            Transaction
          </label>
          <a
            href={txExplorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-mono text-[#00FFA3] hover:text-[#00FFA3]/80 transition-colors"
          >
            {txSignature.slice(0, 16)}...{txSignature.slice(-8)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="rounded-[2px] border border-[#EF4444]/20 bg-[#EF4444]/5 px-3 py-2">
          <p className="text-[10px] text-[#EF4444]">{errorMessage}</p>
        </div>
      )}

      {/* Register Button */}
      {status !== "registered" && (
        <Button
          size="sm"
          onClick={handleRegister}
          disabled={registering || status === "checking"}
          className="w-full"
        >
          {registering ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Registering on-chain...
            </>
          ) : (
            <>
              <LinkIcon className="h-3.5 w-3.5" />
              Register On-Chain
            </>
          )}
        </Button>
      )}
    </div>
  );
}
