/**
 * @fileoverview Component for displaying curated learning paths (e.g., SOLANA FUNDAMENTALS).
 */
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { CpuIcon, StackIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "@/i18n/routing";
import { LearningPath } from "@/lib/data/courses";

interface CuratedPathsProps {
	paths: LearningPath[];
}

/**
 * CuratedPaths Component
 * Renders a list of specialized learning tracks with progress tracking.
 */
export function CuratedPaths({ paths }: CuratedPathsProps) {
	const t = useTranslations("Courses");

	const getIcon = (iconName: string) => {
		const icons: Record<string, typeof StackIcon> = {
			StackIcon,
			CpuIcon,
		};
		return icons[iconName] || StackIcon;
	};

	return (
		<div className="mb-16">
			<div className="flex justify-between items-end mb-6">
				<h3 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[24px] sm:text-[32px] flex items-center gap-3">
					{t("curatedPaths.title")}
					<span className="text-sm font-normal bg-ink-primary text-bg-base px-2 py-1 rounded-sm vertical-middle">
						COMING SOON
					</span>
				</h3>
				<span className="text-[10px] uppercase tracking-widest text-ink-secondary">
					{t("curatedPaths.subtitle")}
				</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{paths.map((path) => {
					const Icon = getIcon(path.icon);
					return (
						<Link
							key={path.id}
							href={`/courses/${path.slug}`}
							onClick={() => {
								posthog.capture("curated_path_clicked", {
									slug: path.slug,
									title: path.title,
								});
								sendGAEvent("event", "select_content", {
									content_type: "learning_path", // Corrected content_type
									item_id: path.slug,
								});
							}}
							className="border border-border bg-bg-surface hover:border-ink-primary hover:shadow-[4px_4px_0_var(--color-border)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all relative group"
						>
							{/* Corner accents */}
							<div className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 border-ink-primary" />
							<div className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 border-ink-primary" />

							<div className="grid grid-cols-[100px_1fr] sm:grid-cols-[1.2fr_1fr] h-full">
								{/* Visual */}
								<div className="bg-ink-secondary/5 border-r border-border relative flex items-center justify-center bg-[linear-gradient(45deg,var(--ink-secondary)_1px,transparent_1px)] bg-size-[10px_10px]">
									<Icon
										size={32}
										className="text-ink-primary sm:hidden"
										weight="fill"
									/>
									<Icon
										size={48}
										className="text-ink-primary hidden sm:block"
										weight="fill"
									/>
									<div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-widest text-ink-secondary hidden sm:block">
										REF: {path.ref}
									</div>
								</div>

								{/* Content */}
								<div className="p-6 flex flex-col min-h-full">
									<div className="grow">
										<div className="text-[10px] uppercase tracking-widest text-ink-secondary mb-1">
											{t(`curatedPaths.tracks.${path.track}`)}
										</div>
										<h4 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[22px] sm:text-[28px] mb-2">
											{path.title}
										</h4>
										<p className="text-ink-secondary text-[11px] leading-relaxed">
											{path.description}
										</p>
									</div>

									<div className="mt-6">
										<div className="flex gap-2 mb-3">
											<span className="text-[10px] uppercase tracking-widest px-2 py-1 border border-border">
												{path.modules} {t("curatedPaths.modules")}
											</span>
											<span className="text-[10px] uppercase tracking-widest px-2 py-1 border border-border">
												{path.duration}
											</span>
										</div>

										{path.progress > 0 ? (
											<div className="flex items-center gap-3">
												<Progress
													value={path.progress}
													className="h-1 flex-1"
												/>
												<div className="text-[10px] text-right uppercase tracking-widest text-ink-secondary whitespace-nowrap">
													{path.progress}% {t("curatedPaths.complete")}
												</div>
											</div>
										) : (
											<Button
												variant="landingSecondary"
												className="w-full rounded-none uppercase text-[10px] font-bold px-3 py-2 h-auto tracking-widest"
											>
												{t("curatedPaths.startPath")}
											</Button>
										)}
									</div>
								</div>
							</div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
