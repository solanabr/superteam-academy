/**
 * @fileoverview Learning paths section for the landing page.
 * Displays curated tracks (Beginner, Intermediate, Advanced) with progress visualization.
 */
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { CaretRightIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// Learning Paths Section
// Displays curated tracks (Beginner, Intermediate, Advanced) with progress visualization.
export function LearningPaths() {
	const t = useTranslations("LearningPaths");

	const tracks = [
		{ key: "beginner", progress: 1 },
		{ key: "intermediate", progress: 2 },
		{ key: "advanced", progress: 3 },
	];

	const handleTrackClick = (trackKey: string) => {
		posthog.capture("landing_track_clicked", { track: trackKey });
		sendGAEvent("event", "track_selection", { track_id: trackKey });
	};

	const handleViewAllClick = () => {
		posthog.capture("landing_view_all_tracks_clicked");
		sendGAEvent("event", "navigation", { destination: "catalog_from_landing" });
	};

	return (
		<section className="px-6 lg:px-12 py-16 lg:py-20 border-b border-ink-secondary/20 dark:border-border bg-bg-base relative z-10">
			{/* Section Header with "View All" Link */}
			<div className="flex justify-between items-end mb-12">
				<div>
					<span className="text-[11px] uppercase tracking-widest text-ink-secondary block mb-2">
						{t("subtitle")}
					</span>
					<h2 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[32px] md:text-[48px]">
						{t("title")}
					</h2>
				</div>
				<Link
					href="/courses"
					onClick={handleViewAllClick}
					className="text-ink-primary text-[11px] font-bold uppercase tracking-widest hover:opacity-60 transition-opacity flex items-center gap-1"
				>
					{t("viewAll")} <CaretRightIcon size={14} />
				</Link>
			</div>

			{/* Grid of Learning Path Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{tracks.map((track) => (
					<div key={track.key} onClick={() => handleTrackClick(track.key)}>
						<Card
							variant="landing"
							className="p-8 h-full cursor-pointer transition-colors hover:border-ink-primary/40 group"
						>
							{/* Corner Accent for Digital Aesthetic */}
							<div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-ink-primary" />

							<span className="text-[11px] text-ink-secondary uppercase tracking-widest mb-2 block">
								{t(`tracks.${track.key}.path`)}
							</span>
							<h3 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[32px] mb-3">
								{t(`tracks.${track.key}.title`)}
							</h3>
							<p className="text-ink-secondary text-sm mb-6 min-h-[40px] leading-relaxed">
								{t(`tracks.${track.key}.description`)}
							</p>

							{/* Multi-step Progress Bar */}
							<div className="h-[2px] bg-line-grid my-6 flex gap-1">
								{[0, 1, 2, 3].map((step) => (
									<div
										key={step}
										className={cn(
											"flex-1 h-full",
											step <= track.progress
												? "bg-ink-primary"
												: "bg-ink-tertiary",
										)}
									/>
								))}
							</div>

							{/* Course Meta Data (XP, Module Count) */}
							<span className="text-[11px] font-bold">
								{t(`tracks.${track.key}.meta`)}
							</span>
						</Card>
					</div>
				))}
			</div>
		</section>
	);
}
