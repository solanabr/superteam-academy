"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { GraduationCap, CheckCircle, Wallet } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

interface CourseCompletionMintProps {
  courseId: string;
  userId: string;
  totalLessons: number;
}

type CompletionState =
  | { status: "loading" }
  | { status: "incomplete"; completedCount: number }
  | { status: "complete" }
  | { status: "no_wallet" }
  | { status: "minting" }
  | { status: "mint_error"; message: string }
  | { status: "already_minted" };

/**
 * Displays course completion status and credential mint state.
 * Credentials are minted automatically by the Helius webhook chain
 * (LessonCompleted → finalizeCourse → CourseFinalized → issueCredential).
 * If the automatic chain failed, a manual "Mint Certificate" button appears.
 */
export function CourseCompletionMint({
  courseId,
  userId,
  totalLessons,
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
          .select("wallet_address, username")
          .eq("id", userId)
          .single();

        if (!profile?.wallet_address) {
          setState({ status: "no_wallet" });
          return;
        }

        setState({ status: "complete" });
      } else {
        setState({ status: "incomplete", completedCount });
      }
    }

    checkCompletion();
  }, [courseId, userId, totalLessons]);

  async function handleMint() {
    setState({ status: "minting" });
    try {
      const res = await fetch("/api/certificates/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        if (res.status === 409) {
          setState({ status: "already_minted" });
          return;
        }
        setState({
          status: "mint_error",
          message: data.error ?? "Minting failed",
        });
        return;
      }
      setState({ status: "already_minted" });
    } catch (e) {
      setState({
        status: "mint_error",
        message: e instanceof Error ? e.message : "Minting failed",
      });
    }
  }

  if (state.status === "loading") {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-center gap-2 text-sm text-text-3">
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden="true"
          />
          {tCommon("loading")}
        </div>
      </div>
    );
  }

  if (state.status === "already_minted") {
    return (
      <div className="border-success/30 rounded-xl border bg-card px-5 py-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-center gap-2 text-sm text-success">
          <CheckCircle size={20} weight="duotone" aria-hidden="true" />
          <span className="font-display font-bold">{t("mintSuccess")}</span>
        </div>
      </div>
    );
  }

  if (state.status === "no_wallet") {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap
              size={20}
              weight="duotone"
              className="shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-text">
              {t("courseComplete")}
            </span>
          </div>
          <Link
            href={`/${locale}/settings`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active"
          >
            <Wallet size={14} weight="duotone" aria-hidden="true" />
            {t("linkWalletToMint")}
          </Link>
        </div>
      </div>
    );
  }

  if (state.status === "minting") {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap
              size={20}
              weight="duotone"
              className="shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-text">
              {t("courseComplete")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-3">
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-hidden="true"
            />
            {t("minting")}
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "complete" || state.status === "mint_error") {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap
              size={20}
              weight="duotone"
              className="shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-text">
              {t("courseComplete")}
            </span>
          </div>
          <p className="text-center text-xs text-text-3">
            {t("mintDescription")}
          </p>
          <button
            onClick={() => void handleMint()}
            className="rounded-md bg-primary px-5 py-2 font-display text-xs font-bold text-white shadow-push transition-all duration-100 hover:bg-primary-hover active:translate-y-[3px] active:shadow-push-active"
          >
            {t("mintCertificate")}
          </button>
          {state.status === "mint_error" && (
            <p className="text-center text-xs text-streak">{state.message}</p>
          )}
        </div>
      </div>
    );
  }

  // incomplete
  return null;
}
