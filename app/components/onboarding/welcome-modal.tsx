"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

const SEEN_KEY = "superteam-onboarding-seen";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("onboarding");
  const { connected } = useWallet();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(SEEN_KEY);
    if (!seen) setOpen(true);
  }, []);

  function dismiss() {
    setOpen(false);
    localStorage.setItem(SEEN_KEY, "1");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-edge bg-surface p-8 shadow-2xl animate-fade-in-up">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 text-content-muted hover:text-content transition-colors"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-solana-gradient">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-content">{t("title")}</h2>
        <p className="mt-2 text-sm text-content-muted leading-relaxed">{t("subtitle")}</p>

        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-solana-purple/10 text-xs font-bold text-solana-purple">1</span>
            <p className="text-sm text-content-secondary">{t("step1")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-solana-green/10 text-xs font-bold text-solana-green">2</span>
            <p className="text-sm text-content-secondary">{t("step2")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-solana-cyan/10 text-xs font-bold text-solana-cyan">3</span>
            <p className="text-sm text-content-secondary">{t("step3")}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {!connected && (
            <div onClick={dismiss}>
              <WalletMultiButton />
            </div>
          )}
          <Link
            href="/#courses"
            onClick={dismiss}
            className="rounded-lg border border-edge px-5 py-2.5 text-center text-sm font-medium text-content-secondary hover:text-content transition-colors"
          >
            {t("browseCourses")}
          </Link>
        </div>
      </div>
    </div>
  );
}
