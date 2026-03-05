/**
 * @fileoverview Component for displaying the synchronization status of user data.
 */
"use client";

import { SyncStatus as SyncStatusType } from "@/lib/data/settings";

interface SyncStatusProps {
	status: SyncStatusType;
}

export function SyncStatus({ status }: SyncStatusProps) {
	return (
		<div className="border border-ink-primary bg-bg-surface p-4 relative">
			<div className="absolute -top-1 -left-1 w-2.5 h-2.5">
				<div className="absolute w-full h-px bg-ink-secondary top-1/2"></div>
				<div className="absolute h-full w-px bg-ink-secondary left-1/2"></div>
			</div>
			<div className="absolute -bottom-1 -right-1 w-2.5 h-2.5">
				<div className="absolute w-full h-px bg-ink-secondary top-1/2"></div>
				<div className="absolute h-full w-px bg-ink-secondary left-1/2"></div>
			</div>

			<span className="absolute -top-2.5 left-3 bg-bg-base px-2 text-[10px] uppercase tracking-widest font-bold">
				Sync Status
			</span>

			<div className="mt-3 flex flex-col gap-1">
				<div className="text-[10px]">
					<span className="text-ink-secondary">LAST SYNC:</span>{" "}
					{status.lastSync}
				</div>
				<div className="text-[10px]">
					<span className="text-ink-secondary">INTEGRITY:</span>{" "}
					{status.integrity}
				</div>
				<div className="text-[10px]">
					<span className="text-ink-secondary">ENCRYPTION:</span>{" "}
					{status.encryption}
				</div>
			</div>
		</div>
	);
}
