"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createAirdropRequest } from "@superteam-lms/deploy";
import { useTranslations } from "next-intl";
import { ArrowClockwise, Wallet } from "@phosphor-icons/react";
import {
  toFriendlyError,
  type FriendlyError,
} from "@/lib/deploy/friendly-error";
import { useDeploySigner } from "@/hooks/use-deploy-signer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DeployErrorNotice } from "./deploy-error-notice";

const TARGET_SOL = 5;
const COOLDOWN_SECONDS = 15;
const FAUCET_URL = "https://faucet.solana.com";

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
  // `refreshBalance` runs from an effect keyed on itself, so the key it closes
  // over has to be referentially stable or the card polls `getBalance` forever.
  // Re-deriving it from the address means a future caller cannot re-break this
  // by handing the card a freshly-parsed `PublicKey` each render.
  const address = signer?.publicKey?.toBase58() ?? null;
  const publicKey = useMemo(
    () => (address ? new PublicKey(address) : null),
    [address]
  );
  const { connection } = useConnection();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  // The faucet's failure, already translated into something to do about it —
  // a raw 403 JSON body never reaches the learner (#1228 follow-up).
  const [airdropError, setAirdropError] = useState<FriendlyError | null>(null);
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
    setToast(null);
    setAirdropError(null);

    // No `connection` argument: the airdrop goes to the PUBLIC devnet RPC,
    // whose limit is per address, while the app's keyed endpoint meters the
    // faucet per project — one learner's 2 SOL used to exhaust everyone's day.
    const result = await createAirdropRequest(publicKey, 2);

    if (result.success) {
      setBalance(result.newBalance ?? balance);
      if (result.newBalance !== undefined) {
        onBalance?.(Math.round(result.newBalance * LAMPORTS_PER_SOL));
      }
      setToast(t("airdropSuccess", { amount: "2" }));
      setCooldown(COOLDOWN_SECONDS);
    } else {
      setAirdropError(
        toFriendlyError(
          result.rateLimited ? "rate limited" : (result.error ?? ""),
          { source: "airdrop", retryAfterSeconds: result.retryAfterSeconds }
        )
      );
      if (result.rateLimited) setCooldown(result.retryAfterSeconds ?? 60);
    }

    airdropRef.current = false;
    setIsAirdropping(false);
  };

  const handleOpenFaucet = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setToast(t("faucetToast"));
    } catch {
      // clipboard API unavailable — the faucet still opens
    }
    window.open(FAUCET_URL, "_blank", "noopener,noreferrer");
  };

  // Not connected state
  if (!publicKey) {
    return (
      <Card className="border-2 border-[color:var(--ink-line)]">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-text-2">{t("connectWallet")}</p>
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
  const shortfall =
    balance !== null ? Math.max(targetSol - balance, 0) : targetSol;

  return (
    <Card className="border-2 border-[color:var(--ink-line)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet size={20} weight="duotone" aria-hidden="true" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-mono text-xs text-text-3">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </p>

        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wide text-text-3">
              {t("required")}
            </dt>
            <dd className="font-semibold">{targetSol.toFixed(2)} SOL</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wide text-text-3">
              {t("balance")}
            </dt>
            <dd className="font-semibold">
              {balance !== null ? `${balance.toFixed(2)} SOL` : "…"}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-wide text-text-3">
              {t("shortfall")}
            </dt>
            <dd className="font-semibold">{shortfall.toFixed(2)} SOL</dd>
          </div>
        </dl>

        <div className="space-y-1">
          <Progress value={progressPercent} className="h-2" />
          {/* "Ready" is a claim about the balance, so it only appears when the
              balance actually covers the deploy — never above an error. */}
          {isReady && (
            <p className="text-right text-xs font-semibold text-success">
              {t("readyForDeploy")}
            </p>
          )}
        </div>

        {airdropError && <DeployErrorNotice error={airdropError} />}

        {toast && (
          <p role="status" aria-live="polite" className="text-sm text-success">
            {toast}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleAirdrop}
            disabled={isAirdropping || cooldown > 0}
            className="flex-1"
            variant={isReady ? "outline" : "default"}
          >
            {isAirdropping
              ? t("requesting")
              : cooldown > 0
                ? t("cooldown", { seconds: String(cooldown) })
                : t("requestAirdrop")}
          </Button>
          <Button onClick={handleOpenFaucet} variant="outline">
            {t("openFaucet")}
          </Button>
          <Button
            onClick={refreshBalance}
            disabled={isLoading}
            variant="outline"
            size="icon"
            aria-label={t("refreshBalance")}
          >
            <ArrowClockwise
              size={16}
              className={isLoading ? "animate-spin" : undefined}
              aria-hidden="true"
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
