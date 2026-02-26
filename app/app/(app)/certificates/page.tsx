"use client";

import { Award } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/app";
import { Button } from "@/components/ui/button";
import { useCredentials } from "@/hooks";
import Link from "next/link";

export default function CertificatesPage() {
    const { data: credentials, isLoading } = useCredentials();

    if (isLoading) {
        return (
            <div className="space-y-6 p-10 md:px-12">
                <PageHeader title="Certificates" subtitle="Your on-chain credential NFTs" />
                <div className="h-32 animate-pulse rounded-xl bg-muted" />
            </div>
        );
    }

    if (credentials && credentials.length > 0) {
        return (
            <div className="space-y-6 p-10 md:px-12">
                <PageHeader title="Certificates" subtitle="Your on-chain credential NFTs" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {credentials.map((cred) => (
                        <Link key={cred.asset} href={`/certificates/${cred.asset}`}>
                            <div className="p-5 border-4 rounded-2xl hover:bg-zinc-800/50 transition-colors h-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="h-6 w-6 text-yellow-400" />
                                    <span className="font-game text-lg">Track {cred.trackId}</span>
                                </div>
                                <p className="font-game text-gray-400 text-sm">
                                    Level {cred.level} · {cred.coursesCompleted} courses · {cred.totalXp.toLocaleString()} XP
                                </p>
                                <p className="font-game text-xs text-gray-500 mt-1 truncate" title={cred.asset}>
                                    {cred.asset.slice(0, 8)}...
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

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
