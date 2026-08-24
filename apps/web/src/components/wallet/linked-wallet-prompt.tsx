"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { truncateAddress } from "@/lib/utils";
// Type-only: erased at compile time, so this file still pulls in no Dynamic SDK.
import type { DynamicSocialProvider } from "@/lib/dynamic/social";
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
   * Starts the Dynamic social sign-in redirect for the provider the learner
   * picks. Only rendered for "reauth". Passed in rather than called here so
   * this component keeps no Dynamic SDK import — it renders on pages that must
   * build without one.
   */
  onReauth?: (provider: DynamicSocialProvider) => void | Promise<void>;
  onDismiss: () => void;
}

/**
 * Both providers, always — the card cannot know which one the learner used.
 *
 * The profile records that the wallet is `embedded`, never which social
 * account minted it, and the Dynamic session that WOULD know is the thing
 * that just expired. Guessing is not a cosmetic bug: `/api/auth/dynamic`
 * matches accounts on the provider-verified email, so sending a GitHub learner
 * through Google mints a SECOND account and their courses appear to vanish —
 * strictly worse than the dead end this card replaces.
 *
 * Same order as the sign-in modal (`auth-modal-body.tsx`).
 */
const REAUTH_PROVIDERS = [
  { provider: "google", labelKey: "reauthActionGoogle" },
  { provider: "github", labelKey: "reauthActionGitHub" },
] as const satisfies ReadonlyArray<{
  provider: DynamicSocialProvider;
  labelKey: string;
}>;

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
  // Which provider's redirect is in flight, so only that button shows the
  // pending label while both are disabled.
  const [reauthStarting, setReauthStarting] =
    useState<DynamicSocialProvider | null>(null);

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
        {variant === "reauth" &&
          onReauth &&
          REAUTH_PROVIDERS.map(({ provider, labelKey }) => (
            <Button
              key={provider}
              size="sm"
              variant="primary"
              disabled={reauthStarting !== null}
              onClick={() => {
                // The click ends in a full-page navigation, so this flag is
                // the only feedback between click and redirect. It is never
                // cleared on success — the page is gone.
                setReauthStarting(provider);
                void Promise.resolve(onReauth(provider)).catch(() =>
                  setReauthStarting(null)
                );
              }}
            >
              {reauthStarting === provider ? t("reauthStarting") : t(labelKey)}
            </Button>
          ))}
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {t("dismiss")}
        </Button>
      </div>
    </div>
  );
}
