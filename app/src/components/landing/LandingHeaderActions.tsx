"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Link } from "@/i18n/routing";
import { WalletButton } from "@/components/auth/WalletButton";

export function LandingHeaderActions() {
    const { ready, authenticated } = usePrivy();

    return (
        <div className="flex items-center gap-6">
            {ready && authenticated && (
                <Link
                    href="/dashboard"
                    className="font-code text-xs font-medium uppercase tracking-wider text-text-muted hover:text-solana transition-colors"
                >
                    Dashboard
                </Link>
            )}
            <WalletButton className="font-code text-xs font-medium uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10" />
        </div>
    );
}
