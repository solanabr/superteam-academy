"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";

// Inlined so this layout-mounted component doesn't pull @solana/web3.js into
// the shared client chunk for one plain constant (#1090).
const LAMPORTS_PER_SOL = 1_000_000_000;
const LOW_SOL_THRESHOLD = 0.001;
const POLL_INTERVAL_MS = 30_000;

const IS_DEVNET =
  process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet" ||
  process.env.NEXT_PUBLIC_SOLANA_NETWORK === "testnet";

export function LowSolBanner() {
  const t = useTranslations("nav");
  // Mounted inside the (platform) provider stack since #1097 (it moved out of
  // the global Header, which no longer has wallet providers above it), so
  // these hooks always resolve against the live stack.
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connection) return;
    try {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    // The banner only ever renders on devnet/testnet for a connected wallet —
    // don't poll the RPC when it can't show (mainnet polled forever, #1090).
    if (!IS_DEVNET || !publicKey) return;
    fetchBalance();
    const interval = setInterval(fetchBalance, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [publicKey, fetchBalance]);

  useEffect(() => {
    setDismissed(false);
  }, [publicKey]);

  if (
    !IS_DEVNET ||
    !publicKey ||
    balance === null ||
    balance >= LOW_SOL_THRESHOLD ||
    dismissed
  ) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-1 text-center text-[13px] text-yellow-400">
      <span>
        {t("lowSolBalance")}{" "}
        <a
          href="https://faucet.solana.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2 transition-colors hover:text-yellow-300"
        >
          {t("getDevnetSol")}
        </a>
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 rounded p-0.5 text-yellow-400/60 transition-opacity hover:text-yellow-400"
        aria-label={t("dismissBanner")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
