"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Wallet, X } from "lucide-react";

/**
 * Site-wide banner shown to logged-in users whose profile has no wallet linked.
 * Dismissible per session — reappears on next page load.
 */
export function WalletLinkBanner() {
    const { data: session } = useSession();
    const [dismissed, setDismissed] = useState(false);

    const sessionData = session as unknown as Record<string, unknown> | null;
    const walletAddress = sessionData?.walletAddress as string | undefined;

    // Only show for signed-in users without a linked wallet
    if (!session?.user || walletAddress || dismissed) return null;

    return (
        <div className="border-b border-amber-500/30 bg-amber-500/10">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex flex-1 flex-col items-center gap-1 text-center text-sm sm:flex-row sm:justify-center sm:gap-2">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Wallet className="h-4 w-4 shrink-0 text-amber-500" />
                        Link a wallet to enroll in courses and earn on-chain credentials.
                    </span>
                    <Link
                        href="/settings"
                        className="font-medium text-amber-600 hover:text-amber-500 hover:underline dark:text-amber-400 dark:hover:text-amber-300"
                    >
                        Settings → Account →
                    </Link>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
