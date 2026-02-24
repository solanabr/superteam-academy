"use client";

import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { truncateWallet } from "@/lib/format";
import { useTranslations } from "next-intl";

export function ConnectButton() {
  const { setVisible } = useWalletModal();
  const { publicKey, disconnect, connected } = useWallet();
  const t = useTranslations("common");

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-content-secondary">
          {truncateWallet(publicKey.toBase58())}
        </span>
        <button
          onClick={() => disconnect()}
          className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content-secondary transition-colors hover:border-edge hover:text-content"
        >
          {t("disconnect")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setVisible(true)}
      className="rounded-lg bg-solana-gradient px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
    >
      {t("connectWallet")}
    </button>
  );
}
