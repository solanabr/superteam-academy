"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { type WalletName } from "@solana/wallet-adapter-base";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { wallets, select, connecting } = useWallet();
  const t = useTranslations("wallet");

  const handleSelect = (walletName: WalletName) => {
    select(walletName);
    onOpenChange(false);
  };

  // Filter out non-Solana wallets (e.g. MetaMask) and deduplicate by name
  const NON_SOLANA_WALLETS = ["metamask", "coinbase wallet"];
  const seen = new Set<string>();
  const deduped = wallets.filter((w) => {
    const name = w.adapter.name.toLowerCase();
    if (NON_SOLANA_WALLETS.some((ns) => name.includes(ns))) return false;
    if (seen.has(w.adapter.name)) return false;
    seen.add(w.adapter.name);
    return true;
  });
  const installed = deduped.filter((w) => w.readyState === "Installed");
  const notInstalled = deduped.filter((w) => w.readyState !== "Installed");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("connectWallet")}</DialogTitle>
          <DialogDescription>{t("connectDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {installed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                {t("detected")}
              </p>
              {installed.map((wallet) => (
                <Button
                  key={wallet.adapter.name}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => handleSelect(wallet.adapter.name)}
                  disabled={connecting}
                >
                  {wallet.adapter.icon && (
                    <Image
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      width={24}
                      height={24}
                      className="rounded"
                    />
                  )}
                  {wallet.adapter.name}
                </Button>
              ))}
            </div>
          )}
          {notInstalled.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                {t("moreWallets")}
              </p>
              {notInstalled.slice(0, 3).map((wallet) => (
                <Button
                  key={wallet.adapter.name}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 opacity-60"
                  onClick={() => {
                    if (wallet.adapter.url)
                      window.open(wallet.adapter.url, "_blank");
                  }}
                >
                  {wallet.adapter.icon && (
                    <Image
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      width={24}
                      height={24}
                      className="rounded"
                    />
                  )}
                  {wallet.adapter.name}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {t("install")}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
