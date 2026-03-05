"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SectionReveal } from "@/components/motion/section-reveal";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Link } from "@/i18n/navigation";

export function Hero() {
    const t = useTranslations("Hero");
    const { publicKey } = useWallet();
    const { setVisible } = useWalletModal();

    return (
        <section className="noise-bg relative min-h-[90vh] flex items-center overflow-hidden">
            {/* Background grid pattern */}
            <div className="absolute inset-0 dot-pattern opacity-30" />

            {/* Ambient glow orbs */}
            <div className="glow-purple top-[10%] -left-48" />
            <div className="glow-green bottom-[15%] -right-32" />
            <div className="glow-blue top-[60%] left-[30%]" />

            <div className="content-container relative z-10 py-32 md:py-40">
                <div className="mx-auto max-w-4xl text-center">
                    {/* Badge */}
                    <SectionReveal delay={0}>
                        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5 text-solana-purple" />
                            <span>Powered by Superteam Brazil</span>
                        </div>
                    </SectionReveal>

                    {/* Headline */}
                    <SectionReveal delay={0.1}>
                        <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
                            {t("title")}
                            <br />
                            <span className="gradient-text">{t("titleAccent")}</span>
                        </h1>
                    </SectionReveal>

                    {/* Subtitle */}
                    <SectionReveal delay={0.2}>
                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                            {t("subtitle")}
                        </p>
                    </SectionReveal>

                    <SectionReveal delay={0.3}>
                        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            {publicKey ? (
                                <Link href="/dashboard">
                                    <Button
                                        size="lg"
                                        className="group h-12 rounded-full bg-gradient-to-r from-solana-purple to-solana-green px-8 text-base font-semibold text-white shadow-lg shadow-solana-purple/25 transition-all hover:shadow-xl hover:shadow-solana-purple/35 hover:brightness-110"
                                    >
                                        {t("cta")}
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={() => setVisible(true)}
                                    className="group h-12 rounded-full bg-gradient-to-r from-solana-purple to-solana-green px-8 text-base font-semibold text-white shadow-lg shadow-solana-purple/25 transition-all hover:shadow-xl hover:shadow-solana-purple/35 hover:brightness-110"
                                >
                                    <Wallet className="mr-2 h-4 w-4" />
                                    {t("cta")}
                                </Button>
                            )}
                            <Link href="/courses">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-12 rounded-full px-8 text-base font-medium"
                                >
                                    {t("ctaSecondary")}
                                </Button>
                            </Link>
                        </div>
                    </SectionReveal>

                    {/* Progress path visual */}
                    <SectionReveal delay={0.5}>
                        <div className="mt-20 flex items-center justify-center gap-3">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <motion.div
                                    key={level}
                                    className="relative"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        delay: 0.8 + level * 0.1,
                                        duration: 0.4,
                                        ease: "backOut",
                                    }}
                                >
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all md:h-12 md:w-12 md:text-sm ${level <= 2
                                            ? "bg-gradient-to-br from-solana-purple to-solana-green text-white shadow-lg shadow-solana-purple/25"
                                            : level === 3
                                                ? "border-2 border-solana-purple/50 text-solana-purple bg-solana-purple/5"
                                                : "border border-border text-muted-foreground bg-card/50"
                                            }`}
                                    >
                                        {level}
                                    </div>
                                    {level < 5 && (
                                        <div
                                            className={`absolute top-1/2 left-full h-px w-3 -translate-y-1/2 ${level < 2
                                                ? "bg-gradient-to-r from-solana-purple to-solana-green"
                                                : "bg-border"
                                                }`}
                                        />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </SectionReveal>
                </div>
            </div>
        </section>
    );
}
