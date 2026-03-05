"use client";

import { useTranslations } from "next-intl";
import {
    SectionReveal,
    StaggerContainer,
    staggerItem,
} from "@/components/motion/section-reveal";
import { motion } from "framer-motion";
import { Users, BookOpen, Globe, Award } from "lucide-react";

const stats = [
    { key: "learners", value: "2,400+", icon: Users },
    { key: "courses", value: "50+", icon: BookOpen },
    { key: "countries", value: "35+", icon: Globe },
    { key: "credentials", value: "800+", icon: Award },
] as const;

const partners = [
    "Solana Foundation",
    "Superteam",
    "Helius",
    "Phantom",
    "Magic Eden",
    "Jito",
];

export function Community() {
    const t = useTranslations("Community");

    return (
        <section id="community" className="noise-bg section-padding gradient-bg-subtle relative overflow-hidden">
            <div className="glow-blue top-[15%] left-[20%]" />
            <div className="glow-purple bottom-[5%] -right-32" />
            <div className="content-container relative z-10">
                {/* Section Header */}
                <SectionReveal>
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="inline-block rounded-full bg-solana-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-solana-green">
                            {t("badge")}
                        </span>
                        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                            {t("title")}
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            {t("subtitle")}
                        </p>
                    </div>
                </SectionReveal>

                {/* Stats Grid */}
                <StaggerContainer className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                    {stats.map(({ key, value, icon: Icon }) => (
                        <motion.div
                            key={key}
                            variants={staggerItem}
                            className="group rounded-2xl border border-border/60 bg-card/80 p-6 text-center backdrop-blur-sm transition-all hover:border-border hover:shadow-lg hover:shadow-solana-purple/5"
                        >
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-solana-purple/10 to-solana-green/10 transition-transform group-hover:scale-110">
                                <Icon className="h-5 w-5 text-solana-purple" />
                            </div>
                            <p className="mt-4 font-display text-3xl font-bold gradient-text md:text-4xl">
                                {value}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t(`stats.${key}` as "stats.learners")}
                            </p>
                        </motion.div>
                    ))}
                </StaggerContainer>

                {/* Partners */}
                <SectionReveal delay={0.3}>
                    <div className="mt-16 text-center">
                        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                            {t("partners")}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 md:gap-12">
                            {partners.map((partner) => (
                                <span
                                    key={partner}
                                    className="text-lg font-semibold text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                                >
                                    {partner}
                                </span>
                            ))}
                        </div>
                    </div>
                </SectionReveal>
            </div>
        </section>
    );
}
