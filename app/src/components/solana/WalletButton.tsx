"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { events } from "@/lib/analytics";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTranslations } from "next-intl";
import {
  Copy,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  User,
  Settings,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

function abbrev(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletButton({ className }: { className?: string }) {
  const { publicKey, disconnect, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const t = useTranslations("wallet");
  const { data: xpData } = useXpBalance();
  const profile = useProfile();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (connected) {
      events.walletConnect(wallet?.adapter.name ?? "unknown");
    }
  }, [connected, wallet]);

  const displayName =
    profile?.username ??
    profile?.display_name ??
    (publicKey ? abbrev(publicKey.toBase58()) : "");

  const handleCopy = useCallback(() => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [publicKey]);

  if (!connected || !publicKey) {
    return (
      <Button
        onClick={() => setVisible(true)}
        className={cn(
          "bg-accent text-black font-mono text-sm font-medium hover:bg-accent-dim transition-colors",
          className,
        )}
        size="sm"
      >
        <span className="mr-1.5">◎</span>
        {t("connect")}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "font-mono text-sm border-border hover:border-border-hover bg-card hover:bg-elevated",
            className,
          )}
        >
          <span className="text-accent mr-1.5">◎</span>
          {displayName}
          {xpData && (
            <span className="ml-2 text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
              {t("levelLabel")}
              {xpData.level}
            </span>
          )}
          <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-card border-border font-mono"
      >
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground mb-1">
            {t("connectedLabel")}
          </p>
          <p className="text-sm text-foreground break-all">
            {publicKey.toBase58().slice(0, 20)}...
          </p>
          {xpData && (
            <p className="text-xs text-accent mt-1">
              {xpData.balance.toLocaleString()} XP · Level {xpData.level}
            </p>
          )}
        </div>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={handleCopy}
          className="text-foreground focus:bg-elevated focus:text-foreground cursor-pointer"
        >
          <Copy className="mr-2 h-3.5 w-3.5" />
          {copied ? t("copied") : t("copyAddress")}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          asChild
          className="text-foreground focus:bg-elevated focus:text-foreground cursor-pointer"
        >
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
            {t("dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="text-foreground focus:bg-elevated focus:text-foreground cursor-pointer"
        >
          <Link href="/profile">
            <User className="mr-2 h-3.5 w-3.5" />
            {t("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="text-foreground focus:bg-elevated focus:text-foreground cursor-pointer"
        >
          <Link href="/certificates">
            <Award className="mr-2 h-3.5 w-3.5" />
            {t("certificates")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="text-foreground focus:bg-elevated focus:text-foreground cursor-pointer"
        >
          <Link href="/settings">
            <Settings className="mr-2 h-3.5 w-3.5" />
            {t("settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="text-[#FF4444] focus:bg-elevated focus:text-[#FF4444] cursor-pointer"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          {t("disconnect")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
