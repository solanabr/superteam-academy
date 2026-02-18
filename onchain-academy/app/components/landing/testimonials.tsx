"use client";

import { motion } from "framer-motion";
import { Star, Trophy, Flame, Zap, Crown, Shield } from "lucide-react";

const testimonials = [
    {
        name: "rafael.sol",
        title: "Grandmaster • Lvl 15",
        avatar: "🧑‍💻",
        text: "I went from zero Solana knowledge to deploying production programs in 8 weeks. The XP system made me genuinely addicted to learning. Currently on a 45-day streak.",
        stars: 5,
        badge: "👑",
        xp: "24,850 XP",
        streak: 45,
    },
    {
        name: "maria.eth",
        title: "Champion • Lvl 14",
        avatar: "👩‍💻",
        text: "The boss challenges are insane. Hardest coding tests I've done, but the NFT credentials you earn are legit — I got hired at a Solana protocol partly because of them.",
        stars: 5,
        badge: "⚔️",
        xp: "22,100 XP",
        streak: 32,
    },
    {
        name: "lucas.sol",
        title: "Champion • Lvl 14",
        avatar: "🧑‍🔬",
        text: "Duolingo for blockchain, except you actually build real things. I check my streak every morning. The battle pass rewards keep me coming back.",
        stars: 5,
        badge: "🔥",
        xp: "19,800 XP",
        streak: 28,
    },
    {
        name: "ana.dev",
        title: "Veteran • Lvl 13",
        avatar: "👩‍🎨",
        text: "The achievement system is so satisfying. I have 32 badges and I'm hunting for the legendary 'Speed Runner' one. The community on Discord is amazing too.",
        stars: 5,
        badge: "🏆",
        xp: "17,500 XP",
        streak: 21,
    },
    {
        name: "pedro.sol",
        title: "Warrior • Lvl 12",
        avatar: "🧑‍🚀",
        text: "I compete with my friends on the leaderboard every week. We've formed a guild and do the daily quests together. Best learning platform I've used.",
        stars: 4,
        badge: "🛡️",
        xp: "15,200 XP",
        streak: 15,
    },
    {
        name: "sofia.sol",
        title: "Veteran • Lvl 13",
        avatar: "👩‍🔧",
        text: "The Anchor track is chef's kiss. I earned the Anchor Expert NFT and it's now my most prized on-chain credential. Actually got me an interview at a top DeFi protocol.",
        stars: 5,
        badge: "⚓",
        xp: "18,200 XP",
        streak: 19,
    },
];

const row1 = testimonials.slice(0, 3);
const row2 = testimonials.slice(3, 6);

function TestimonialCard({ t }: { t: typeof testimonials[number] }) {
    return (
        <div className="w-[380px] flex-shrink-0 mx-2 group">
            <div className="rounded-xl border border-white/[0.06] bg-[#0a0f1a]/90 p-5 hover:border-white/10 transition-all duration-300 h-full relative overflow-hidden">
                {/* Hover glow */}
                <div className="absolute -inset-1 bg-gradient-to-br from-neon-green/0 to-neon-cyan/0 group-hover:from-neon-green/5 group-hover:to-neon-cyan/5 transition-all duration-500 rounded-xl" />

                <div className="relative z-10 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">{t.avatar}</div>
                            <div>
                                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                    {t.name}
                                    <span className="text-base">{t.badge}</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-bold">{t.title}</div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                            <div className="flex gap-0.5">
                                {Array.from({ length: t.stars }).map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <div className="text-[9px] text-neon-green font-bold">{t.xp}</div>
                        </div>
                    </div>

                    {/* Quote */}
                    <p className="text-sm text-zinc-400 leading-relaxed">&ldquo;{t.text}&rdquo;</p>

                    {/* Footer stats */}
                    <div className="flex items-center gap-3 pt-1">
                        <span className="flex items-center gap-1 text-[10px] text-orange-400/70 font-bold">
                            <Flame className="w-3 h-3" /> {t.streak}d streak
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Testimonials() {
    return (
        <section className="relative py-24 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/[0.015] to-transparent" />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-4 px-4"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-neon-purple">
                    <Crown className="w-3 h-3" />
                    Guild Reviews
                </div>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
                    What the{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-cyan">
                        Players
                    </span>{" "}
                    Say
                </h2>
                <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                    12,400+ builders leveling up. Here&apos;s what the top-ranked players think.
                </p>
            </motion.div>

            {/* Scrolling rows */}
            <div className="space-y-4">
                {/* Row 1 - scroll left */}
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#020408] to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#020408] to-transparent z-10" />
                    <motion.div
                        animate={{ x: [0, -1200] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="flex"
                    >
                        {[...row1, ...row1, ...row1, ...row1].map((t, i) => (
                            <TestimonialCard key={i} t={t} />
                        ))}
                    </motion.div>
                </div>

                {/* Row 2 - scroll right */}
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#020408] to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#020408] to-transparent z-10" />
                    <motion.div
                        animate={{ x: [-1200, 0] }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="flex"
                    >
                        {[...row2, ...row2, ...row2, ...row2].map((t, i) => (
                            <TestimonialCard key={i} t={t} />
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
