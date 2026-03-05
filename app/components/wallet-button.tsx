"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, User, Settings, LayoutDashboard, Trophy, ChevronDown } from "lucide-react";

function truncateAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function WalletButton() {
    const { publicKey, disconnect, connecting } = useWallet();
    const { setVisible } = useWalletModal();
    const t = useTranslations("Header");

    if (connecting) {
        return (
            <Button
                size="sm"
                disabled
                className="rounded-full bg-gradient-to-r from-solana-purple to-solana-green px-5 font-semibold text-white"
            >
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                Connecting...
            </Button>
        );
    }

    if (!publicKey) {
        return (
            <Button
                size="sm"
                onClick={() => setVisible(true)}
                className="rounded-full bg-gradient-to-r from-solana-purple to-solana-green px-5 font-semibold text-white shadow-lg shadow-solana-purple/20 transition-all hover:shadow-xl hover:shadow-solana-purple/30 hover:brightness-110"
            >
                <Wallet className="mr-2 h-4 w-4" />
                {t("connectWallet")}
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full gap-2 border-solana-purple/20 hover:border-solana-purple/40"
                >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-solana-purple to-solana-green">
                        <span className="text-[10px] font-bold text-white">
                            {publicKey.toBase58()[0]}
                        </span>
                    </div>
                    <span className="font-mono text-xs">{truncateAddress(publicKey.toBase58())}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/leaderboard" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Leaderboard
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => disconnect()}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
