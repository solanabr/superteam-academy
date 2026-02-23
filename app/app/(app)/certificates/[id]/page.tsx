"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import {
    Award,
    ExternalLink,
    CheckCircle2,
    Sparkles,
    BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app";

export default function CertificateDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    // Placeholder — will be populated with real credential data later
    return (
        <div className="space-y-6">
            <PageHeader
                title="Certificate"
                subtitle="On-chain credential verification"
            />

            <Card className="mx-auto max-w-lg p-8 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-10 w-10 text-primary" />
                </div>

                <h2 className="mb-1 text-xl font-bold">Course Credential</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                    Asset: {id}
                </p>

                <div className="mb-6 flex items-center justify-center gap-3">
                    <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        Soulbound
                    </Badge>
                </div>

                <div className="space-y-2">
                    <Button asChild variant="outline" className="w-full">
                        <a
                            href={`https://explorer.solana.com/address/${id}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on Explorer
                        </a>
                    </Button>
                </div>
            </Card>
        </div>
    );
}
