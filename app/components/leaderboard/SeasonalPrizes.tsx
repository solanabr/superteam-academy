"use client";

export function SeasonalPrizes() {
	return (
		<div className="border border-dashed border-ink-secondary bg-bg-surface p-4 relative opacity-80">
			<span className="absolute -top-2.5 left-3 bg-bg-base px-2 text-[10px] uppercase tracking-widest font-bold">
				SEASONAL PRIZES
			</span>

			<div className="mt-3">
				<div className="text-[10px] font-bold uppercase tracking-widest mb-2">
					Top 3 Finishers:
				</div>
				<ul className="list-none text-[11px] flex flex-col gap-1">
					<li>01. 500 $BONK + EARLY_ACCESS_KEY</li>
					<li>02. 200 $BONK + BETA_PASSPORT</li>
					<li>03. 100 $BONK + DEV_MERCH_DROP</li>
				</ul>
			</div>
		</div>
	);
}
