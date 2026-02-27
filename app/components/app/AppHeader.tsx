"use client";

import { ThemeToggle } from "./ThemeToggle";
import { XpBadge } from "./XpBadge";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AppHeader() {
    return (
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-2 bg-background px-3 sm:px-4">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <SidebarTrigger className="-ml-1 shrink-0" />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0 justify-end">
                <LanguageSwitcher />
                <ThemeToggle />
                <XpBadge />
                <WalletConnectButton />
            </div>
        </header>
    );
}
