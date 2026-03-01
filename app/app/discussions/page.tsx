"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { AppShell } from "@/components/app/AppShell";
import { DiscussionsListContent } from "@/components/app/DiscussionsListContent";

/**
 * Public discussions at /discussions.
 * When logged in: sidebar + app header (no top navbar).
 * When logged out: top navbar only (like public profile). Participation (new thread / reply) requires wallet.
 */
export default function DiscussionsPage() {
    const { connected } = useWallet();

    if (connected) {
        return (
            <AppShell>
                <DiscussionsListContent />
            </AppShell>
        );
    }

    return <DiscussionsListContent />;
}
