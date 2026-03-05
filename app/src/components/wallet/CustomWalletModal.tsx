"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useWallet, type Wallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronDown, ExternalLink, Loader2 } from "lucide-react";

interface CustomWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomWalletModal({ open, onOpenChange }: CustomWalletModalProps) {
  const t = useTranslations("wallet");
  const tc = useTranslations("common");
  const { wallets, select, connect, connecting } = useWallet();
  const [showMore, setShowMore] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  const [detected, notDetected] = useMemo(() => {
    const installed: Wallet[] = [];
    const rest: Wallet[] = [];
    for (const w of wallets) {
      if (w.readyState === WalletReadyState.Installed) {
        installed.push(w);
      } else if (w.readyState !== WalletReadyState.Unsupported) {
        rest.push(w);
      }
    }
    return [installed, rest];
  }, [wallets]);

  const handleSelect = useCallback(
    async (wallet: Wallet) => {
      try {
        setConnectingWallet(wallet.adapter.name);
        sessionStorage.setItem("wallet_signin_pending", "1");
        select(wallet.adapter.name);
        // autoConnect is off, so select() alone won't trigger connect().
        // Explicitly connect after selecting the adapter.
        await connect();
        onOpenChange(false);
      } catch {
        // User rejected or wallet error — clear the pending flag
        sessionStorage.removeItem("wallet_signin_pending");
      } finally {
        setConnectingWallet(null);
      }
    },
    [select, connect, onOpenChange]
  );

  const isLoading = connecting || connectingWallet !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={tc("close")}
        className="sm:max-w-[420px] overflow-hidden border-0 p-0"
        style={{
          background:
            "linear-gradient(135deg, #0a2e1a 0%, #1a3a2a 50%, #0d2418 100%)",
          border: "1px solid rgba(20, 241, 149, 0.15)",
          boxShadow:
            "0 0 60px rgba(20, 241, 149, 0.08), 0 25px 50px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2"
          style={{
            width: "300px",
            height: "200px",
            background:
              "radial-gradient(ellipse, rgba(20, 241, 149, 0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 px-8 py-8">
          {/* Logo */}
          <div className="mb-5 flex justify-center">
            <Image
              src="/superteam-brasil.png"
              alt="Superteam Brasil"
              width={64}
              height={64}
              className="rounded-xl"
            />
          </div>

          <DialogHeader className="mb-6 text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">
              {t("connectTitle")}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-[#a3b8a8]">
              {t("connectSubtitle")}
            </DialogDescription>
          </DialogHeader>

          {/* Detected wallets */}
          <div className="space-y-2">
            {detected.length === 0 && (
              <p className="py-4 text-center text-sm text-[#6b8a6f]">
                {t("noWalletsDetected")}
              </p>
            )}

            {detected.map((wallet) => (
              <WalletRow
                key={wallet.adapter.name}
                wallet={wallet}
                badge={t("detected")}
                loading={connectingWallet === wallet.adapter.name || (connecting && connectingWallet === wallet.adapter.name)}
                disabled={isLoading}
                onClick={() => handleSelect(wallet)}
              />
            ))}
          </div>

          {/* More options */}
          {notDetected.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-medium tracking-wide text-[#6b8a6f] transition-colors hover:text-[#a3b8a8]"
              >
                {t("moreOptions")} ({notDetected.length})
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showMore ? "rotate-180" : ""}`}
                />
              </button>

              {showMore && (
                <div className="mt-1 space-y-2">
                  {notDetected.map((wallet) => (
                    <WalletInstallRow
                      key={wallet.adapter.name}
                      wallet={wallet}
                      installLabel={t("install")}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-[#6b8a6f]">
            {t("poweredBySolana")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */

function WalletRow({
  wallet,
  badge,
  loading,
  disabled,
  onClick,
}: {
  wallet: Wallet;
  badge: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
      style={{
        background: "rgba(20, 241, 149, 0.04)",
        border: "1px solid rgba(20, 241, 149, 0.12)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={wallet.adapter.icon}
        alt={wallet.adapter.name}
        width={36}
        height={36}
        className="rounded-lg"
      />
      <div className="flex-1">
        <span className="text-sm font-semibold text-white">
          {wallet.adapter.name}
        </span>
      </div>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-[#14F195]" />
      ) : (
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: "rgba(20, 241, 149, 0.12)",
            color: "#14F195",
            border: "1px solid rgba(20, 241, 149, 0.2)",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function WalletInstallRow({
  wallet,
  installLabel,
}: {
  wallet: Wallet;
  installLabel: string;
}) {
  return (
    <a
      href={wallet.adapter.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={wallet.adapter.icon}
        alt={wallet.adapter.name}
        width={36}
        height={36}
        className="rounded-lg opacity-60"
      />
      <div className="flex-1">
        <span className="text-sm font-medium text-[#a3b8a8]">
          {wallet.adapter.name}
        </span>
      </div>
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#6b8a6f]">
        {installLabel}
        <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}
