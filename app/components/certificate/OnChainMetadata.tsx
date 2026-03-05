"use client";

import { Certificate } from "@/lib/data/certificates";

interface OnChainMetadataProps {
	onChain: Certificate["onChain"];
}

export function OnChainMetadata({ onChain }: OnChainMetadataProps) {
	return (
		<div className="relative p-6 bg-zinc-50 dark:bg-zinc-900/40 group border border-border/50">
			{/* Corner Accents */}
			<div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-ink-primary z-20" />
			<div className="absolute -top-px -right-px w-2 h-2 border-t border-r border-ink-primary z-20" />
			<div className="absolute -bottom-px -left-px w-2 h-2 border-b border-l border-ink-primary z-20" />
			<div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-ink-primary z-20" />

			{/* Internal Dot Grid */}
			<div
				className="absolute inset-0 opacity-[0.05] pointer-events-none"
				style={{
					backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
					backgroundSize: "24px 24px",
				}}
			/>

			<div className="absolute -top-2 left-6 bg-zinc-950 dark:bg-white px-1.5 z-30">
				<span className="text-[10px] uppercase tracking-[0.2em] font-black text-white dark:text-zinc-950 leading-none">
					ON-CHAIN METADATA
				</span>
			</div>

			<div className="flex flex-col gap-4 relative z-10 mt-2">
				<div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
					<span className="text-[9px] text-zinc-500 tracking-widest uppercase font-bold">
						Asset Type
					</span>
					<span className="text-[10px] font-black tracking-wide text-right uppercase text-ink-primary font-mono">
						{onChain.assetType}
					</span>
				</div>
				<div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
					<span className="text-[9px] text-zinc-500 tracking-widest uppercase font-bold">
						Mint Address
					</span>
					<span
						className="text-[10px] text-right truncate font-mono font-black text-ink-primary"
						title={onChain.mintAddress}
					>
						{`${onChain.mintAddress.slice(0, 8)}...${onChain.mintAddress.slice(-8)}`}
					</span>
				</div>
				<div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
					<span className="text-[9px] text-zinc-500 tracking-widest uppercase font-bold">
						Owner
					</span>
					<span
						className="text-[10px] text-right truncate font-mono font-black text-ink-primary"
						title={onChain.owner}
					>
						{onChain.owner.length > 20
							? `${onChain.owner.slice(0, 8)}...${onChain.owner.slice(-8)}`
							: onChain.owner}
					</span>
				</div>
				<div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
					<span className="text-[9px] text-zinc-500 tracking-widest uppercase font-bold">
						Metadata URI
					</span>
					<span
						className="text-[10px] text-right text-blue-600 dark:text-blue-400 underline truncate font-mono font-black"
						title={onChain.metadataUri}
					>
						<a
							href={onChain.metadataUri}
							target="_blank"
							rel="noopener noreferrer"
						>
							{onChain.metadataUri.replace(/^https?:\/\//, "")}
						</a>
					</span>
				</div>
				<div className="flex justify-between items-center pt-2">
					<span className="text-[9px] text-zinc-500 tracking-widest uppercase font-bold">
						Status
					</span>
					<span className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-2 py-0.5 text-[9px] inline-flex items-center gap-1 font-black rounded-sm uppercase tracking-tighter shadow-sm">
						{onChain.status}
					</span>
				</div>
			</div>
		</div>
	);
}
