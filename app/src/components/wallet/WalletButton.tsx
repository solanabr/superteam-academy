"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Copy, Check, User, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { trackWalletConnect } from "@/lib/analytics/events";

export function WalletButton() {
  const t = useTranslations("common");
  const { publicKey, disconnect, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const prevConnected = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (connected && !prevConnected.current && wallet) {
      trackWalletConnect(wallet.adapter.name);
    }
    prevConnected.current = connected;
  }, [connected, wallet]);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  if (!connected || !publicKey) {
    return (
      <Button
        onClick={() => setVisible(true)}
        variant="outline"
        className="gap-2 border-primary/50 hover:border-primary"
        aria-label={t("connectWallet")}
      >
        <Wallet className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t("connectWallet")}</span>
      </Button>
    );
  }

  const address = publicKey.toBase58();

  const copyAddress = () => {
    navigator.clipboard.writeText(address).catch(() => {});
    clearTimeout(copyTimerRef.current);
    setCopied(true);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/50" aria-label={`${t("walletOptions")} ${address.slice(0, 4)}...${address.slice(-4)}`}>
          <Wallet className="h-4 w-4" aria-hidden="true" />
          {`${address.slice(0, 4)}...${address.slice(-4)}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copyAddress}>
          {copied ? (
            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {copied ? t("copied") : t("copyAddress")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Link href="/profile">
          <DropdownMenuItem>
            <User className="h-4 w-4 mr-2" aria-hidden="true" />
            {t("profile")}
          </DropdownMenuItem>
        </Link>
        <Link href="/settings">
          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
            {t("settings")}
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => disconnect()}>
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("disconnect")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
