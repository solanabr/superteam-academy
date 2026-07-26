"use client";

import { useTranslations } from "next-intl";
import { truncateAddress } from "@/lib/utils";

interface WalletMismatchWarningProps {
  /** "mismatch" = connected wallet differs from the linked one;
   *  "unlinked" = connected wallet isn't linked to the account at all. */
  variant: "mismatch" | "unlinked";
  /** The account's linked wallet, shown in the mismatch copy. */
  linkedWallet: string | null;
}

/**
 * Pre-flight warning shown BEFORE a deploy when the connected wallet won't be
 * the one the server records against (#622). The server binds the deploy to
 * the LINKED wallet (profiles.wallet_address); a mismatch means a successful,
 * SOL-spending deploy that can't be recorded — and the capstone credential
 * gate (LX-E2) would then deny it. Informational only: the deploy is the
 * learner's to make, so we warn, never block.
 */
export function WalletMismatchWarning({
  variant,
  linkedWallet,
}: WalletMismatchWarningProps) {
  const t = useTranslations("deploy.walletCheck");

  return (
    <div
      role="alert"
      className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/10 p-3"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-500">
        <svg
          className="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        {variant === "unlinked" ? t("unlinkedTitle") : t("mismatchTitle")}
      </p>
      <p className="text-xs text-muted-foreground">
        {variant === "unlinked"
          ? t("unlinkedBody")
          : t("mismatchBody", {
              linked: linkedWallet ? truncateAddress(linkedWallet) : "",
            })}
      </p>
    </div>
  );
}
