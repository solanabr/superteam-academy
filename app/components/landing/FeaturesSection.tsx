"use client";

import Image from "next/image";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const FEATURES = [
    {
        title: "Talent Leaderboard",
        desc: "Track XP rankings and see where you stand against top community builders.",
        image: "/features/leaderboard.png",
        span: "md:col-span-2",
        imgClass: "h-52 sm:h-64 md:h-72",
        tone: "from-yellow-400/15 to-transparent",
        zoomClass: "object-[10%_10%] scale-[1]",
    },
    {
        title: "Timed Coding Challenges",
        desc: "Solve practical Solana coding problems with in-browser execution and instant feedback.",
        image: "/features/challenge.png",
        span: "md:col-span-1",
        imgClass: "h-52 sm:h-56",
        tone: "from-yellow-400/15 to-transparent",
        zoomClass: "object-[50%_22%] scale-[1.22]",
    },
    {
        title: "Community Discussions",
        desc: "Ask questions, post solutions, and collaborate with other learners in one feed.",
        image: "/features/discussions.png",
        span: "md:col-span-1",
        imgClass: "h-52 sm:h-56",
        tone: "from-cyan-400/15 to-transparent",
        zoomClass: "object-[50%_18%] scale-[1]",
    },
    {
        title: "Profile & Credentials",
        desc: "Showcase progress, XP, and on-chain learning credentials in your public profile.",
        image: "/features/profile.png",
        span: "md:col-span-1",
        imgClass: "h-52 sm:h-56",
        tone: "from-purple-400/15 to-transparent",
        zoomClass: "object-[50%_27%] scale-[1]",
    },
    {
        title: "Achievements & Badges",
        desc: "Unlock milestone badges for consistency, course completion, and community impact.",
        image: "/features/achievements.png",
        span: "md:col-span-1",
        imgClass: "h-52 sm:h-56",
        tone: "from-emerald-400/15 to-transparent",
        zoomClass: "object-[50%_18%] scale-[1]",
    },
];

export function FeaturesSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });

    return (
        <section className="w-full py-16 sm:py-24 bg-background">
            <div ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="mb-10 sm:mb-14 text-center"
                >
                    <p className="mb-2 font-game text-base sm:text-lg tracking-widest text-yellow-400 uppercase">
                        Everything you need
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-game leading-tight">
                        Everything you need to master{" "}
                        <span className="text-yellow-400">Solana</span>.
                    </h2>
                </motion.div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
                    {FEATURES.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 24 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{
                                duration: 0.5,
                                delay: 0.08 * i,
                                ease: "easeOut",
                            }}
                            className={`group relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 ${feature.span}`}
                        >
                            {/* Image area */}
                            <div className={`relative w-full overflow-hidden border-b border-border/60 bg-[#0d1118] ${feature.imgClass}`}>
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className={`object-cover ${feature.zoomClass}`}
                                />
                                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${feature.tone} via-transparent to-transparent`} />
                            </div>

                            {/* Text content */}
                            <div className="relative p-5 sm:p-6">
                                <h3 className="mb-1.5 font-game text-xl text-white sm:text-2xl">
                                    {feature.title}
                                </h3>
                                <p className="font-game text-sm leading-relaxed text-white/65 sm:text-base">
                                    {feature.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
