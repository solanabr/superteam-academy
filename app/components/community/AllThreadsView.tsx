"use client";

import {
	ArrowLeftIcon,
	ChatCircleTextIcon,
	FunnelIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { DotGrid } from "@/components/shared/DotGrid";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { mockDiscussions } from "@/lib/data/community";

export function AllThreadsView() {
	return (
		<div className="min-h-screen bg-bg-base relative">
			<DotGrid />

			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_350px] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full relative z-10">
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>

				<NavRail />

				<main className="p-4 lg:p-8 flex flex-col gap-10 overflow-visible lg:overflow-y-auto w-full">
					{/* Header */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-ink-secondary/20 dark:border-border pb-6">
						<div>
							<Link
								href="/community"
								className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-ink-secondary hover:text-ink-primary transition-colors mb-4"
							>
								<ArrowLeftIcon /> RETURN TO HUB
							</Link>
							<h1 className="font-display text-4xl lg:text-5xl leading-none -tracking-wider text-ink-primary uppercase">
								All Transmissions
							</h1>
							<p className="text-ink-secondary mt-2 max-w-xl text-sm font-mono">
								Complete log of all network discussions and queries.
							</p>
						</div>

						<Button
							asChild
							className="bg-ink-primary hover:bg-ink-primary/90 text-bg-base font-bold uppercase tracking-widest rounded-none flex items-center gap-2"
						>
							<Link href="/community/new">
								<PlusIcon weight="bold" />
								New Transmission
							</Link>
						</Button>
					</div>

					<div className="flex flex-col gap-6">
						<div className="flex justify-between items-center mb-2 border-b border-border pb-4">
							<div className="text-[10px] font-bold uppercase tracking-widest text-ink-secondary flex items-center gap-2 border border-ink-secondary/30 px-2 py-1 bg-surface">
								<ChatCircleTextIcon /> {mockDiscussions.length} TOTAL THREADS
							</div>
							<Button
								variant="ghost"
								className="h-8 rounded-none text-[10px] uppercase tracking-widest font-bold text-ink-secondary hover:bg-ink-primary/10 transition-colors flex items-center gap-1.5 px-3 border border-border"
							>
								<FunnelIcon weight="duotone" /> FILTER LOGS
							</Button>
						</div>

						<div className="border border-ink-secondary/20 dark:border-border bg-surface/50 backdrop-blur-sm divide-y divide-ink-secondary/20 dark:divide-border">
							{mockDiscussions.map((disc) => (
								<Link
									href={`/community/${disc.slug}`}
									key={disc.id}
									className="block group relative bg-surface/50 hover:bg-ink-primary/5 transition-colors"
								>
									{/* Corner Accents */}
									<div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
									<div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

									<div className="p-4 flex justify-between gap-4">
										<div>
											<span className="text-[10px] uppercase tracking-widest text-bg-base bg-ink-primary px-1.5 py-0.5 mb-2 inline-block font-bold mt-1">
												[{disc.category}]
											</span>
											<h3 className="font-display text-2xl leading-none mt-1 group-hover:text-ink-primary transition-colors">
												{disc.title}
											</h3>
											<p className="text-[11px] uppercase tracking-widest text-ink-secondary mt-2 flex items-center gap-1.5">
												<i className={disc.avatar}></i> INIT BY {disc.author}
											</p>
										</div>
										<div className="text-right shrink-0 flex flex-col justify-between items-end">
											<div className="text-[11px] font-bold font-mono border border-ink-secondary/30 px-2 py-0.5 bg-bg-surface">
												{disc.replies} RESP
											</div>
											<div className="text-[10px] text-ink-tertiary mt-2 uppercase tracking-widest">
												{disc.lastActive}
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>
					</div>
				</main>

				<CommunitySidebar />
			</div>
		</div>
	);
}
