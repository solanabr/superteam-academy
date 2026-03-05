"use client";

import { useTranslations } from "next-intl";
import { SectionReveal } from "@/components/motion/section-reveal";
import { motion } from "framer-motion";
import {
    Play,
    Lightbulb,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const codeLines = [
    { text: 'import { createMint } from "@solana/spl-token";', color: "text-muted-foreground" },
    { text: 'import { Connection, Keypair } from "@solana/web3.js";', color: "text-muted-foreground" },
    { text: "", color: "" },
    { text: "const connection = new Connection(", color: "text-foreground" },
    { text: '  "https://api.devnet.solana.com"', color: "text-solana-green" },
    { text: ");", color: "text-foreground" },
    { text: "", color: "" },
    { text: "const mint = await createMint(", color: "text-foreground" },
    { text: "  connection,", color: "text-solana-purple" },
    { text: "  payer,", color: "text-solana-purple" },
    { text: "  mintAuthority.publicKey,", color: "text-solana-purple" },
    { text: "  null,", color: "text-muted-foreground" },
    { text: "  9 // decimals", color: "text-solana-green" },
    { text: ");", color: "text-foreground" },
];

export function InteractiveTeaser() {
    const t = useTranslations("InteractiveTeaser");

    return (
        <section id="courses" className="noise-bg section-padding relative overflow-hidden">
            <div className="glow-blue top-[20%] -right-48" />
            <div className="glow-purple bottom-[10%] left-[15%]" />
            <div className="content-container relative z-10">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Text Side */}
                    <SectionReveal direction="left">
                        <div>
                            <span className="inline-block rounded-full bg-solana-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-solana-green">
                                {t("badge")}
                            </span>
                            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                                {t("title")}
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                {t("subtitle")}
                            </p>

                            {/* Challenge info */}
                            <div className="mt-8 space-y-3">
                                <div className="rounded-xl border border-border/60 bg-card/80 p-4 backdrop-blur-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-solana-purple/10">
                                            <Lightbulb className="h-4 w-4 text-solana-purple" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {t("hint")}
                                            </p>
                                            <p className="text-sm text-foreground">{t("hintText")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionReveal>

                    {/* Code Editor Side */}
                    <SectionReveal direction="right">
                        <div className="rounded-2xl border border-border/60 bg-card/90 shadow-2xl shadow-solana-purple/5 backdrop-blur-sm overflow-hidden">
                            {/* Editor Header */}
                            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="h-3 w-3 rounded-full bg-red-500/70" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                                        <div className="h-3 w-3 rounded-full bg-green-500/70" />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">
                                        create-token.ts
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {t("step", { number: 2, total: 4 })}
                                </span>
                            </div>

                            {/* Code Content */}
                            <div className="p-4 font-mono text-sm leading-relaxed overflow-x-auto">
                                {codeLines.map((line, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 + i * 0.06, duration: 0.3 }}
                                        className="flex"
                                    >
                                        <span className="mr-4 inline-block w-6 text-right text-muted-foreground/40 select-none">
                                            {i + 1}
                                        </span>
                                        <span className={line.color}>{line.text}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Editor Footer */}
                            <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
                                <motion.div
                                    className="flex items-center gap-2 text-sm font-medium text-solana-green"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2 }}
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {t("passed")}
                                </motion.div>
                                <Button
                                    size="sm"
                                    className="gap-1.5 rounded-full bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110"
                                >
                                    <Play className="h-3.5 w-3.5" />
                                    {t("run")}
                                </Button>
                            </div>
                        </div>
                    </SectionReveal>
                </div>
            </div>
        </section>
    );
}
