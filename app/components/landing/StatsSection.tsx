"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Users, Sparkles, BookOpen, Award } from "lucide-react";

interface StatItem {
    label: string;
    value: number;
    suffix: string;
    icon: React.ElementType;
}

const STATS: StatItem[] = [
    { label: "Active Learners", value: 500, suffix: "+", icon: Users },
    { label: "XP Earned", value: 10000, suffix: "+", icon: Sparkles },
    { label: "Courses Available", value: 5, suffix: "", icon: BookOpen },
    { label: "Certificates Minted", value: 100, suffix: "+", icon: Award },
];

function useCountUp(target: number, isActive: boolean, duration = 1800) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isActive) return;

        let raf: number;
        const startTime = performance.now();

        function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));

            if (progress < 1) {
                raf = requestAnimationFrame(tick);
            } else {
                setCount(target);
            }
        }

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, isActive, duration]);

    return count;
}

function StatCounter({
    stat,
    isActive,
    delay,
}: {
    stat: StatItem;
    isActive: boolean;
    delay: number;
}) {
    const [started, setStarted] = useState(false);
    const count = useCountUp(stat.value, started);
    const Icon = stat.icon;

    useEffect(() => {
        if (!isActive) return;
        const timer = setTimeout(() => setStarted(true), delay);
        return () => clearTimeout(timer);
    }, [isActive, delay]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: delay / 1000 }}
            className="flex flex-col items-center gap-2 py-6 sm:py-8"
        >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400/70 mb-1" />
            <span
                className="font-game text-3xl sm:text-4xl md:text-5xl tabular-nums text-foreground"
            >
                {started ? count.toLocaleString() : "0"}
                {started && count === stat.value ? stat.suffix : ""}
            </span>
            <span className="font-game text-xs sm:text-sm text-muted-foreground text-center uppercase tracking-wider">
                {stat.label}
            </span>
        </motion.div>
    );
}

export function StatsSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });

    return (
        <section className="w-full py-8 sm:py-12 bg-background">
            <div ref={ref} className="mx-auto max-w-5xl px-4 sm:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/10 rounded-2xl border border-white/10 bg-card/20">
                    {STATS.map((stat, i) => (
                        <StatCounter
                            key={stat.label}
                            stat={stat}
                            isActive={isInView}
                            delay={i * 150}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
