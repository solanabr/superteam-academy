"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Trophy,
    ExternalLink,
    Share2,
    Shield,
    Zap,
    Award,
    BookOpen,
    Link2,
    Copy,
    Check,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { TxExplorer } from "@/components/ui/tx-explorer";

const TWITTER_HANDLE = "SuperteamAcademy";

export default function CertificatePage() {
    const params = useParams<{ id: string }>();
    const [copied, setCopied] = useState(false);
    const [tweetSent, setTweetSent] = useState(false);

    const certificate = {
        id: params.id,
        courseName: "Solana Fundamentals",
        trackName: "Core Blockchain",
        recipientName: "Solana Developer",
        recipientWallet: "7xKX...3f9e",
        completedAt: "2025-02-20",
        coursesCompleted: 1,
        totalXp: 400,
        level: 1,
        mint: params.id,
        txHash: params.id,
        explorerUrl: `https://explorer.solana.com/address/${params.id}?cluster=devnet`,
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareX = () => {
        const text = `🎓 Just earned my "${certificate.courseName}" certificate on @${TWITTER_HANDLE}!\n\n🔗 Verified on-chain (Solana Devnet): ${certificate.explorerUrl}\n\n#Solana #Web3 #BuildOnSolana #Superteam`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
        setTweetSent(true);
        setTimeout(() => setTweetSent(false), 3000);
    };

    return (
        <main className="mx-auto max-w-3xl px-4 py-8">
            {/* Certificate card */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            >
                <Card className="relative overflow-hidden border-primary/20">
                    {/* Gradient top bar */}
                    <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />

                    {/* Background effects */}
                    <div className="absolute inset-0 bg-grid opacity-20" />
                    <div className="absolute left-1/2 top-20 -translate-x-1/2 h-[200px] w-[300px] rounded-full bg-primary/5 blur-[80px]" />

                    <CardContent className="relative p-8 text-center sm:p-12">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">
                            Certificate of Completion
                        </p>

                        {/* Trophy icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                            className="mt-6 flex justify-center"
                        >
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-[0_0_30px_rgba(20,241,149,0.2)]">
                                <Trophy className="h-10 w-10 text-primary-foreground" />
                            </div>
                        </motion.div>

                        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
                            {certificate.courseName}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {certificate.trackName} Track
                        </p>

                        <div className="mx-auto mt-8 h-px w-32 bg-gradient-to-r from-transparent via-border to-transparent" />

                        <p className="mt-8 text-xs text-muted-foreground uppercase tracking-wider">
                            Awarded to
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                            {certificate.recipientName}
                        </p>
                        <p className="mt-1 text-xs font-mono text-primary">
                            {certificate.recipientWallet}
                        </p>

                        <p className="mt-6 text-xs text-muted-foreground">
                            Completed on{" "}
                            {new Date(certificate.completedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>

                        {/* Stats */}
                        <div className="mx-auto mt-8 flex max-w-xs justify-center gap-8">
                            {[
                                { label: "XP Earned", value: certificate.totalXp, icon: Zap, color: "text-primary" },
                                { label: "Level", value: certificate.level, icon: Award, color: "text-secondary", prefix: "Lv. " },
                                { label: "Courses", value: certificate.coursesCompleted, icon: BookOpen, color: "text-accent" },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                        <p className="text-lg font-bold">
                                            <AnimatedCounter value={stat.value} prefix={stat.prefix} />
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
                <Button asChild className="flex-1 gap-2">
                    <a href={certificate.explorerUrl} target="_blank" rel="noreferrer">
                        Verify on Solana Explorer
                        <ExternalLink className="h-4 w-4" />
                    </a>
                </Button>
                <Button
                    variant="outline"
                    className="flex-1 gap-2 border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2]/60 hover:text-[#1DA1F2] transition-colors"
                    onClick={handleShareX}
                >
                    {tweetSent ? (
                        <><Check className="h-4 w-4" />Shared on X!</>
                    ) : (
                        <>
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            Share on X
                        </>
                    )}
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handleCopyLink}>
                    {copied ? (
                        <><Check className="h-4 w-4" />Copied!</>
                    ) : (
                        <><Link2 className="h-4 w-4" />Copy Link</>
                    )}
                </Button>
            </motion.div>

            {/* Inline TX Explorer */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mt-4"
            >
                <TxExplorer
                    txHash={certificate.txHash}
                    label="Certificate Mint Transaction"
                    status="confirmed"
                    network="devnet"
                />
            </motion.div>

            {/* On-Chain Details */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
            >
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4 text-primary" />
                            On-Chain Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-xs">
                            {[
                                {
                                    label: "Mint Address",
                                    value: certificate.mint,
                                    mono: true,
                                    highlight: true,
                                },
                                {
                                    label: "Standard",
                                    value: "Metaplex Core (Soulbound)",
                                },
                                { label: "Network", value: "Solana Devnet" },
                                {
                                    label: "Transferable",
                                    value: "No (Soulbound)",
                                    badge: true,
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between"
                                >
                                    <span className="text-muted-foreground">{item.label}</span>
                                    {item.badge ? (
                                        <Badge variant="secondary" className="text-[10px]">
                                            <Shield className="mr-1 h-2.5 w-2.5" />
                                            {item.value}
                                        </Badge>
                                    ) : (
                                        <span
                                            className={
                                                item.mono
                                                    ? "font-mono text-primary"
                                                    : item.highlight
                                                        ? "text-primary"
                                                        : ""
                                            }
                                        >
                                            {item.value}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </main>
    );
}
