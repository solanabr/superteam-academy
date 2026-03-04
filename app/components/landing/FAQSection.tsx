"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
    question: string;
    answer: string;
}

const FAQS: FAQItem[] = [
    {
        question: "Is Superteam Academy free?",
        answer: "Yes! All courses and content on Superteam Academy are completely free. We believe in accessible education for everyone entering the Solana ecosystem.",
    },
    {
        question: "Do I need prior blockchain experience?",
        answer: "Not at all. Our 'Intro to Solana' course is designed for complete beginners. We cover everything from blockchain fundamentals to building your first Solana program.",
    },
    {
        question: "What are soulbound credentials?",
        answer: "Soulbound credentials are non-transferable NFTs minted on Solana that prove you've completed a course. They stay permanently in your wallet as verifiable proof of your skills.",
    },
    {
        question: "How does the XP system work?",
        answer: "You earn XP by completing lessons, quizzes, and challenges. XP contributes to your position on the leaderboard and unlocks achievements. Maintain streaks for bonus XP!",
    },
    {
        question: "What programming languages do I need to know?",
        answer: "Basic knowledge of JavaScript/TypeScript is helpful. For advanced courses, familiarity with Rust is beneficial — but we teach the Rust fundamentals you need along the way.",
    },
    {
        question: "Can I contribute to the platform?",
        answer: "Absolutely! Superteam Academy is open-source. You can contribute to courses, submit challenges, participate in discussions, and help improve the platform on GitHub.",
    },
];

function FAQAccordionItem({
    item,
    isOpen,
    onToggle,
}: {
    item: FAQItem;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="border-b border-white/10 last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between py-5 sm:py-6 text-left group"
            >
                <span className="font-game text-lg sm:text-xl text-foreground pr-4 group-hover:text-yellow-400 transition-colors">
                    {item.question}
                </span>
                <ChevronDown
                    className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
                        isOpen && "rotate-180 text-yellow-400"
                    )}
                />
            </button>
            <div
                className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden">
                    <p className="font-game text-base text-muted-foreground pb-5 sm:pb-6 leading-relaxed pr-8">
                        {item.answer}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function FAQSection() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="w-full py-16 sm:py-24 bg-background">
            <div ref={ref} className="mx-auto max-w-3xl px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="mb-10 sm:mb-12"
                >
                    <p className="mb-2 font-game text-base sm:text-lg tracking-widest text-yellow-400 uppercase">
                        FAQ
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-game leading-tight">
                        Frequently asked questions
                    </h2>
                    <p className="mt-3 font-game text-base sm:text-lg text-muted-foreground">
                        Everything you need to know about Superteam Academy.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="rounded-2xl border border-white/10 bg-card/30 px-5 sm:px-8"
                >
                    {FAQS.map((faq, i) => (
                        <FAQAccordionItem
                            key={i}
                            item={faq}
                            isOpen={openIndex === i}
                            onToggle={() =>
                                setOpenIndex(openIndex === i ? null : i)
                            }
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
