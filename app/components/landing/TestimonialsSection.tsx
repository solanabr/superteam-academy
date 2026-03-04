"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface Testimonial {
    quote: string;
    name: string;
    handle: string;
    avatar: string;
    avatarColor: string;
}

const TESTIMONIALS_ROW_1: Testimonial[] = [
    {
        quote: "Go-to resource for Rust & Solana mastery. The smart contract security track completely changed how I build programs.",
        name: "Andre Rodriguez",
        handle: "@andrerodz",
        avatar: "AR",
        avatarColor: "bg-emerald-500",
    },
    {
        quote: "The PPC track is absolutely incredible. Covers everything you need to know about program composition on Solana.",
        name: "Ana Beatriz",
        handle: "@anabeatriz_sol",
        avatar: "AB",
        avatarColor: "bg-purple-500",
    },
    {
        quote: "Insane quality. Their knowledge-base of assembly and formal verification is unmatched. Must-have for serious devs.",
        name: "Marco Rossi",
        handle: "@marcorossi",
        avatar: "MR",
        avatarColor: "bg-blue-500",
    },
    {
        quote: "Best platform for serious Solana development learning. The projects are real-world and the mentorship is top notch.",
        name: "Priya Sharma",
        handle: "@priyasharma_dev",
        avatar: "PS",
        avatarColor: "bg-pink-500",
    },
    {
        quote: "Went from zero Rust knowledge to deploying my first Solana program in 3 weeks. Brilliant curriculum.",
        name: "Carlos Mendez",
        handle: "@carlosmendez",
        avatar: "CM",
        avatarColor: "bg-orange-500",
    },
];

const TESTIMONIALS_ROW_2: Testimonial[] = [
    {
        quote: "Best on-chain course out there — I've done others but this is the gold standard for Solana development.",
        name: "Sofia Chen",
        handle: "@sofiachen_web3",
        avatar: "SC",
        avatarColor: "bg-cyan-500",
    },
    {
        quote: "Proven pacing. Engaging. Interactive. Their approach to teaching on-chain concepts is genuinely creative.",
        name: "James Wilson",
        handle: "@jameswilson_dev",
        avatar: "JW",
        avatarColor: "bg-amber-500",
    },
    {
        quote: "This fills a huge gap in the Solana education ecosystem. By far the most polished platform I've used.",
        name: "Sebastian Müller",
        handle: "@sebastianmuller",
        avatar: "SM",
        avatarColor: "bg-red-500",
    },
    {
        quote: "Really appreciate how they don't skip important concepts — ownership, lifetimes, borrows. Solid foundation.",
        name: "Emily Torres",
        handle: "@emilytorres",
        avatar: "ET",
        avatarColor: "bg-violet-500",
    },
    {
        quote: "Superteam Academy is the only learning resource I recommend to devs entering the ecosystem. Period.",
        name: "Matheus Lima",
        handle: "@matheuslima",
        avatar: "ML",
        avatarColor: "bg-teal-500",
    },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    return (
        <div className="inline-flex w-[300px] sm:w-[340px] shrink-0 flex-col gap-3 rounded-2xl border border-white/10 bg-card/30 p-5 transition-all duration-300 hover:bg-card/50 hover:border-yellow-400/20">
            <p className="font-game text-base sm:text-lg text-foreground leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-auto pt-2">
                <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${testimonial.avatarColor} text-xs font-bold text-white`}
                >
                    {testimonial.avatar}
                </div>
                <div>
                    <p className="font-game text-sm text-foreground">{testimonial.name}</p>
                    <p className="font-game text-xs text-muted-foreground">{testimonial.handle}</p>
                </div>
            </div>
        </div>
    );
}

function MarqueeRow({
    testimonials,
    direction = "left",
}: {
    testimonials: Testimonial[];
    direction?: "left" | "right";
}) {
    const doubled = [...testimonials, ...testimonials];
    const duration = direction === "left" ? 28 : 32;
    const animate = direction === "left" ? { x: ["0%", "-50%"] } : { x: ["-50%", "0%"] };

    return (
        <div className="relative overflow-hidden marquee-fade-edges">
            <motion.div
                className="flex w-max gap-4 will-change-transform"
                animate={animate}
                transition={{
                    duration,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop",
                }}
            >
                {doubled.map((t, i) => (
                    <TestimonialCard key={`${t.handle}-${i}`} testimonial={t} />
                ))}
            </motion.div>
        </div>
    );
}

export function TestimonialsSection() {
    const headerRef = useRef<HTMLDivElement>(null);
    const headerInView = useInView(headerRef, { once: true, margin: "-40px" });

    return (
        <section className="w-full overflow-hidden py-16 sm:py-24 bg-background">
            <motion.div
                ref={headerRef}
                initial={{ opacity: 0, y: 16 }}
                animate={headerInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="mb-10 sm:mb-14 text-center px-4"
            >
                <p className="mb-2 font-game text-base sm:text-lg tracking-widest text-yellow-400 uppercase">
                    Community
                </p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-game leading-tight">
                    Trusted by developers building on{" "}
                    <span className="text-yellow-400">Solana</span>.
                </h2>
            </motion.div>

            <div className="flex flex-col gap-4">
                <MarqueeRow testimonials={TESTIMONIALS_ROW_1} direction="left" />
                <MarqueeRow testimonials={TESTIMONIALS_ROW_2} direction="right" />
            </div>
        </section>
    );
}
