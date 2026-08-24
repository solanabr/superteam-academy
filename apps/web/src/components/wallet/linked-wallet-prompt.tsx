"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type LinkedWalletPromptVariant = "connect" | "mismatch" | "reauth";

interface LinkedWalletPromptProps {
  /**
   * "connect" = nothing can sign yet (external-wallet user, extension
   * disconnected); "mismatch" = something can sign, but it is not the wallet
   * the account is linked to; "reauth" = the learner HAS an embedded wallet
   * and its Dynamic session expired, so the only way back is signing in with
   * the social provider again.
   */
  variant: LinkedWalletPromptVariant;
  /** The account's linked wallet, named in the copy so the ask is concrete. */
  linkedWallet: string | null;
  /** Opens the wallet-adapter modal. Only rendered for the "connect" variant. */
  onConnect?: () => void;
  /**
   * Starts the Dynamic social sign-in redirect. Only rendered for "reauth".
   * Passed in rather than called here so this component keeps no Dynamic SDK
   * import — it renders on pages that must build without one.
   */
  onReauth?: () => void | Promise<void>;
  onDismiss: () => void;
}

/**
 * Explain-then-act card for the enrol / unenrol wallet flows.
 *
 * The raw wallet-adapter modal used to appear here with no context, which does
 * not say WHICH wallet is wanted — and on these flows only one wallet works:
 * the linked one, because the program requires the learner to sign.
 *
 * The "reauth" variant exists because that modal is worse than contextless for
 * an embedded-wallet learner: it asks them to connect an extension they do not
 * have, and there is no route from it back to Dynamic short of a full sign-out.
 * They must never see it — see the consumers' `wallet_kind` branch.
 */
export function LinkedWalletPrompt({
  variant,
  linkedWallet,
  onConnect,
  onReauth,
  onDismiss,
}: LinkedWalletPromptProps) {
  const t = useTranslations("walletPrompt");
  const linked = linkedWallet ? truncateAddress(linkedWallet) : null;
  const ref = useRef<HTMLDivElement>(null);
  const [reauthStarting, setReauthStarting] = useState(false);

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

  const title =
    variant === "connect"
      ? t("connectTitle")
      : variant === "mismatch"
        ? t("mismatchTitle")
        : t("reauthTitle");

  const body =
    variant === "connect"
      ? linked
        ? t("connectBody", { linked })
        : t("connectBodyUnknown")
      : variant === "mismatch"
        ? t("mismatchBody", { linked: linked ?? "" })
        : t("reauthBody");

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="mb-4 space-y-2 rounded-xl border border-border bg-card p-4 shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <p className="font-display text-sm font-bold text-text">{title}</p>
      <p className="text-xs text-text-2">{body}</p>
      <div className="flex gap-2">
        {variant === "connect" && onConnect && (
          <Button size="sm" variant="primary" onClick={onConnect}>
            {t("connectAction")}
          </Button>
        )}
        {variant === "reauth" && onReauth && (
          <Button
            size="sm"
            variant="primary"
            disabled={reauthStarting}
            onClick={() => {
              // The click ends in a full-page navigation, so this flag is the
              // only feedback between click and redirect. It is never cleared
              // on success — the page is gone.
              setReauthStarting(true);
              void Promise.resolve(onReauth()).catch(() =>
                setReauthStarting(false)
              );
            }}
          >
            {reauthStarting ? t("reauthStarting") : t("reauthAction")}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {t("dismiss")}
        </Button>
      </div>
    </div>
  );
}
