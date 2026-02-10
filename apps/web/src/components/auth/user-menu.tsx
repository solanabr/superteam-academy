"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  username: string;
  avatarUrl: string | null;
  walletAddress: string | null;
  locale: string;
}

export function UserMenu({
  username,
  avatarUrl,
  walletAddress,
  locale,
}: UserMenuProps) {
  const tCommon = useTranslations("common");
  const [copied, setCopied] = useState(false);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  }, [locale]);

  const handleCopyAddress = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!walletAddress) return;
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    [walletAddress]
  );

  const initials = username.slice(0, 2).toUpperCase();
  const truncatedWallet = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex h-10 items-center gap-0 rounded-full border-[2.5px] border-border bg-card transition-all hover:border-border-hover hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={username}
        >
          {/* Avatar — left side of pill */}
          <Avatar className="-ml-px h-9 w-9 shrink-0">
            <AvatarImage src={avatarUrl ?? undefined} alt={username} />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>

          {/* Wallet address — right side of pill */}
          {truncatedWallet && (
            <div className="flex items-center pl-1.5 pr-3">
              <span className="font-mono text-xs font-medium text-text-2">
                {truncatedWallet}
              </span>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* User info header */}
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={avatarUrl ?? undefined} alt={username} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col leading-none">
            <p className="truncate font-medium">{username}</p>
            {truncatedWallet && (
              <button
                onClick={handleCopyAddress}
                className="mt-1 flex items-center gap-1 font-mono text-xs text-text-3 transition-colors hover:text-text-2"
                title={walletAddress ?? ""}
              >
                {truncatedWallet}
                {copied ? (
                  <Check
                    size={10}
                    weight="bold"
                    className="shrink-0 text-success"
                  />
                ) : (
                  <Copy size={10} weight="bold" className="shrink-0" />
                )}
              </button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          {tCommon("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
