"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Sparkles, Shield, Trophy } from "lucide-react";
import { toast } from "sonner";

const DISMISS_KEY = "link-wallet-prompt-dismissed";

/**
 * Prompts OAuth users (Google/GitHub) to link a Solana wallet after login.
 * Shows once per session unless dismissed or wallet is already linked.
 */
export function LinkWalletPrompt() {
  const t = useTranslations("auth");
  const { user, isLoading, walletLinked, linkWallet, profile } = useAuth();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const [open, setOpen] = useState(false);
  const [linking, setLinking] = useState(false);
  const pendingLink = useRef(false);
  const hasShown = useRef(false);

  // Determine if user signed in via OAuth (not wallet)
  const isOAuthUser =
    !!user?.app_metadata?.provider &&
    user.app_metadata.provider !== "email" &&
    !user.app_metadata.provider.includes("wallet");

  // Show prompt after auth loads, user is OAuth, no wallet linked, not dismissed
  // Skip if onboarding hasn't been completed yet (wallet step is part of onboarding)
  useEffect(() => {
    if (isLoading || hasShown.current) return;
    if (!user || !isOAuthUser || walletLinked) return;
    if (!profile?.onboardingCompleted) return;

    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    // Small delay so the dashboard renders first
    const timer = setTimeout(() => {
      hasShown.current = true;
      setOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading, user, isOAuthUser, walletLinked, profile?.onboardingCompleted]);

  // Auto-trigger link after wallet connects via modal
  useEffect(() => {
    if (connected && pendingLink.current && !walletLinked) {
      pendingLink.current = false;
      setLinking(true);
      linkWallet()
        .then(() => {
          toast.success(t("walletLinkedSuccess"));
          setOpen(false);
        })
        .catch((err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to link wallet",
          );
        })
        .finally(() => setLinking(false));
    }
  }, [connected, walletLinked, linkWallet, t]);

  const handleLinkWallet = useCallback(async () => {
    if (!connected) {
      pendingLink.current = true;
      // Close this dialog so its overlay doesn't block the wallet modal
      setOpen(false);
      // Small delay to let dialog close animation finish
      setTimeout(() => setVisible(true), 200);
      return;
    }

    setLinking(true);
    try {
      await linkWallet();
      toast.success(t("walletLinkedSuccess"));
      setOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to link wallet",
      );
    } finally {
      setLinking(false);
    }
  }, [connected, linkWallet, setVisible, t]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setOpen(false);
  }, []);

  // Re-open dialog after wallet connects (user came back from wallet modal)
  useEffect(() => {
    if (connected && pendingLink.current && !open) {
      setOpen(true);
    }
  }, [connected, open]);

  if (!isOAuthUser || walletLinked) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleDismiss()}>
      <DialogContent className="max-w-xs p-5">
        <DialogHeader className="space-y-1">
          <div className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <DialogTitle className="text-center text-base">
            {t("linkWalletTitle")}
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            {t("linkWalletDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 py-1">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>{t("linkBenefitXp")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{t("linkBenefitNfts")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>{t("linkBenefitOwnership")}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          <Button onClick={handleLinkWallet} disabled={linking} size="sm" className="gap-1.5 h-8 text-xs">
            <Wallet className="h-3.5 w-3.5" />
            {linking ? t("linkingWallet") : t("linkWalletAction")}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-7 text-xs text-muted-foreground">
            {t("linkWalletLater")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
