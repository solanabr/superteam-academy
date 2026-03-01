"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { AppShell } from "@/components/app/AppShell";
import { DiscussionThreadContent } from "@/components/app/DiscussionThreadContent";

/**
 * Public discussion thread at /discussions/[id].
 * When logged in: sidebar + app header. When logged out: top navbar only.
 * Posting a reply requires wallet (gated in DiscussionThreadContent).
 */
export default function DiscussionThreadPage() {
    const { connected } = useWallet();

    if (connected) {
        return (
            <AppShell>
                <DiscussionThreadContent />
            </AppShell>
        );
    }

    return <DiscussionThreadContent />;
}
