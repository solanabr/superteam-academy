"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { PhantomLogo } from "@/components/icons/phantom-logo";

/**
 * "Take your wallet with you" (#987, epic #983).
 *
 * A Phantom embedded wallet is a real Phantom wallet: download the app, choose
 * "Continue with Google" with the same account, and the SAME wallet appears —
 * same address, credentials intact, no export step. This card exists because
 * Phantom's own onboarding makes the WRONG branch the obvious one: a learner
 * who taps "Create new wallet" instead gets a fresh address with a seed
 * phrase, their credentials stay in the embedded wallet they can't see, and
 * they conclude the Academy lost their NFTs. That support ticket is
 * predictable, so we get ahead of it with explicit instructions and the
 * address tail to confirm against.
 *
 * Renders ONLY for wallets provisioned through Phantom Connect
 * (`prefs.walletProvider === "phantom-embedded"`, stamped by PhantomAuthHandler
 * after a successful bridge). A learner who linked an external wallet must
 * never be told to "download Phantom to take it with you" — they already have
 * a wallet app, and the instructions would be nonsense for it.
 */

const PHANTOM_HELP_URL =
  "https://help.phantom.com/hc/en-us/articles/32775281256851";

interface PhantomGraduationCardProps {
  walletAddress: string;
}

export function PhantomGraduationCard({
  walletAddress,
}: PhantomGraduationCardProps) {
  const t = useTranslations("settings");
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("prefs")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const prefs = data?.prefs;
      // Fail closed: no provenance record → no card. Wrong instructions are
      // worse than a missing card.
      setIsEmbedded(
        typeof prefs === "object" &&
          prefs !== null &&
          !Array.isArray(prefs) &&
          (prefs as Record<string, unknown>).walletProvider ===
            "phantom-embedded"
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isEmbedded) return null;

  const tail = `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;

  return (
    <div className="set-row flex-col items-stretch gap-3">
      <div className="flex items-center gap-3">
        <div className="set-row-icon">
          <PhantomLogo className="h-5 w-5 rounded-[5px]" />
        </div>
        <div>
          <p className="set-row-name">{t("phantomGraduationTitle")}</p>
          <p className="set-row-meta">{t("phantomGraduationSubtitle")}</p>
        </div>
      </div>

      <ol className="ml-1 list-inside list-decimal space-y-1.5 text-[13px] text-text-2">
        <li>{t("phantomGraduationStep1")}</li>
        {/* The load-bearing instruction: "Continue with Google", NEVER "Create
            new wallet" — the wrong branch mints a different address. */}
        <li className="font-medium text-text">{t("phantomGraduationStep2")}</li>
        <li>
          {t("phantomGraduationStep3")}{" "}
          <span className="font-mono font-bold">{tail}</span>
        </li>
      </ol>

      <a
        href={PHANTOM_HELP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[12px] font-medium text-primary underline-offset-2 hover:underline"
      >
        {t("phantomGraduationHelp")}
        <ArrowSquareOut size={12} weight="bold" aria-hidden="true" />
      </a>
    </div>
  );
}
