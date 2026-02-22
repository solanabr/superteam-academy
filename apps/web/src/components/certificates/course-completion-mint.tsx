"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { GraduationCap, CheckCircle, Wallet } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { trackEvent, captureError } from "@/lib/analytics";
import { dispatchCertificateMinted } from "@/components/gamification/certificate-popup";

interface CredentialIssueResponse {
  success: boolean;
  signature: string;
  mintAddress: string;
  metadataUri: string;
  certificateId?: string;
  error?: string;
}

interface CourseCompletionMintProps {
  courseId: string;
  courseTitle: string;
  userId: string;
  totalLessons: number;
  trackCollection?: string;
}

type CompletionState =
  | { status: "loading" }
  | { status: "incomplete"; completedCount: number }
  | { status: "complete"; recipientName: string }
  | { status: "no_wallet" }
  | { status: "already_minted" }
  | { status: "insert_failed"; mintAddress: string }
  | { status: "issuing" }
  | { status: "issue_error"; message: string };

export function CourseCompletionMint({
  courseId,
  courseTitle: _courseTitle,
  userId,
  totalLessons,
  trackCollection,
}: CourseCompletionMintProps) {
  const t = useTranslations("certificates");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [state, setState] = useState<CompletionState>({ status: "loading" });

  useEffect(() => {
    async function checkCompletion() {
      const supabase = createClient();

      const { data: existingCert } = await supabase
        .from("certificates")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (existingCert) {
        setState({ status: "already_minted" });
        return;
      }

      const { data: progress, count } = await supabase
        .from("user_progress")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .eq("completed", true);

      const completedCount = count ?? progress?.length ?? 0;

      if (completedCount >= totalLessons && totalLessons > 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, wallet_address")
          .eq("id", userId)
          .maybeSingle();

        if (!profile?.wallet_address) {
          setState({ status: "no_wallet" });
          return;
        }

        const recipientName =
          profile.username ??
          profile.wallet_address.slice(0, 8) ??
          "Solana Developer";

        setState({ status: "complete", recipientName });
      } else {
        setState({ status: "incomplete", completedCount });
      }
    }

    checkCompletion();
  }, [courseId, userId, totalLessons]);

  async function handleIssueCredential() {
    if (!trackCollection) return;
    setState({ status: "issuing" });
    try {
      // Finalize course first (awards bonus XP, marks enrollment complete).
      // Safe to call if already finalized — the route returns 400 which we accept.
      const finalizeRes = await fetch(`/api/courses/${courseId}/finalize`, {
        method: "POST",
      });
      if (!finalizeRes.ok && finalizeRes.status !== 400) {
        const finalizeData = await finalizeRes.json();
        setState({
          status: "issue_error",
          message: finalizeData.error ?? "Failed to finalize course",
        });
        return;
      }

      const res = await fetch("/api/credentials/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, trackCollection }),
      });
      const data = (await res.json()) as CredentialIssueResponse;

      if (!res.ok || !data.success) {
        setState({
          status: "issue_error",
          message: data.error ?? "Failed to issue credential",
        });
        return;
      }

      trackEvent("credential_issued", {
        courseId,
        mintAddress: data.mintAddress,
        signature: data.signature,
      });
      if (data.certificateId) {
        dispatchCertificateMinted(data.certificateId);
      }
      setState({ status: "already_minted" });
    } catch (err) {
      if (err instanceof Error) {
        captureError(err, { courseId });
      }
      setState({
        status: "issue_error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-text-3">
        <div
          className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden="true"
        />
        {tCommon("loading")}
      </div>
    );
  }

  if (state.status === "already_minted") {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CheckCircle size={18} weight="duotone" aria-hidden="true" />
        <span className="font-medium">{t("mintSuccess")}</span>
      </div>
    );
  }

  if (state.status === "no_wallet") {
    return (
      <div className="flex items-center gap-3">
        <GraduationCap
          size={18}
          weight="duotone"
          className="shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{t("courseComplete")}</span>
        <Link
          href={`/${locale}/settings`}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-display text-xs font-bold text-white shadow-[0_2px_0_0_var(--primary-dark)] transition-all hover:bg-primary-hover active:translate-y-px active:shadow-none"
        >
          <Wallet size={14} weight="duotone" aria-hidden="true" />
          {t("linkWalletToMint")}
        </Link>
      </div>
    );
  }

  if (state.status === "insert_failed") {
    return (
      <div
        className="rounded-lg border p-4 [background:var(--xp-dim)] [border-color:var(--accent-border-s)]"
        role="alert"
      >
        <p className="text-sm font-medium text-xp">{t("insertFailed")}</p>
        <p className="mt-1 text-xs text-text-3">
          {t("mintAddress")}: {state.mintAddress}
        </p>
      </div>
    );
  }

  if (state.status === "issuing") {
    return (
      <div className="flex items-center gap-2 text-sm text-text-3">
        <div
          className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden="true"
        />
        {t("minting")}
      </div>
    );
  }

  if (state.status === "issue_error") {
    return (
      <div className="flex items-center gap-3">
        <GraduationCap
          size={18}
          weight="duotone"
          className="shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <p className="text-sm text-danger">{state.message}</p>
          <button
            onClick={handleIssueCredential}
            className="text-xs font-medium text-primary hover:underline"
          >
            {t("mintCertificate")}
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "complete") {
    if (trackCollection) {
      return (
        <div className="flex items-center gap-3">
          <GraduationCap
            size={18}
            weight="duotone"
            className="shrink-0 text-primary"
            aria-hidden="true"
          />
          <span className="text-sm font-medium">{t("courseComplete")}</span>
          <button
            onClick={handleIssueCredential}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-display text-xs font-bold text-white shadow-[0_2px_0_0_var(--primary-dark)] transition-all hover:bg-primary-hover active:translate-y-px active:shadow-none"
          >
            {t("mintCertificate")}
          </button>
        </div>
      );
    }

    // No trackCollection available — course is complete but credential cannot be issued
    return null;
  }

  // incomplete
  return null;
}
