/**
 * @fileoverview Features section for the landing page.
 * Displays key technological advantages (On-chain Proofs, Live Compiler) in a responsive grid.
 */
"use client";

import { ShieldCheckIcon, TerminalWindowIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { DotGrid } from "@/components/shared/DotGrid";

// Features Section
// Displays key technological advantages in a responsive grid.
// Each feature includes a localized title, description, and an icon.
export function Features() {
	const t = useTranslations("Features");

	const features = [
		{ icon: ShieldCheckIcon, key: "proofs" },
		{ icon: TerminalWindowIcon, key: "compiler" },
	];

	return (
		<section className="grid grid-cols-1 md:grid-cols-2 border-b border-ink-secondary/20 dark:border-border relative overflow-hidden">
			{/* Dot Grid Background */}
			<DotGrid />

			{features.map((feature, i) => (
				<div
					key={feature.key}
					className={`p-8 md:p-16 flex flex-col gap-6 group relative z-10 ${i === 0 ? "border-b md:border-b-0 md:border-r border-ink-secondary/20 dark:border-border" : ""}`}
				>
					{/* Feature Icon */}
					<div>
						<feature.icon
							size={32}
							weight="duotone"
							className="group-hover:text-ink-primary transition-colors"
						/>
					</div>

					{/* Localized Content */}
					<h3 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[32px]">
						{t(`${feature.key}.title`)}
					</h3>
					<p className="text-ink-secondary">
						{t(`${feature.key}.description`)}
					</p>
				</div>
			))}
		</section>
	);
}
