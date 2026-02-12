"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { WalletButton } from "@/components/auth/WalletButton";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export function Header(): JSX.Element {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

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

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          <WalletButton />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {open ? (
        <div className="border-t px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link href="/courses" className="text-sm" onClick={() => setOpen(false)}>
              {t("header.courses")}
            </Link>
            <Link href="/dashboard" className="text-sm" onClick={() => setOpen(false)}>
              {t("header.dashboard")}
            </Link>
            <Link href="/leaderboard" className="text-sm" onClick={() => setOpen(false)}>
              {t("header.leaderboard")}
            </Link>
          </nav>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      ) : null}
    </header>
  );
}
