/**
 * @fileoverview Testimonials section for the landing page.
 * Features an auto-sliding carousel of student testimonials with Framer Motion transitions.
 */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const testimonials = [
	{
		id: 1,
		quote:
			"The Superteam Academy curriculum didn't just teach me syntax—it taught me how to think in parallel execution. I went from a web2 dev to shipping my first DeFi protocol in 3 months.",
		author: "CYPHER_DOG",
		role: "Lead Engineer @ Drift",
		color: "#2b55c9",
	},
	{
		id: 2,
		quote:
			"The depth of understanding you get here is unmatched. It's not just about writing code; it's about architecting scalable systems on Solana. Truly a 10x developer accelerator.",
		author: "0xMERT",
		role: "Founder @ Helius",
		color: "#e84142",
	},
	{
		id: 3,
		quote:
			"Coming from Ethereum, the account model was confusing until I took this course. The mental model shifts were explained perfectly. Now I'm building high-frequency trading bots.",
		author: "SARAH_DEV",
		role: "Smart Contract Engineer @ Jupiter",
		color: "#16a34a",
	},
];

// Testimonials Section
// Features first-hand reports from industry-leading engineers and founders.
// Implements an auto-sliding carousel with Framer Motion transitions.
export function Testimonials() {
	const t = useTranslations("Testimonials");
	const [currentIndex, setCurrentIndex] = useState(0);

	// Automatic cycle every 5 seconds
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % testimonials.length);
		}, 5000);
		return () => clearInterval(timer);
	}, []);

	return (
		<section className="bg-ink-primary dark:bg-transparent dark:border-y dark:border-ink-secondary/20 text-bg-base dark:text-ink-primary px-6 md:px-12 py-16 md:py-20 min-h-[400px] md:min-h-[500px] flex flex-col justify-center relative overflow-hidden">
			{/* Aesthetic Section Label */}
			<div className="absolute top-12 left-12 text-[11px] uppercase tracking-widest opacity-60">
				{t("sectionLabel")}
			</div>

			<div className="relative max-w-[900px]">
				<AnimatePresence mode="wait">
					<motion.div
						key={testimonials[currentIndex].id}
						initial={{ opacity: 0, x: 40 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -40 }}
						transition={{ duration: 0.5 }}
					>
						{/* The Quote */}
						<blockquote className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[24px] md:text-[40px] mb-8">
							&quot;{testimonials[currentIndex].quote}&quot;
						</blockquote>

						{/* Author Attribution */}
						<div className="flex items-center gap-4">
							<div
								className="w-12 h-12 border border-bg-base"
								style={{ backgroundColor: testimonials[currentIndex].color }}
							/>
							<div>
								<div className="font-bold uppercase tracking-widest">
									{testimonials[currentIndex].author}
								</div>
								<div className="text-[11px] uppercase tracking-widest opacity-60">
									{testimonials[currentIndex].role}
								</div>
							</div>
						</div>
					</motion.div>
				</AnimatePresence>
			</div>

			{/* Navigation Pulse Dots */}
			<div className="absolute bottom-12 right-12 flex gap-2">
				{testimonials.map((_, idx) => (
					<button
						key={idx}
						onClick={() => setCurrentIndex(idx)}
						className={`w-2 h-2 rounded-full transition-all duration-300 ${
							idx === currentIndex
								? "bg-bg-base dark:bg-ink-primary w-8"
								: "bg-bg-base/30 dark:bg-ink-primary/30 hover:bg-bg-base/60 dark:hover:bg-ink-primary/60"
						}`}
						aria-label={`Go to testimonial ${idx + 1}`}
					/>
				))}
			</div>
		</section>
	);
}
