"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet, Sparkles, Shield, Trophy, ExternalLink, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WalletStepProps {
  onNext: () => void;
  onBack: () => void;
  pendingLink: boolean;
  setPendingLink: (v: boolean) => void;
}

export function WalletStep({ onNext, onBack, pendingLink, setPendingLink }: WalletStepProps) {
  const t = useTranslations("onboarding");
  const tAuth = useTranslations("auth");
  const { walletLinked, linkWallet } = useAuth();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [linking, setLinking] = useState(false);
  const [view, setView] = useState<"ask" | "guide">("ask");

  // Auto-trigger link after wallet connects via modal
  useEffect(() => {
    if (connected && pendingLink && !walletLinked && !linking) {
      setPendingLink(false);
      setLinking(true);
      linkWallet()
        .then(() => {
          toast.success(tAuth("walletLinkedSuccess"));
          onNext();
        })
        .catch((err) => {
          toast.error(err instanceof Error ? err.message : "Failed to link wallet");
        })
        .finally(() => setLinking(false));
    }
  }, [connected, pendingLink, walletLinked, linking, linkWallet, tAuth, onNext]);

  const handleConnectWallet = useCallback(async () => {
    if (!connected) {
      setPendingLink(true);
      setTimeout(() => setVisible(true), 100);
      return;
    }

    setLinking(true);
    try {
      await linkWallet();
      toast.success(tAuth("walletLinkedSuccess"));
      onNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link wallet");
    } finally {
      setLinking(false);
    }
  }, [connected, linkWallet, setVisible, tAuth, onNext]);

  const benefits = [
    { icon: Sparkles, color: "text-amber-500", label: tAuth("linkBenefitXp"), desc: tAuth("linkBenefitXpDesc") },
    { icon: Trophy, color: "text-primary", label: tAuth("linkBenefitNfts"), desc: tAuth("linkBenefitNftsDesc") },
    { icon: Shield, color: "text-emerald-500", label: tAuth("linkBenefitOwnership"), desc: tAuth("linkBenefitOwnershipDesc") },
  ];

  // If wallet already linked, show simple continue
  if (walletLinked) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center px-2"
      >
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Wallet className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-1 text-center">
          {t("walletLinkedTitle")}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {t("walletLinkedDesc")}
        </p>
        <Button onClick={onNext} className="w-full max-w-sm">
          {t("next")}
        </Button>
      </motion.div>
    );
  }

  // Show linking state while wallet is connected and signature is pending
  if (linking || pendingLink) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center px-2"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-1 text-center">
          {tAuth("linkingWallet")}
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          {t("walletSignMessage")}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center px-2"
    >
      <AnimatePresence mode="wait">
        {/* Initial question: Do you have a wallet? */}
        {view === "ask" && (
          <motion.div
            key="ask"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-1 text-center">
              {t("walletAskTitle")}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-2">
              {t("walletAskSubtitle")}
            </p>

            {/* Benefits */}
            <div className="w-full max-w-sm space-y-2 mb-6">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="flex items-start gap-3 rounded-xl border bg-card p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className={`h-4 w-4 ${b.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{b.label}</p>
                      <p className="text-xs text-muted-foreground">{b.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Two choices */}
            <div className="flex flex-col gap-2 w-full max-w-sm">
              <Button onClick={handleConnectWallet} disabled={linking} className="gap-2">
                <Wallet className="h-4 w-4" />
                {linking ? tAuth("linkingWallet") : t("walletHaveOne")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setView("guide")}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {t("walletDontHave")}
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={onBack} className="flex-1 text-muted-foreground">
                  {t("back")}
                </Button>
                <Button variant="ghost" onClick={onNext} className="flex-1 text-muted-foreground">
                  {t("skipForNow")}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Guide: Create a wallet */}
        {view === "guide" && (
          <motion.div
            key="guide"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center w-full"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-1 text-center">
              {t("walletGuideTitle")}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {t("walletGuideSubtitle")}
            </p>

            {/* Quick steps */}
            <div className="w-full max-w-sm space-y-3 mb-6">
              <div className="flex items-start gap-3 rounded-xl border bg-card p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <div>
                  <p className="text-sm font-medium">{t("walletGuideStep1")}</p>
                  <a
                    href="https://solflare.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    solflare.com <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border bg-card p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <p className="text-sm font-medium">{t("walletGuideStep2")}</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border bg-card p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                <div>
                  <p className="text-sm font-medium">{t("walletGuideStep3")}</p>
                  <p className="text-xs text-red-500 font-medium mt-0.5">{t("walletGuideStep3Warning")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border bg-card p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                <p className="text-sm font-medium">{t("walletGuideStep4")}</p>
              </div>
            </div>

            {/* Full guide link */}
            <a
              href="/docs/create-wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1 mb-6"
            >
              {t("walletGuideFullGuide")} <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <div className="flex flex-col gap-2 w-full max-w-sm">
              <Button onClick={handleConnectWallet} disabled={linking} className="gap-2">
                <Wallet className="h-4 w-4" />
                {linking ? tAuth("linkingWallet") : t("walletGuideReady")}
              </Button>
              <Button variant="outline" onClick={() => setView("ask")}>
                {t("back")}
              </Button>
              <Button variant="ghost" onClick={onNext} className="text-muted-foreground">
                {t("skipForNow")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
