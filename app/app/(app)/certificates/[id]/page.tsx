"use client";

import { use } from "react";
import Link from "next/link";
import {
    ExternalLink,
    CheckCircle2,
    Sparkles,
    Copy,
    User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app";
import { CredentialImage } from "@/components/app/CredentialImage";
import { useCredentialAsset, useTrackImageMap } from "@/hooks";
import { toast } from "sonner";

const cluster = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";

function truncateAddress(addr: string): string {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

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
    const trackImageMap = useTrackImageMap();

    if (isLoading) {
        return (
            <div className="max-w-xl mx-auto w-full space-y-6">
                <PageHeader title="Certificate" subtitle="On-chain credential verification" />
                <Card className="p-8">
                    <div className="h-8 w-48 animate-pulse rounded bg-muted mx-auto" />
                </Card>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="max-w-xl mx-auto w-full space-y-6">
                <PageHeader title="Certificate" subtitle="On-chain credential verification" />
                <Card className="p-8 text-center">
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
    const metadataUri =
      asset.content?.metadata?.uri ??
      asset.content?.json_uri ??
      (asset as { uri?: string }).uri;
    const trackId = attrs.track_id != null ? parseInt(String(attrs.track_id), 10) : 0;
    const owner = (asset as { ownership?: { owner?: string } }).ownership?.owner;
    const collection = (asset as { grouping?: Array<{ group_key: string; group_value: string }> }).grouping?.find(
      (g) => g.group_key === "collection"
    )?.group_value;

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    };

    return (
        <div className="max-w-xl mx-auto w-full space-y-6">
            <PageHeader title="Certificate" subtitle="On-chain credential verification" />

            <Card className="p-8 text-center">
                <div className="mx-auto mb-4 flex justify-center">
                    <CredentialImage
                        imageUrl={imageUrl}
                        metadataUri={metadataUri}
                        fallbackImageUrl={trackImageMap[trackId]}
                        size="lg"
                    />
                </div>

                <h2 className="mb-4 text-xl font-bold">{name}</h2>

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

                {(owner || collection || id) && (
                    <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4 text-left space-y-3">
                        <h3 className="font-game text-sm font-medium text-muted-foreground">
                            Details
                        </h3>
                        {owner && (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Owner</span>
                                </div>
                                <div className="flex items-center gap-1 min-w-0">
                                    <Link
                                        href={`/profile/${owner}`}
                                        className="font-mono text-sm text-yellow-400 hover:underline truncate"
                                    >
                                        {truncateAddress(owner)}
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(owner, "Owner")}
                                        className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                                        title="Copy"
                                    >
                                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        )}
                        {collection && (
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-muted-foreground shrink-0">
                                    Collection
                                </span>
                                <div className="flex items-center gap-1 min-w-0 justify-end">
                                    <code className="font-mono text-xs break-all truncate max-w-[200px]">
                                        {truncateAddress(collection)}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(collection, "Collection")}
                                        className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                                        title="Copy"
                                    >
                                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground shrink-0">
                                Asset ID
                            </span>
                            <div className="flex items-center gap-1 min-w-0 justify-end">
                                <code className="font-mono text-xs break-all truncate max-w-[200px]">
                                    {truncateAddress(id)}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(id, "Asset ID")}
                                    className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                                    title="Copy"
                                >
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
