"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@/components/wallet/CustomWalletModalProvider";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { SOLANA_NETWORK } from "@/lib/solana/constants";
import { useWalletAutoSignIn } from "@/hooks/useWalletAutoSignIn";

const IS_DEVNET = SOLANA_NETWORK === "devnet";

export function WalletButton() {
  const t = useTranslations("common");
  const { publicKey, disconnect, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);
  const prevConnected = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Bridge wallet connection ↔ NextAuth session
  useWalletAutoSignIn();

  useEffect(() => {
    if (connected && !prevConnected.current && wallet) {
      trackWalletConnect(wallet.adapter.name);
    }
    prevConnected.current = connected;
  }, [connected, wallet]);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  // Resolve the display address: prefer live wallet adapter, fall back to session
  const adapterAddress = connected && publicKey ? publicKey.toBase58() : null;
  const sessionWalletAddress = session?.user?.walletAddress ?? null;
  const address = adapterAddress ?? sessionWalletAddress;

  if (!address) {
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

  const copyAddress = () => {
    navigator.clipboard.writeText(address).catch(() => {});
    clearTimeout(copyTimerRef.current);
    setCopied(true);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem("wallet_signin_pending");
    if (connected) {
      // Wallet adapter is live — disconnect triggers signOut via useWalletAutoSignIn
      void disconnect();
    } else {
      // Session-only state (adapter disconnected after reload) — sign out directly
      void signOut({ callbackUrl: "/" });
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {IS_DEVNET && (
        <Badge
          variant="outline"
          className="hidden sm:flex h-6 border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-[10px] font-semibold uppercase tracking-wider px-1.5"
          aria-label={t("devnetBadge")}
        >
          {t("devnetBadge")}
        </Badge>
      )}
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
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}
