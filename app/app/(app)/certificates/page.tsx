"use client";

import { Award } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/app";
import { Button } from "@/components/ui/button";

export default function CertificatesPage() {
    return (
        <div className="space-y-6 p-10 md:px-12">
            <PageHeader
                title="Certificates"
                subtitle="Your on-chain credential NFTs"
            />

            <EmptyState
                icon={Award}
                title="No certificates yet"
                description="Complete courses and earn your first on-chain credential. Credentials are soulbound Metaplex Core NFTs that prove your skills."
                action={
                    <Button asChild variant="pixel" size="lg" className="font-game text-xl">
                        <a href="/courses">Start Learning</a>
                    </Button>
                }
            />
        </div>
    );
}
