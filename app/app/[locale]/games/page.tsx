"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SectionReveal, StaggerContainer, staggerItem } from "@/components/motion/section-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
    Gamepad2,
    Swords,
    Zap,
    Clock,
    Star,
    ArrowRight,
} from "lucide-react";

const games = [
    {
        id: "token-toss",
        title: "Token Toss",
        description:
            "A physics-based game where you toss SPL tokens at targets to learn tokenomics mechanics. Aim carefully — each target teaches a different concept about mints, accounts, and transfers.",
        genre: "Physics / Educational",
        icon: Zap,
        color: "from-solana-purple to-solana-green",
        shadow: "shadow-solana-purple/25",
        borderColor: "border-solana-purple/20",
        skills: ["SPL Tokens", "Token Accounts"],
        xp: 300,
        status: "playable" as const,
        difficulty: "Beginner",
    },
    {
        id: "grimlok-online",
        title: "Grimlok Online",
        description:
            "Embark on a blockchain RPG adventure. Battle on-chain enemies, forge NFT weapons, manage your token inventory, and collaborate with your guild — all powered by Solana.",
        genre: "RPG / Adventure",
        icon: Swords,
        color: "from-amber-600 to-red-600",
        shadow: "shadow-amber-600/25",
        borderColor: "border-amber-600/20",
        skills: ["NFTs", "On-Chain Data"],
        xp: 1200,
        status: "coming-soon" as const,
        difficulty: "Intermediate",
    },
];

export default function GamesPage() {
    return (
        <div className="min-h-screen">
            <Header />
            <main className="pt-28 pb-16">
                <Suspense
                    fallback={
                        <div className="content-container flex justify-center py-20">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-solana-purple border-t-transparent" />
                        </div>
                    }
                >
                    <GamesPageContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

function GamesPageContent() {
    const t = useTranslations("Games");

    return (
        <div className="content-container">
            {/* Page Header — left-aligned like other pages */}
            <SectionReveal>
                <div className="mb-10">
                    <Badge className="mb-3 bg-solana-purple/10 text-solana-purple border-solana-purple/20 hover:bg-solana-purple/15">
                        <Gamepad2 className="mr-1.5 h-3 w-3" />
                        {t("badge")}
                    </Badge>
                    <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                        {t("title")}{" "}
                        <span className="gradient-text">{t("titleAccent")}</span>
                    </h1>
                    <p className="mt-3 max-w-2xl text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>
            </SectionReveal>

            {/* Games Grid */}
            <SectionReveal delay={0.1}>
                <StaggerContainer className="grid gap-6 md:grid-cols-2">
                    {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </StaggerContainer>
            </SectionReveal>
        </div>
    );
}

function GameCard({ game }: { game: (typeof games)[0] }) {
    const Icon = game.icon;
    const isComingSoon = game.status === "coming-soon";

    return (
        <motion.div
            variants={staggerItem}
            className={`group relative overflow-hidden rounded-2xl border ${game.borderColor} bg-card/80 backdrop-blur-sm transition-all hover:shadow-lg hover:border-border`}
        >
            {/* Status badge */}
            {isComingSoon && (
                <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-amber-500/90 text-white border-0 text-[10px] font-bold uppercase tracking-wider shadow-lg">
                        Coming Soon
                    </Badge>
                </div>
            )}

            {/* Gradient hero area */}
            <div
                className={`relative h-44 bg-gradient-to-br ${game.color} flex items-end overflow-hidden p-6`}
            >
                {/* Pattern overlay */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
                {/* Large icon */}
                <Icon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 text-white/20 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                {/* Title overlay */}
                <div className="relative z-10">
                    <h3 className="font-display text-2xl font-bold text-white drop-shadow-md">
                        {game.title}
                    </h3>
                    <p className="text-sm text-white/80 mt-0.5">{game.genre}</p>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {game.description}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Star className="h-3.5 w-3.5" />
                        {game.difficulty}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-solana-green">
                        <Zap className="h-3.5 w-3.5" />
                        +{game.xp} XP
                    </div>
                </div>

                {/* Skills */}
                <div className="flex items-center gap-1.5">
                    {game.skills.map((skill) => (
                        <Badge
                            key={skill}
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 border-border/50"
                        >
                            {skill}
                        </Badge>
                    ))}
                </div>

                {/* Action */}
                <Button
                    className={`w-full gap-2 rounded-xl ${isComingSoon
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110"
                        }`}
                    disabled={isComingSoon}
                >
                    {isComingSoon ? (
                        <>
                            <Clock className="h-4 w-4" />
                            Coming Soon
                        </>
                    ) : (
                        <>
                            Play Now
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
