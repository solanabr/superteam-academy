"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createAirdropRequest } from "@superteam-lms/deploy";
import { useTranslations } from "next-intl";
import { useDeploySigner } from "@/hooks/use-deploy-signer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const TARGET_SOL = 5;
const COOLDOWN_SECONDS = 15;

interface WalletFundingCardProps {
  /**
   * What a pending deploy needs, in lamports. When set, the card measures
   * progress against this figure instead of the standalone 5 SOL target — the
   * deploy panel's inline funding gate passes the estimate it computed.
   */
  requiredLamports?: number;
  /** Every balance read, so a parent gate can re-evaluate without polling. */
  onBalance?: (lamports: number) => void;
}

export function WalletFundingCard({
  requiredLamports,
  onBalance,
}: WalletFundingCardProps = {}) {
  const t = useTranslations("deploy.walletFunding");
  // Extension or embedded — an embedded learner has no wallet-adapter key and
  // is exactly who arrives here with zero SOL.
  const { signer } = useDeploySigner();
  const publicKey = signer?.publicKey ?? null;
  const { connection } = useConnection();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [addressCopied, setAddressCopied] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "warning" | "error";
  } | null>(null);
  const airdropRef = useRef(false);

  // Fetch balance on mount and after airdrop
  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connection) return;
    setIsLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setBalance(lamports / LAMPORTS_PER_SOL);
      onBalance?.(lamports);
    } catch {
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, onBalance]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleAirdrop = async () => {
    if (!publicKey || !connection || isAirdropping || cooldown > 0) return;
    if (airdropRef.current) return;
    airdropRef.current = true;
    setIsAirdropping(true);
    setMessage(null);

    const result = await createAirdropRequest(connection, publicKey, 2);

    if (result.success) {
      setBalance(result.newBalance ?? balance);
      if (result.newBalance !== undefined) {
        onBalance?.(Math.round(result.newBalance * LAMPORTS_PER_SOL));
      }
      setMessage({
        text: t("airdropSuccess", { amount: "2" }),
        type: "success",
      });
      setCooldown(COOLDOWN_SECONDS);
    } else if (result.rateLimited) {
      setMessage({
        text: t("rateLimitedWithFaucet"),
        type: "warning",
      });
      setCooldown(60);
    } else {
      setMessage({
        text: result.error ?? t("networkError"),
        type: "error",
      });
    }

    airdropRef.current = false;
    setIsAirdropping(false);
  };

  const handleCopyAddress = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  };

  // Not connected state
  if (!publicKey) {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">{t("connectWallet")}</p>
        </CardContent>
      </Card>
    );
  }

  // With a deploy estimate in hand, "enough" is that estimate — not a flat
  // 5 SOL that is both too much for a small program and no guarantee for a
  // large one.
  const targetSol =
    requiredLamports !== undefined
      ? requiredLamports / LAMPORTS_PER_SOL
      : TARGET_SOL;
  const progressPercent =
    balance !== null ? Math.min((balance / targetSol) * 100, 100) : 0;
  const isReady =
    balance !== null &&
    (requiredLamports !== undefined
      ? balance >= targetSol
      : balance >= TARGET_SOL - 0.5); // ~4.5 SOL is enough

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {/* Wallet icon */}
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
            />
          </svg>
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet address and balance */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-muted-foreground">
            {publicKey.toBase58().slice(0, 4)}...
            {publicKey.toBase58().slice(-4)}
          </span>
          <span className="font-semibold">
            {t("balance")}:{" "}
            {balance !== null ? `${balance.toFixed(2)} SOL` : "..."}
          </span>
        </div>

        {/* Progress toward target */}
        <div className="space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-right text-xs text-muted-foreground">
            {isReady
              ? t("readyForDeploy")
              : t("needMoreSol", {
                  amount:
                    balance !== null
                      ? (targetSol - balance).toFixed(2)
                      : targetSol.toFixed(2),
                })}
          </p>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`text-sm ${
              message.type === "success"
                ? "text-success"
                : message.type === "warning"
                  ? "text-yellow-500"
                  : "text-red-500"
            }`}
          >
            <p>{message.text}</p>
            {message.type === "warning" && (
              <>
                <p className="mt-1">
                  {t("faucetHint")}{" "}
                  <a
                    href="https://faucet.solana.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-yellow-400"
                  >
                    faucet.solana.com
                  </a>
                </p>
                {/* The faucet asks for an address. An embedded wallet has no
                    extension UI to read one out of, so hand it over here. */}
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="bg-muted/50 mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left font-mono text-xs text-foreground transition-colors hover:bg-muted"
                >
                  <span className="flex-1 truncate">
                    {publicKey.toBase58()}
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {addressCopied ? t("addressCopied") : t("copyAddress")}
                  </span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAirdrop}
            disabled={isAirdropping || cooldown > 0}
            className="flex-1"
            variant={isReady ? "outline" : "default"}
          >
            {isAirdropping
              ? t("requesting")
              : cooldown > 0
                ? `${t("requestAirdrop")} (${cooldown}s)`
                : t("requestAirdrop")}
          </Button>
          <Button
            onClick={refreshBalance}
            disabled={isLoading}
            variant="outline"
            size="icon"
          >
            {/* Refresh icon */}
            <svg
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            <span className="sr-only">{t("refreshBalance")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
