"use client";

import { ShieldCheckIcon } from "@phosphor-icons/react";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { DotGrid } from "@/components/shared/DotGrid";
import { Link } from "@/i18n/routing";

export function RestrictedProfile() {
	return (
		<div className="min-h-screen bg-bg-base">
			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_400px] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full">
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>

				<NavRail />

				<section className="p-4 lg:p-8 overflow-visible lg:overflow-y-auto flex flex-col gap-10 col-span-1 lg:col-span-2 relative items-center justify-center min-h-[500px]">
					<DotGrid opacity={0.15} />

					<div className="border border-border bg-bg-surface p-10 max-w-md w-full text-center relative overflow-hidden z-10">
						<div className="absolute top-0 left-0 w-1 h-full bg-ink-primary" />

						{/* Corner Accents */}
						<div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-ink-primary opacity-50" />
						<div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-ink-primary opacity-50" />
						<div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-ink-primary opacity-50" />
						<div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-ink-primary opacity-50" />

						<div className="mb-6 flex justify-center text-ink-secondary">
							<div className="w-16 h-16 border border-ink-secondary/20 bg-ink-primary/5 flex items-center justify-center">
								<ShieldCheckIcon
									size={32}
									weight="duotone"
									className="text-ink-primary"
								/>
							</div>
						</div>

						<h1 className="text-2xl font-display font-bold uppercase tracking-[0.2em] mb-3 text-ink-primary">
							ACCESS RESTRICTED
						</h1>

						<p className="text-[11px] text-ink-secondary leading-relaxed uppercase tracking-widest mb-10 border-t border-b border-border/50 py-4 bg-bg-base/30">
							This profile has been set to private by the operator.
						</p>

						<Link
							href="/leaderboard"
							className="inline-block bg-transparent text-ink-primary border border-ink-primary px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-ink-primary hover:text-bg-base transition-colors w-full"
						>
							Return to Leaderboard
						</Link>
					</div>
				</section>

				{/* Empty Context Panel Area to maintain grid structure */}
				<aside className="border-t lg:border-t-0 lg:border-l border-border bg-bg-base p-6 hidden lg:flex flex-col gap-8 overflow-visible lg:overflow-y-auto relative items-center justify-center">
					<DotGrid opacity={0.05} />
					<div className="opacity-30 border border-dashed border-border p-4 w-full h-full flex flex-col items-center justify-center text-center">
						<ShieldCheckIcon size={48} weight="thin" className="mb-4" />
						<span className="text-[10px] uppercase tracking-widest font-mono">
							Data Unavailable
							<br />
							[Encrypted]
						</span>
					</div>
				</aside>
			</div>
		</div>
	);
}
