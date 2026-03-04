"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { WalletButton } from "@/components/wallet/WalletButton";
import { SignInButton } from "@/components/auth/SignInButton";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Search, Sparkles } from "lucide-react";
import { CommandPalette } from "@/components/search/CommandPalette";
import { NavGamification } from "@/components/layout/NavGamification";

export function Header() {
  const tc = useTranslations("common");
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      role="banner"
      className="sticky top-0 z-30 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl"
    >
      <div className="flex h-12 items-center justify-between px-4">
        {/* Mobile logo — only visible on <md where sidebar is hidden */}
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/80 to-secondary/60 shadow-lg shadow-primary/25">
            <Sparkles className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            <span className="text-foreground">Super</span>
            <span className="gradient-text">team</span>
          </span>
        </Link>

        {/* Desktop: empty spacer since sidebar has the logo */}
        <div className="hidden md:block" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Gamification Stats */}
          <NavGamification />

          {/* Mobile search */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label={tc("search")}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Auth — SignInButton handles both authenticated and unauthenticated states */}
          <SignInButton />

          {/* Wallet */}
          <WalletButton />
        </div>
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
