"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { WalletButton } from "@/components/solana/WalletButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { key: "courses" as const, href: "/courses" },
  { key: "leaderboard" as const, href: "/leaderboard" },
  { key: "community" as const, href: "/community" },
  { key: "dashboard" as const, href: "/dashboard" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wider">
          <span className="text-[#14F195] text-base">◎</span>
          <span className="text-foreground">ACADEMY</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-mono transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-foreground bg-elevated"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <WalletButton className="hidden sm:flex" />

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 rounded text-sm font-mono transition-colors",
                pathname === href
                  ? "text-foreground bg-elevated"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(key)}
            </Link>
          ))}
          <div className="pt-2">
            <WalletButton className="w-full" />
          </div>
        </div>
      )}
    </header>
  );
}
