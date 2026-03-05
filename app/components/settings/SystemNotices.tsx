/**
 * @fileoverview Component for displaying system security and administrative notices.
 */
"use client";

import { SystemNotice } from "@/lib/data/settings";

interface SystemNoticesProps {
	notices: SystemNotice[];
}

export function SystemNotices({ notices }: SystemNoticesProps) {
	return (
		<div className="border border-dashed border-ink-secondary bg-bg-surface p-4 relative opacity-80">
			<span className="absolute -top-2.5 left-3 bg-bg-base px-2 text-[10px] uppercase tracking-widest font-bold">
				System Notices
			</span>

			<div className="mt-3">
				<div className="text-[10px] font-bold uppercase tracking-widest mb-2">
					Security Audit:
				</div>
				<ul className="list-none text-[11px] flex flex-col gap-2">
					{notices.map((notice, index) => (
						<li key={index}>{notice.message}</li>
					))}
				</ul>
			</div>
		</div>
	);
}
