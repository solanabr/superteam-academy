"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface Testimonial {
    quote: string;
    name: string;
    handle: string;
    avatar: string;
}

const TESTIMONIALS_ROW_1: Testimonial[] = [
    {
        quote: "Go-to resource for Rust & Solana mastery. Completed the smart contract security track and it completely changed how I build programs.",
        name: "Andre Rodriguez",
        handle: "@andrerodz",
        avatar: "AR",
    },
    {
        quote: "The PPC track is absolutely incredible. Covers everything you need to know about program composition on Solana.",
        name: "Ana Beatriz",
        handle: "@anabeatriz_sol",
        avatar: "AB",
    },
    {
        quote: "Insane quality. Their knowledge-base of assembly and formal verification is unmatched. Must-have for serious Solana devs.",
        name: "Marco Rossi",
        handle: "@marcorossi",
        avatar: "MR",
    },
    {
        quote: "Best platform for serious Solana development learning. The projects are real-world and the mentorship is top notch.",
        name: "Priya Sharma",
        handle: "@priyasharma_dev",
        avatar: "PS",
    },
    {
        quote: "Went from zero Rust knowledge to deploying my first Solana program in 3 weeks. The curriculum is brilliant.",
        name: "Carlos Mendez",
        handle: "@carlosmendez",
        avatar: "CM",
    },
];

const TESTIMONIALS_ROW_2: Testimonial[] = [
    {
        quote: "Best on-chain Course out there — I've done others but this one is the gold standard for Solana program development.",
        name: "Sofia Chen",
        handle: "@sofiachen_web3",
        avatar: "SC",
    },
    {
        quote: "Proven Program Pacing. Engaging. Interactive. Their approach to teaching on-chain concepts is genuinely creative.",
        name: "James Wilson",
        handle: "@jameswilson_dev",
        avatar: "JW",
    },
    {
        quote: "Certora + SBF sections are incredible. This fills a huge gap in the Solana education ecosystem.",
        name: "Sebastian Müller",
        handle: "@sebastianmuller",
        avatar: "SM",
    },
    {
        quote: "Builds on a very solid foundation. Really appreciate how they don't skip important underlying concepts — ownership, lifetimes, borrows.",
        name: "Emily Torres",
        handle: "@emilytorres",
        avatar: "ET",
    },
    {
        quote: "Superteam Academy is the only learning resource I recommend to devs entering the ecosystem. Period.",
        name: "Matheus Lima",
        handle: "@matheuslima",
        avatar: "ML",
    },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    return (
        <div className="inline-flex w-[320px] shrink-0 flex-col gap-4 rounded-2xl border-4 p-5">
            <p className="font-game text-xl text-gray-300">
                &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
                    {testimonial.avatar}
                </div>
                <div>
                    <p className="font-game text-lg">{testimonial.name}</p>
                    <p className="font-game text-sm text-gray-500">{testimonial.handle}</p>
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
    return (
        <div className="group relative overflow-hidden">
            <div
                className={`flex gap-4 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
                    } group-hover:[animation-play-state:paused]`}
            >
                {doubled.map((t, i) => (
                    <TestimonialCard key={`${t.handle}-${i}`} testimonial={t} />
                ))}
            </div>
        </div>
    );
}

export function TestimonialsSection() {
    const headerRef = useRef<HTMLDivElement>(null);
    const headerInView = useInView(headerRef, { once: true, margin: "-40px" });

    return (
        <section className="w-full overflow-hidden py-16 bg-zinc-900">
            <motion.div
                ref={headerRef}
                initial={{ opacity: 0, y: 16 }}
                animate={headerInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="mb-12 text-center"
            >
                <h2 className="text-4xl font-game">
                    What <span className="text-yellow-400">Students</span> Say
                </h2>
            </motion.div>

            <div className="flex flex-col gap-4">
                <MarqueeRow testimonials={TESTIMONIALS_ROW_1} direction="left" />
                <MarqueeRow testimonials={TESTIMONIALS_ROW_2} direction="right" />
            </div>
        </section>
    );
}
