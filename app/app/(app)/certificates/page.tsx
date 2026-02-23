"use client";

import { Award, ExternalLink } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/app";
import { Button } from "@/components/ui/button";

export default function CertificatesPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Certificates"
                subtitle="Your on-chain credential NFTs"
            />

            <EmptyState
                icon={Award}
                title="No certificates yet"
                description="Complete courses and earn your first on-chain credential. Credentials are soulbound Metaplex Core NFTs that prove your skills."
                action={
                    <Button asChild variant="outline" size="sm">
                        <a href="/courses">Start Learning</a>
                    </Button>
                }
            />
        </div>
    );
}
