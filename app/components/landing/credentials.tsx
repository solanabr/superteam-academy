"use client";

import { useTranslations } from "next-intl";
import { SectionReveal } from "@/components/motion/section-reveal";
import { motion } from "framer-motion";
import {
    Shield,
    BadgeCheck,
    Share2,
    Search,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Credentials() {
    const t = useTranslations("Credentials");

    const features = [
        {
            key: "permanent",
            icon: Shield,
            color: "text-solana-purple bg-solana-purple/10",
        },
        {
            key: "portable",
            icon: Share2,
            color: "text-solana-green bg-solana-green/10",
        },
        {
            key: "verifiable",
            icon: Search,
            color: "text-solana-blue bg-solana-blue/10",
        },
    ];

    return (
        <section className="noise-bg section-padding relative overflow-hidden">
            <div className="glow-green top-[30%] -right-32" />
            <div className="glow-purple bottom-[10%] left-[10%]" />
            <div className="content-container relative z-10">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
                    {/* Certificate Preview */}
                    <SectionReveal direction="left">
                        <div className="relative mx-auto max-w-md">
                            {/* Glow behind card */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-solana-purple/20 to-solana-green/20 blur-2xl" />

                            {/* Certificate Card */}
                            <div className="gradient-border relative rounded-3xl bg-card p-8 shadow-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-solana-purple to-solana-green">
                                            <BadgeCheck className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            {t("credential")}
                                        </span>
                                    </div>
                                    <motion.div
                                        className="flex items-center gap-1 rounded-full bg-solana-green/10 px-2.5 py-1 text-xs font-semibold text-solana-green"
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        transition={{ delay: 0.5, type: "spring" }}
                                        viewport={{ once: true }}
                                    >
                                        <BadgeCheck className="h-3 w-3" />
                                        {t("verified")}
                                    </motion.div>
                                </div>

                                {/* Certificate Body */}
                                <div className="mt-6 text-center">
                                    <h3 className="font-display text-2xl font-bold">
                                        Solana Developer
                                    </h3>
                                    <p className="text-lg text-muted-foreground">
                                        Program Architecture
                                    </p>

                                    {/* Decorative divider */}
                                    <div className="mx-auto my-6 h-px w-32 bg-gradient-to-r from-transparent via-border to-transparent" />

                                    <p className="text-sm text-muted-foreground">
                                        Awarded to
                                    </p>
                                    <p className="mt-1 font-display text-lg font-semibold">
                                        Alex.sol
                                    </p>

                                    <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
                                        <span>{t("completionDate")}: Mar 2026</span>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                                    <span className="text-xs text-muted-foreground">
                                        {t("issuer")}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 gap-1 text-xs text-solana-purple hover:text-solana-purple"
                                    >
                                        {t("verifyOnChain")}
                                        <ExternalLink className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </SectionReveal>

                    {/* Text + Features Side */}
                    <SectionReveal direction="right">
                        <div>
                            <span className="inline-block rounded-full bg-solana-purple/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-solana-purple">
                                {t("badge")}
                            </span>
                            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                                {t("title")}
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                {t("subtitle")}
                            </p>

                            {/* Feature List */}
                            <div className="mt-8 space-y-4">
                                {features.map(({ key, icon: Icon, color }) => (
                                    <div
                                        key={key}
                                        className="flex items-start gap-4 rounded-xl border border-border/40 bg-card/50 p-4 transition-colors hover:border-border/80"
                                    >
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">
                                                {t(`features.${key}` as "features.permanent")}
                                            </h4>
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                {t(`features.${key}Desc` as "features.permanentDesc")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SectionReveal>
                </div>
            </div>
        </section>
    );
}
