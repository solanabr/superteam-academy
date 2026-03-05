"use client";

import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { DotGrid } from "@/components/shared/DotGrid";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import {
	UsersThreeIcon,
	DiscordLogoIcon,
	ChatCircleTextIcon,
	ArrowRightIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { formatDistanceToNow } from "date-fns";
import { getThreads } from "@/lib/actions/community";

export function CommunityView({
	threads,
}: {
	threads: NonNullable<Awaited<ReturnType<typeof getThreads>>>;
}) {
	return (
		<div className="min-h-screen bg-bg-base relative">
			<DotGrid />

			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_350px] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full relative z-10">
				{/* Top Bar */}
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>

				{/* Nav Rail */}
				<NavRail />

				{/* Main Stage */}
				<main className="p-4 lg:p-8 flex flex-col gap-10 overflow-visible lg:overflow-y-auto w-full">
					{/* Header */}
					<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-ink-secondary/20 dark:border-border pb-6">
						<div>
							<span className="bg-ink-primary text-bg-base px-2 py-1 text-[10px] uppercase tracking-widest inline-block mb-2">
								Network
							</span>
							<h1 className="font-display text-4xl lg:text-5xl leading-none -tracking-wider">
								COMMUNITY HUB
							</h1>
							<p className="text-ink-secondary mt-2 max-w-xl text-sm">
								Connect with other builders, attend exclusive events, and get
								help from experts.
							</p>
						</div>
						<Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-none uppercase text-[11px] font-bold px-6 tracking-widest flex items-center gap-2 shrink-0">
							<DiscordLogoIcon weight="fill" className="w-4 h-4" />
							Join Discord
						</Button>
					</div>

					<div className="flex flex-col gap-8">
						{/* Discussions */}
						<section>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									<ChatCircleTextIcon
										weight="duotone"
										className="w-5 h-5 text-ink-primary"
									/>
									<h2 className="font-bold uppercase tracking-widest text-[13px]">
										Active Transmissions
									</h2>
								</div>
								<Button
									asChild
									variant="outline"
									className="h-8 rounded-none text-[10px] uppercase tracking-widest font-bold border-ink-primary text-ink-primary hover:bg-ink-primary hover:text-bg-base transition-colors flex items-center gap-1 px-3"
								>
									<Link href="/community/new">
										<PlusIcon weight="bold" /> NEW TRANSMISSION
									</Link>
								</Button>
							</div>

							<div className="border border-ink-secondary/20 dark:border-border bg-surface/50 backdrop-blur-sm divide-y divide-ink-secondary/20 dark:divide-border">
								{threads.length === 0 ? (
									<div className="p-8 text-center text-ink-secondary text-sm font-mono uppercase tracking-widest">
										NO TRANSMISSIONS FOUND.
									</div>
								) : (
									threads.map((disc) => (
										<Link
											href={`/community/${disc.slug}`}
											key={disc.id}
											className="block group border-b border-ink-secondary/20 dark:border-border last:border-0 relative bg-surface/50 hover:bg-ink-primary/5 transition-colors"
										>
											{/* Corner Accents */}
											<div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
											<div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

											<div className="p-4 flex justify-between gap-4">
												<div>
													<span className="text-[10px] uppercase tracking-widest text-bg-base bg-ink-primary px-1.5 py-0.5 mb-2 inline-block font-bold">
														[{disc.category}]
													</span>
													<h3 className="font-display text-xl leading-none mt-1 group-hover:text-ink-primary transition-colors">
														{disc.title}
													</h3>
													<p className="text-[11px] uppercase tracking-widest text-ink-secondary mt-2 flex items-center gap-1.5">
														<i
															className={
																disc.authorAvatar || "bi bi-person-badge"
															}
														></i>{" "}
														INIT BY {disc.authorName || "Unknown"}
													</p>
												</div>
												<div className="text-right shrink-0 flex flex-col justify-between items-end">
													<div className="text-[11px] font-bold font-mono border border-ink-secondary/30 px-2 py-0.5 bg-bg-surface">
														{disc.replies} RESP
													</div>
													<div className="text-[10px] text-ink-tertiary mt-1 uppercase tracking-widest">
														{formatDistanceToNow(new Date(disc.lastActiveAt), {
															addSuffix: true,
														})}
													</div>
												</div>
											</div>
										</Link>
									))
								)}
								<div className="p-3 bg-fg-base/5 flex justify-center border-t border-ink-secondary/20 dark:border-border">
									<Button
										asChild
										variant="ghost"
										className="text-[11px] uppercase tracking-widest h-auto py-1 hover:text-ink-primary"
									>
										<Link href="/community/threads">
											View All Threads{" "}
											<ArrowRightIcon className="w-3 h-3 ml-1" />
										</Link>
									</Button>
								</div>
							</div>
						</section>

						{/* Top Contributors */}
						<section>
							<div className="flex items-center gap-2 mb-4">
								<UsersThreeIcon
									weight="duotone"
									className="w-5 h-5 text-ink-primary"
								/>
								<h2 className="font-bold uppercase tracking-widest text-[13px]">
									Top Operatives This Week
								</h2>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
								{[1, 2, 3, 4].map((i) => (
									<div
										key={i}
										className="border border-ink-secondary/20 dark:border-border bg-surface p-4 text-center relative group hover:border-ink-primary transition-colors cursor-default"
									>
										<div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
										<div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

										<div className="w-12 h-12 bg-ink-primary/5 mx-auto rounded-none mb-3 border border-border flex items-center justify-center text-xl text-ink-primary/70 group-hover:text-ink-primary group-hover:bg-ink-primary/10 transition-colors">
											<i
												className={
													i % 2 === 0
														? "bi bi-person-bounding-box"
														: "bi bi-person-badge"
												}
											></i>
										</div>
										<div className="font-bold text-sm truncate uppercase tracking-widest">
											USER_{100 + i}
										</div>
										<div className="text-[10px] text-ink-secondary uppercase tracking-widest mt-1 border-t border-ink-secondary/20 pt-1">
											Rank {i}
										</div>
									</div>
								))}
							</div>
						</section>
					</div>
				</main>

				<CommunitySidebar />
			</div>
		</div>
	);
}
