"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

function isDevnetEndpoint(url: string): boolean {
  return (
    url.includes("devnet") ||
    url.includes("localhost") ||
    url.includes("127.0.0.1")
  );
}

export function DevnetWarning() {
  const { connected } = useWallet();
  const { connection } = useConnection();
  const t = useTranslations("SystemBanners");

  const showWarning = connected && !isDevnetEndpoint(connection.rpcEndpoint);
  if (!showWarning) return null;

  return (
    <div
      className="text-sm text-center py-2 px-4 font-medium"
      style={{
        background: "rgba(251,191,36,0.1)",
        borderBottom: "1px solid rgba(251,191,36,0.25)",
        color: "#fbbf24",
      }}
    >
      {t("wrongNetworkPrefix")} <strong>{t("devnet")}</strong>
    </div>
  );
}

export function FaucetBanner() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const t = useTranslations("SystemBanners");

  const { data: lamports } = useQuery({
    queryKey: ["sol-balance", publicKey?.toBase58()],
    queryFn: () => connection.getBalance(publicKey!),
    enabled: connected && !!publicKey,
    staleTime: 30_000,
  });

  if (!connected || lamports === undefined || lamports >= 10_000_000) {
    return null;
  }

  return (
    <div
      className="text-sm text-center py-2 px-4"
      style={{
        background: "rgba(84,151,213,0.08)",
        borderBottom: "1px solid rgba(84,151,213,0.2)",
        color: "var(--solana-blue, #5497d5)",
      }}
    >
      {t("lowSolPrefix")}{" "}
      <a
        href="https://faucet.solana.com"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-semibold"
      >
        {t("faucetCta")}</a>
    </div>
  );
}
