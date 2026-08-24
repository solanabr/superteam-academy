"use client";

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

  return (
    <div
      role="alert"
      className="bg-card border-border shadow-card mb-4 space-y-2 rounded-xl border p-4"
    >
      <p className="text-text font-display text-sm font-bold">
        {variant === "connect" ? t("connectTitle") : t("mismatchTitle")}
      </p>
      <p className="text-text-2 text-xs">
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
