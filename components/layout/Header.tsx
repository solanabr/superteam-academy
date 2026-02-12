"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { WalletButton } from "@/components/auth/WalletButton";
import { useI18n } from "@/lib/i18n/provider";

export function Header(): JSX.Element {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-semibold">
          {t("common.brand")}
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">
            {t("header.courses")}
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            {t("header.dashboard")}
          </Link>
          <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground">
            {t("header.leaderboard")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
