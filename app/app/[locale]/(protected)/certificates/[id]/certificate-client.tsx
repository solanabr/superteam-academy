"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SectionReveal } from "@/components/motion/section-reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
    BadgeCheck,
    ExternalLink,
    Download,
    Share2,
    Copy,
    Check,
    Zap,
    Calendar,
    User,
    Link2,
    Twitter,
    Linkedin,
    Globe,
    Shield,
    Award,
    Wallet,
} from "lucide-react";
import type { Credential } from "@/lib/types";

export function CertificateClient({ credential }: { credential: Credential }) {
    const t = useTranslations("Certificate");
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const certUrl = typeof window !== "undefined"
        ? window.location.href
        : `https://academy.superteam.fun/certificates/${credential.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(certUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleCopyAddress = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareText = `I just earned my "${credential.courseTitle}" certificate on @SuperteamAcademy! 🎓⚡ Verified on-chain on Solana.`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(certUrl)}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certUrl)}`;

    const issueDate = new Date(credential.issueDate).toLocaleDateString("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="min-h-screen">
            <Header />
            <main className="pt-28 pb-16">
                <div className="content-container">
                    <div className="mx-auto max-w-3xl">

                        {/* === THE CERTIFICATE === */}
                        <SectionReveal>
                            <div className="relative" id="certificate">
                                {/* Ambient glow */}
                                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-solana-purple/15 via-transparent to-solana-green/15 blur-3xl" />

                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="relative"
                                >
                                    {/* Outer decorative border */}
                                    <div className="rounded-3xl bg-gradient-to-br from-solana-purple via-solana-purple/60 to-solana-green p-[2px] shadow-2xl">
                                        <div className="rounded-3xl bg-card">
                                            {/* Inner ornamental border */}
                                            <div className="m-3 rounded-2xl border border-border/30 p-8 md:p-12">

                                                {/* Header: Logo + Verified */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-solana-purple to-solana-green shadow-lg shadow-solana-purple/20">
                                                            <Zap className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                                                                Superteam Academy
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground/60">
                                                                On-Chain Education
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 px-3 py-1">
                                                        <BadgeCheck className="h-3.5 w-3.5" />
                                                        {t("verified")}
                                                    </Badge>
                                                </div>

                                                {/* Decorative divider */}
                                                <div className="relative my-8">
                                                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4">
                                                        <Award className="h-4 w-4 text-solana-purple/40" />
                                                    </div>
                                                </div>

                                                {/* Certificate body */}
                                                <div className="text-center">
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60">
                                                        {t("title")}
                                                    </p>

                                                    <h1 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem]">
                                                        {credential.courseTitle}
                                                    </h1>

                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {credential.coursePath} Track
                                                    </p>

                                                    {/* Ornamental divider */}
                                                    <div className="mx-auto my-8 flex items-center justify-center gap-3">
                                                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-solana-purple/30" />
                                                        <div className="h-1.5 w-1.5 rounded-full bg-solana-purple/30" />
                                                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-solana-green/30" />
                                                    </div>

                                                    <p className="text-xs text-muted-foreground tracking-wide">
                                                        {t("awarded")}
                                                    </p>

                                                    <p className="mt-3 font-display text-2xl font-bold">
                                                        <span className="gradient-text">{credential.recipientName}</span>
                                                    </p>

                                                    {/* Wallet address */}
                                                    <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
                                                        <Wallet className="h-3 w-3" />
                                                        <span className="font-mono">{credential.recipientWallet}</span>
                                                    </div>

                                                    {/* Date */}
                                                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/40 bg-accent/30 px-4 py-1.5 text-sm text-muted-foreground">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>{t("completedOn")} {issueDate}</span>
                                                    </div>
                                                </div>

                                                {/* Seal / Stamp area */}
                                                <div className="relative mt-10">
                                                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                                    <div className="mt-6 flex items-center justify-between">
                                                        {/* Issuer */}
                                                        <div className="text-left">
                                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                                                                {t("issued")}
                                                            </p>
                                                            <p className="mt-1 text-sm font-semibold">Superteam Academy</p>
                                                        </div>

                                                        {/* Official seal */}
                                                        <div className="relative">
                                                            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-solana-purple/20">
                                                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-solana-purple/10 to-solana-green/10">
                                                                    <Shield className="h-7 w-7 text-solana-purple/60" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Credential ID */}
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                                                                Credential ID
                                                            </p>
                                                            <p className="mt-1 text-sm font-mono text-muted-foreground">
                                                                {credential.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </SectionReveal>

                        {/* === ACTIONS === */}
                        <SectionReveal delay={0.1}>
                            <div className="mt-8 flex flex-col items-center gap-4">
                                {/* Primary actions */}
                                <div className="flex flex-wrap justify-center gap-3">
                                    <Button
                                        className="gap-2 rounded-full bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110 shadow-lg shadow-solana-purple/15"
                                    >
                                        <Download className="h-4 w-4" />
                                        {t("download")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="gap-2 rounded-full"
                                        onClick={handleCopyLink}
                                    >
                                        {linkCopied ? (
                                            <><Check className="h-4 w-4 text-solana-green" /> Copied!</>
                                        ) : (
                                            <><Copy className="h-4 w-4" /> {t("copyLink")}</>
                                        )}
                                    </Button>
                                </div>

                                {/* Social sharing */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground mr-1">Share on</span>
                                    <a
                                        href={twitterUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-muted-foreground transition-all hover:border-[#1DA1F2]/40 hover:text-[#1DA1F2] hover:shadow-md"
                                    >
                                        <Twitter className="h-4 w-4" />
                                    </a>
                                    <a
                                        href={linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-muted-foreground transition-all hover:border-[#0077B5]/40 hover:text-[#0077B5] hover:shadow-md"
                                    >
                                        <Linkedin className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        </SectionReveal>

                        {/* === ON-CHAIN VERIFICATION === */}
                        <SectionReveal delay={0.2}>
                            <div className="mt-12 rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-display text-lg font-bold flex items-center gap-2">
                                        <Link2 className="h-5 w-5 text-solana-purple" />
                                        On-Chain Verification
                                    </h2>
                                    <a
                                        href={`https://explorer.solana.com/tx/${credential.txSignature}?cluster=devnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 rounded-full border-solana-purple/20 text-solana-purple hover:bg-solana-purple/5 text-xs"
                                        >
                                            <BadgeCheck className="h-3.5 w-3.5" />
                                            Verify on Solana
                                            <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </a>
                                </div>

                                <div className="space-y-3">
                                    {/* Transaction */}
                                    <div className="flex items-center justify-between rounded-xl bg-accent/40 px-4 py-3">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                                Transaction Signature
                                            </p>
                                            <p className="mt-0.5 text-sm font-mono">{credential.txSignature}</p>
                                        </div>
                                        <a
                                            href={`https://explorer.solana.com/tx/${credential.txSignature}?cluster=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-solana-purple hover:bg-solana-purple/5 transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </div>

                                    {/* Mint Address */}
                                    <div className="flex items-center justify-between rounded-xl bg-accent/40 px-4 py-3">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                                NFT Mint Address
                                            </p>
                                            <p className="mt-0.5 text-sm font-mono">{credential.mintAddress}</p>
                                        </div>
                                        <a
                                            href={`https://explorer.solana.com/address/${credential.mintAddress}?cluster=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-solana-purple hover:bg-solana-purple/5 transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </div>

                                    {/* Recipient Wallet */}
                                    <div className="flex items-center justify-between rounded-xl bg-accent/40 px-4 py-3">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                                Recipient Wallet
                                            </p>
                                            <p className="mt-0.5 text-sm font-mono">{credential.recipientWallet}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCopyAddress(credential.recipientWallet)}
                                            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:text-solana-purple hover:bg-solana-purple/5 transition-colors"
                                        >
                                            {copied ? <Check className="h-4 w-4 text-solana-green" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </SectionReveal>

                        {/* === NFT METADATA === */}
                        <SectionReveal delay={0.3}>
                            <div className="mt-6 rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-sm">
                                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-solana-purple" />
                                    NFT Metadata
                                </h2>

                                <div className="mt-4 rounded-xl bg-accent/30 p-4">
                                    <p className="text-sm font-semibold">{credential.metadata.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{credential.metadata.description}</p>
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    {credential.metadata.attributes.map((attr) => (
                                        <div
                                            key={attr.trait_type}
                                            className="rounded-xl border border-border/30 bg-accent/20 p-4 text-center transition-all hover:border-solana-purple/20 hover:bg-solana-purple/5"
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-solana-purple">
                                                {attr.trait_type}
                                            </p>
                                            <p className="mt-1.5 text-sm font-semibold">{attr.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </SectionReveal>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
