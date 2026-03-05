"use client";

import { TerminalIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function CourseSearch() {
	const t = useTranslations("Courses");
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<div className="flex gap-4 mb-4">
			<div className="flex-1 border border-ink-secondary flex items-center px-4 bg-bg-base">
				<TerminalIcon className="text-ink-secondary mr-3" size={16} />
				<input
					type="text"
					className="border-none bg-transparent w-full py-3 font-mono text-[13px] text-ink-primary placeholder:text-ink-secondary focus:outline-none"
					placeholder={t("search.placeholder")}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				<span className="text-[10px] text-ink-secondary uppercase tracking-widest animate-pulse">
					_
				</span>
			</div>
		</div>
	);
}
