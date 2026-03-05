"use client";

import { ActionBar } from "@/components/certificate/ActionBar";
import { BlockchainProof } from "@/components/certificate/BlockchainProof";
import { CertificateDisplay } from "@/components/certificate/CertificateDisplay";
import { CourseMastery } from "@/components/certificate/CourseMastery";
import { OnChainMetadata } from "@/components/certificate/OnChainMetadata";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { Certificate } from "@/lib/data/certificates";

interface CertificateViewProps {
	certificate: Certificate;
	isOwner?: boolean;
}

export function CertificateView({
	certificate,
	isOwner = false,
}: CertificateViewProps) {
	return (
		<div className="min-h-screen bg-bg-base overflow-x-hidden relative">
			{/* App Shell Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-[60px_minmax(0,1fr)_350px] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full relative z-10">
				{/* Top Bar - spans all columns */}
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>

				{/* Nav Rail */}
				<NavRail />

				{/* Main Stage */}
				<section className="p-4 md:p-6 lg:p-10 overflow-x-hidden lg:overflow-y-auto flex flex-col items-center max-w-full relative">
					{/* Dots Grid Background for ONLY the main stage */}
					<div
						className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0"
						style={{
							backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
							backgroundSize: "16px 16px",
						}}
					></div>

					<div className="w-full max-w-5xl flex flex-col gap-6 md:gap-8 relative z-10">
						{/* Section Header */}
						<div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div>
								<span className="bg-zinc-950 dark:bg-zinc-800 text-white px-3 py-1 text-[10px] uppercase tracking-widest inline-block font-black shadow-sm">
									Credential Issued
								</span>
								<h2 className="font-display text-xl md:text-2xl lg:text-[32px] leading-tight md:leading-none -tracking-wider mt-2 uppercase wrap-break-word">
									{certificate.courseName}{" "}
									<span className="opacity-30">{"//"}</span> COMPLETION
								</h2>
							</div>
						</div>

						{/* Certificate Display - Fixed aspect ratio with max-width containment */}
						<div className="w-full overflow-hidden shadow-2xl">
							<CertificateDisplay certificate={certificate} />
						</div>

						{/* Action Bar */}
						<ActionBar
							isOwner={isOwner}
							mintAddress={certificate.onChain.mintAddress}
							courseName={certificate.courseName}
						/>
					</div>
				</section>

				{/* Context Panel (Right Sidebar) - Merged Layout */}
				<aside className="border-t lg:border-t-0 lg:border-l border-ink-secondary/20 dark:border-border p-0 flex flex-col h-full overflow-x-hidden max-w-full">
					<div className="p-4 md:p-5 lg:p-6 overflow-y-auto flex flex-col gap-8 scrollbar-hide shrink-0">
						<div className="flex flex-col gap-8">
							<OnChainMetadata onChain={certificate.onChain} />
							<div className="h-px bg-border/40 w-full"></div>
							<CourseMastery mastery={certificate.mastery} />
							<div className="h-px bg-border/40 w-full"></div>
						</div>

						<BlockchainProof signature={certificate.onChain.mintAddress} />
					</div>
				</aside>
			</div>
		</div>
	);
}
