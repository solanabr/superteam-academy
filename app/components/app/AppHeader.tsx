"use client";

import { ThemeToggle } from "./ThemeToggle";
import { XpBadge } from "./XpBadge";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/Logo";

export function AppHeader() {
    return (
        <header className="sticky top-0 z-50 flex  h-18 items-center justify-between gap-4 bg-zinc-900 px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Logo />
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <XpBadge />
                <WalletConnectButton />
            </div>
        </header>
    );
}
