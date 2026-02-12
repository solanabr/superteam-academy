"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { GraduationCap, CheckCircle, Wallet } from "@phosphor-icons/react";
import { MintButton } from "./mint-button";
import { createClient } from "@/lib/supabase/client";
import type {
  CertificateMetadata,
  MintResult,
} from "@/lib/solana/mint-certificate";

interface CourseCompletionMintProps {
  courseId: string;
  courseTitle: string;
  userId: string;
  totalLessons: number;
}

type CompletionState =
  | { status: "loading" }
  | { status: "incomplete"; completedCount: number }
  | { status: "complete"; recipientName: string }
  | { status: "no_wallet" }
  | { status: "already_minted"; certId: string }
  | { status: "insert_failed"; mintAddress: string };

export function CourseCompletionMint({
  courseId,
  courseTitle,
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
        setState({ status: "already_minted", certId: existingCert.id });
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

  async function handleMintSuccess(result: MintResult) {
    const supabase = createClient();
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { error } = await supabase.from("certificates").insert({
        user_id: userId,
        course_id: courseId,
        course_title: courseTitle,
        mint_address: result.mintAddress,
        metadata_uri: result.metadataUri,
      });

      if (!error) {
        setState({ status: "already_minted", certId: result.mintAddress });
        return;
      }

      console.error(
        `[Certificate] Insert attempt ${attempt}/${maxAttempts} failed:`,
        error.message
      );

      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
        );
      }
    }

    // All retries exhausted — show persistent warning with mint address
    setState({ status: "insert_failed", mintAddress: result.mintAddress });
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
          className="hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors"
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
        className="border-warning bg-warning/10 rounded-lg border p-4"
        role="alert"
      >
        <p className="text-warning text-sm font-medium">{t("insertFailed")}</p>
        <p className="mt-1 text-xs text-text-3">
          {t("mintAddress")}: {state.mintAddress}
        </p>
      </div>
    );
  }

  if (state.status === "complete") {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? "");
    const imageUrl = `${origin}/cover.png`;

    const metadata: CertificateMetadata = {
      courseId,
      courseName: courseTitle,
      recipientName: state.recipientName,
      completionDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      imageUrl,
    };

    return (
      <div className="flex items-center gap-3">
        <GraduationCap
          size={18}
          weight="duotone"
          className="shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{t("courseComplete")}</span>
        <MintButton
          metadata={metadata}
          onSuccess={handleMintSuccess}
          className="h-8 px-3 text-xs"
        />
      </div>
    );
  }

  // incomplete
  return null;
}
