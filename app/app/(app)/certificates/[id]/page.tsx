"use client";

import { use } from "react";
import Image from "next/image";
import {
    Award,
    ExternalLink,
    CheckCircle2,
    Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app";
import { useCredentialAsset } from "@/hooks/useCredentials";

const cluster = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";

function parseAttributes(
  attrs: Array<{ key: string; value: string }> | Record<string, string> | undefined
): Record<string, string> {
  if (!attrs) return {};
  if (Array.isArray(attrs)) return Object.fromEntries(attrs.map((a) => [a.key, a.value]));
  return attrs as Record<string, string>;
}

export default function CertificateDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { data: asset, isLoading } = useCredentialAsset(id);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Certificate" subtitle="On-chain credential verification" />
                <Card className="mx-auto max-w-lg p-8">
                    <div className="h-8 w-48 animate-pulse rounded bg-muted mx-auto" />
                </Card>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="space-y-6">
                <PageHeader title="Certificate" subtitle="On-chain credential verification" />
                <Card className="mx-auto max-w-lg p-8 text-center">
                    <p className="text-muted-foreground">Credential not found or verification is not configured.</p>
                    <p className="text-sm text-muted-foreground mt-2 font-mono break-all">{id}</p>
                    <Button asChild variant="outline" className="mt-4">
                        <a href={`https://explorer.solana.com/address/${id}?cluster=${cluster}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on Explorer
                        </a>
                    </Button>
                </Card>
            </div>
        );
    }

    const attrs = parseAttributes(asset.content?.metadata?.attributes);
    const name = asset.content?.metadata?.name ?? "Course Credential";
    const imageUrl = asset.content?.links?.image;

    return (
        <div className="space-y-6">
            <PageHeader title="Certificate" subtitle="On-chain credential verification" />

            <Card className="mx-auto max-w-lg p-8 text-center">
                {imageUrl ? (
                    <div className="mx-auto mb-4 relative w-20 h-20 rounded-full overflow-hidden bg-muted">
                        <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
                    </div>
                ) : (
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                        <Award className="h-10 w-10 text-primary" />
                    </div>
                )}

                <h2 className="mb-1 text-xl font-bold">{name}</h2>
                <p className="mb-4 text-sm text-muted-foreground font-mono break-all">{id}</p>

                <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm">
                    {attrs.track_id != null && (
                        <Badge variant="outline">Track {attrs.track_id}</Badge>
                    )}
                    {attrs.level != null && (
                        <Badge variant="outline">Level {attrs.level}</Badge>
                    )}
                    {attrs.courses_completed != null && (
                        <Badge variant="outline">{attrs.courses_completed} courses</Badge>
                    )}
                    {attrs.total_xp != null && (
                        <Badge variant="outline">{Number(attrs.total_xp).toLocaleString()} XP</Badge>
                    )}
                </div>

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
                            href={`https://explorer.solana.com/address/${id}?cluster=${cluster}`}
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
