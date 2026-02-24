"use client";

import { ThemeToggle } from "./ThemeToggle";
import { XpBadge } from "./XpBadge";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { Logo } from "@/components/Logo";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <span className="lg:hidden">
                    <Logo />
                </span>
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <XpBadge />
                <WalletConnectButton />
            </div>
        </header>
    );
}
