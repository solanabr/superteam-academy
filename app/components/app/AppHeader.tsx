"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { XpBadge } from "./XpBadge";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 bg-background px-3 sm:px-4 overflow-hidden">
      <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink-0">
        <Link href="/" className="md:hidden flex items-center gap-2 shrink-0 min-w-0">
          <Image
            src="/HORIZONTAL-LOGO/ST-DARK-GREEN-HORIZONTAL.png"
            alt="Superteam Academy"
            width={160}
            height={36}
            className="h-7 w-auto object-contain dark:hidden"
          />
          <Image
            src="/HORIZONTAL-LOGO/ST-OFF-WHITE-HORIZONTAL.png"
            alt="Superteam Academy"
            width={160}
            height={36}
            className="h-7 w-auto object-contain hidden dark:block"
          />
        </Link>
        <SidebarTrigger className="hidden md:flex -ml-1 shrink-0" />
      </div>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0 justify-end">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden size-9 shrink-0"
          onClick={toggleSidebar}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <div className="hidden md:flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <NotificationBell />
          <XpBadge />
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
