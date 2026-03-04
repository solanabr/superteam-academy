"use client";

import { useMemo, useState, type ReactElement } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useTranslations } from "next-intl";
import { useAPIQuery, useAPIMutation } from "@/lib/api/useAPI";
import { useAuthStore } from "@/store/auth-store";
import { useWalletStore } from "@/store/wallet-store";
import { Link } from "@/i18n/navigation";

const LINK_MESSAGE = "Link wallet to Superteam Academy";

/** Matches auth-social-buttons: flat shadow, border-2, rounded-none, hover translate */
const WALLET_BUTTON_WRAPPER_CLASS =
  "[&_.wallet-adapter-button]:!h-9 [&_.wallet-adapter-button]:!min-h-9 [&_.wallet-adapter-button]:!rounded-none [&_.wallet-adapter-button]:!border-2 [&_.wallet-adapter-button]:!border-border [&_.wallet-adapter-button]:!bg-background [&_.wallet-adapter-button]:!text-foreground [&_.wallet-adapter-button]:!font-mono [&_.wallet-adapter-button]:!text-xs [&_.wallet-adapter-button]:!uppercase [&_.wallet-adapter-button]:!tracking-wide [&_.wallet-adapter-button]:!shadow-[var(--shadow-flat)] [&_.wallet-adapter-button]:!px-4 [&_.wallet-adapter-button]:!py-2 [&_.wallet-adapter-button]:hover:!translate-x-px [&_.wallet-adapter-button]:hover:!translate-y-px [&_.wallet-adapter-button]:hover:!shadow-none [&_.wallet-adapter-button]:!transition-transform dark:[&_.wallet-adapter-button]:!shadow-[var(--shadow-flat-yellow)] dark:[&_.wallet-adapter-button]:hover:!shadow-none";

type ProfileResponse = {
  wallet_public_key: string | null;
};

type WalletStatusProps = {
  variant?: "default" | "dropdown" | "sidebar";
};

export function WalletStatus({ variant = "default" }: WalletStatusProps): ReactElement {
  const t = useTranslations("auth");
  const session = useAuthStore((state) => state.session);
  const wallet_store_public_key = useWalletStore((state) => state.public_key);
  const { connected, publicKey, signMessage } = useWallet();
  const display_public_key = publicKey?.toBase58() ?? wallet_store_public_key;

  const [link_error, set_link_error] = useState<string | null>(null);
  const [link_success, set_link_success] = useState(false);

  const { data: profile } = useAPIQuery<ProfileResponse>({
    queryKey: ["profile-wallet"],
    path: "/api/user/profile",
    enabled: Boolean(session),
  });

  const link_wallet_mutation = useAPIMutation<{ ok: boolean }, { public_key: string; message: string; signature: string }>(
    "post",
    "/api/auth/link-wallet",
  );

  const is_linked = useMemo(() => {
    if (!profile?.wallet_public_key || !display_public_key) return false;
    return profile.wallet_public_key === display_public_key;
  }, [profile?.wallet_public_key, display_public_key]);

  const short_address = useMemo(() => {
    const value = display_public_key ?? profile?.wallet_public_key ?? null;
    if (!value) return null;
    if (value.length <= 8) return value;
    return `${value.slice(0, 4)}…${value.slice(-4)}`;
  }, [display_public_key, profile?.wallet_public_key]);

  const handle_link_wallet = async (): Promise<void> => {
    if (!publicKey || !signMessage || !session) {
      set_link_error("Sign in and connect a wallet first.");
      return;
    }
    set_link_error(null);
    set_link_success(false);

    try {
      const message = LINK_MESSAGE;
      const encoded = new TextEncoder().encode(message);
      const sig = await signMessage(encoded);
      const signature_base64 =
        typeof btoa !== "undefined" ? btoa(String.fromCharCode(...sig)) : "";

      await link_wallet_mutation.mutateAsync({
        public_key: publicKey.toBase58(),
        message,
        signature: signature_base64,
      });
      set_link_success(true);
    } catch (error) {
      const message_text = error instanceof Error ? error.message : "Failed to link wallet";
      set_link_error(message_text);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Link href="/login" className="underline-offset-2 hover:underline">
          {t("login")}
        </Link>
        <span className="text-muted-foreground">to link wallet</span>
      </div>
    );
  }

  const isCompact = variant === "dropdown";
  const isSidebar = variant === "sidebar";

  return (
    <div
      className={
        isCompact
          ? "flex w-full flex-col gap-1.5"
          : isSidebar
            ? "flex w-full flex-col gap-1.5"
            : "flex flex-col items-end gap-1"
      }
    >
      <div
        className={`flex items-center gap-2 ${WALLET_BUTTON_WRAPPER_CLASS} ${isCompact || isSidebar ? "w-full flex-col items-stretch" : ""}`}
      >
        <WalletMultiButton />
        {short_address && (
          <span className="text-xs text-muted-foreground">
            {short_address}
            {is_linked ? " · linked" : " · not linked"}
          </span>
        )}
      </div>
      {!is_linked && connected && publicKey && (
        <button
          type="button"
          onClick={handle_link_wallet}
          className="text-[10px] font-semibold uppercase tracking-wide text-primary underline-offset-2 hover:underline"
        >
          Link wallet to account
        </button>
      )}
      {link_error && (
        <span className="text-[10px] text-destructive" role="alert">
          {link_error}
        </span>
      )}
      {link_success && (
        <span className="text-[10px] text-primary" role="status">
          {t("walletLinked")}
        </span>
      )}
    </div>
  );
}

