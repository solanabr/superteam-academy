"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LinkedWalletPromptProps {
  /**
   * "connect" = nothing can sign yet (external-wallet user, extension
   * disconnected); "mismatch" = something can sign, but it is not the wallet
   * the account is linked to.
   */
  variant: "connect" | "mismatch";
  /** The account's linked wallet, named in the copy so the ask is concrete. */
  linkedWallet: string | null;
  /** Opens the wallet-adapter modal. Only rendered for the "connect" variant. */
  onConnect?: () => void;
  onDismiss: () => void;
}

/**
 * Explain-then-connect card for the unenroll flow.
 *
 * The raw wallet-adapter modal used to appear here with no context, which does
 * not say WHICH wallet is wanted — and on this flow only one wallet works: the
 * linked one, because the program requires the learner to sign.
 */
export function LinkedWalletPrompt({
  variant,
  linkedWallet,
  onConnect,
  onDismiss,
}: LinkedWalletPromptProps) {
  const t = useTranslations("walletPrompt");
  const linked = linkedWallet ? truncateAddress(linkedWallet) : null;
  const ref = useRef<HTMLDivElement>(null);

  // The card answers a click that may be well below it, so bring it into view
  // and give it focus — otherwise the ✕ appears to do nothing.
  useEffect(() => {
    const card = ref.current;
    if (!card) return;
    // jsdom (and older Safari) has no scrollIntoView options support; focus
    // alone still puts the card in view there.
    card.scrollIntoView?.({ block: "nearest" });
    card.focus();
  }, [variant]);

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="mb-4 space-y-2 rounded-xl border border-border bg-card p-4 shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <p className="font-display text-sm font-bold text-text">
        {variant === "connect" ? t("connectTitle") : t("mismatchTitle")}
      </p>
      <p className="text-xs text-text-2">
        {variant === "connect"
          ? linked
            ? t("connectBody", { linked })
            : t("connectBodyUnknown")
          : t("mismatchBody", { linked: linked ?? "" })}
      </p>
      <div className="flex gap-2">
        {variant === "connect" && onConnect && (
          <Button size="sm" variant="primary" onClick={onConnect}>
            {t("connectAction")}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {t("dismiss")}
        </Button>
      </div>
    </div>
  );
}
