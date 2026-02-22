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
  | { status: "already_minted" };

/**
 * Displays course completion status and credential mint state.
 * Credentials are minted automatically by the Helius webhook chain
 * (LessonCompleted → finalizeCourse → CourseFinalized → issueCredential).
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

        // Course is complete — credential will be minted by webhook chain.
        setState({ status: "complete" });
      } else {
        setState({ status: "incomplete", completedCount });
      }
    }

    checkCompletion();
  }, [courseId, userId, totalLessons]);

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

  if (state.status === "complete") {
    return (
      <div className="flex items-center gap-3">
        <GraduationCap
          size={18}
          weight="duotone"
          className="shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{t("courseComplete")}</span>
      </div>
    );
  }

  // incomplete
  return null;
}
