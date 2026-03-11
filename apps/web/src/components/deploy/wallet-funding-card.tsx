"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createAirdropRequest } from "@superteam-lms/deploy";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const TARGET_SOL = 5;
const COOLDOWN_SECONDS = 15;

export function WalletFundingCard() {
  const t = useTranslations("deploy.walletFunding");
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [cooldown, setCooldown] = useState(0);
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
    } catch {
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection]);

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

  const progressPercent =
    balance !== null ? Math.min((balance / TARGET_SOL) * 100, 100) : 0;
  const isReady = balance !== null && balance >= TARGET_SOL - 0.5; // ~4.5 SOL is enough

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
                    balance !== null ? (TARGET_SOL - balance).toFixed(1) : "5",
                })}
          </p>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`text-sm ${
              message.type === "success"
                ? "text-green-500"
                : message.type === "warning"
                  ? "text-yellow-500"
                  : "text-red-500"
            }`}
          >
            <p>{message.text}</p>
            {message.type === "warning" && (
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
