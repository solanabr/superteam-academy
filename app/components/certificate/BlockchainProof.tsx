"use client";

interface BlockchainProofProps {
	signature: string;
}

export function BlockchainProof({ signature }: BlockchainProofProps) {
	const truncated = `${signature.slice(0, 12)}...${signature.slice(-12)}`;

	return (
		<div className="mt-4">
			<div className="text-[10px] text-ink-secondary tracking-widest mb-2 font-bold uppercase">
				On-Chain Verification
			</div>
			<div className="bg-zinc-50 dark:bg-zinc-900/40 border border-border p-4 flex items-center justify-between group transition-all hover:border-ink-primary shadow-sm relative">
				{/* Subtle hover accent */}
				<div className="absolute top-0 left-0 w-0.5 h-0.5 bg-ink-primary opacity-0 group-hover:opacity-100 transition-opacity" />
				<div>
					<div className="text-[9px] text-zinc-500 uppercase tracking-tighter mb-1 font-mono font-bold">
						ASSET_IDENTIFIER
					</div>
					<div className="text-[11px] font-mono font-bold leading-none text-ink-primary">
						{truncated}
					</div>
				</div>
				<div className="w-8 h-8 flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-zinc-50 dark:bg-zinc-950 border border-border/50 group-hover:border-emerald-500/30 transition-colors">
					<i className="bi bi-shield-check text-base"></i>
				</div>
			</div>
		</div>
	);
}
