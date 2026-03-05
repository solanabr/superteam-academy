"use client";

import { useTranslations } from "next-intl";
import { SectionReveal } from "@/components/motion/section-reveal";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, CreditCard } from "lucide-react";

export function CTASection() {
    const t = useTranslations("CTA");

    return (
        <section className="noise-bg section-padding relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-solana-purple/5 to-background" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-solana-purple/8 to-solana-green/8 blur-[120px]" />

            <div className="content-container relative z-10">
                <SectionReveal>
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                            {t("title").split("Solana")[0]}
                            <span className="gradient-text">Solana</span>
                            {t("title").split("Solana")[1]}
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
                            {t("subtitle")}
                        </p>

                        {/* CTA Button */}
                        <div className="mt-10">
                            <Button
                                size="lg"
                                className="group h-14 rounded-full bg-gradient-to-r from-solana-purple to-solana-green px-10 text-lg font-semibold text-white shadow-xl shadow-solana-purple/25 transition-all hover:shadow-2xl hover:shadow-solana-purple/35 hover:brightness-110"
                            >
                                {t("cta")}
                                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>

                        {/* Trust signals */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <CreditCard className="h-4 w-4" />
                                {t("noCard")}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Github className="h-4 w-4" />
                                {t("openSource")}
                            </span>
                        </div>
                    </div>
                </SectionReveal>
            </div>
        </section>
    );
}
