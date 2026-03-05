/**
 * @fileoverview Stats strip section for the landing page.
 * Displays key ecosystem metrics with animated counting effects triggered on scroll.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { useTranslations } from "next-intl";

interface CounterProps {
	end: number;
	duration?: number;
	prefix?: string;
	suffix?: string;
}

/**
 * Counter Component
 * Smoothly animates a number from 0 to the 'end' value over a set duration.
 * Uses requestAnimationFrame for performant, fluid updates.
 */
function Counter({
	end,
	duration = 2,
	prefix = "",
	suffix = "",
}: CounterProps) {
	const [count, setCount] = useState(0);
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true });

	useEffect(() => {
		if (!isInView) return;

		let startTime: number;
		let animationFrame: number;

		const animate = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const progress = (timestamp - startTime) / (duration * 1000);

			if (progress < 1) {
				setCount(Math.floor(end * progress));
				animationFrame = requestAnimationFrame(animate);
			} else {
				setCount(end);
			}
		};

		animationFrame = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(animationFrame);
	}, [end, duration, isInView]);

	return (
		<span ref={ref}>
			{prefix}
			{count.toLocaleString()}
			{suffix}
		</span>
	);
}

/**
 * Stats Strip Section
 * Displays key ecosystem growth metrics with counting animations.
 */
export function StatsStrip() {
	const t = useTranslations("StatsStrip");

	const stats = [
		{ label: t("activeStudents"), value: 12402, prefix: "", suffix: "" },
		{ label: t("nodesValidated"), value: 856, prefix: "", suffix: "" },
		{ label: t("bountiesWon"), value: 2.4, prefix: "$", suffix: "M" },
		{ label: t("jobPlacements"), value: 92, prefix: "", suffix: "%" },
	];

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 border-b border-ink-secondary/20 dark:border-border bg-bg-base">
			{stats.map((stat, index) => (
				<div
					key={stat.label}
					className={`p-6 md:p-8 text-center border-b md:border-b-0 border-ink-secondary/20 dark:border-border ${
						index !== stats.length - 1 ? "md:border-r" : ""
					} ${index % 2 === 0 ? "border-r md:border-r-0" : ""}`}
				>
					{/* Metric Label */}
					<span className="block text-[11px] text-ink-secondary uppercase tracking-widest mb-2">
						{stat.label}
					</span>
					{/* Animated Value */}
					<span className="block font-display font-bold leading-[0.9] -tracking-[0.02em] text-[32px] md:text-[48px]">
						<Counter
							end={stat.value}
							prefix={stat.prefix}
							suffix={stat.suffix}
						/>
					</span>
				</div>
			))}
		</div>
	);
}
