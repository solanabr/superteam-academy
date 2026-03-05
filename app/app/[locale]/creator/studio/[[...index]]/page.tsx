/**
 * @fileoverview Sanity Studio page for course creators.
 * Handles localized routing within the studio.
 */

"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import { NextStudio } from "next-sanity/studio";
import { Link } from "@/i18n/routing";
import config from "@/sanity.config";

/**
 * Renders the Sanity Studio interface with localized base path.
 */
export default function StudioPage() {
	const locale = useLocale();

	// We override the basePath dynamically so that the Studio router
	// is aware of the Next-Intl [locale] prefix.
	const studioConfig = {
		...config,
		basePath: `/${locale}/creator/studio`,
	};

	return (
		<div className="h-screen w-full relative z-50 overflow-hidden">
			{/* Absolute Back Button */}
			<Link
				href="/creator"
				className="fixed bottom-8 left-8 z-100 bg-ink-primary text-bg-base px-6 py-3 font-display font-bold uppercase tracking-widest hover:bg-ink-primary/90 transition-all shadow-xl flex items-center gap-2"
			>
				<ArrowLeftIcon size={16} weight="bold" />
				Dashboard
			</Link>

			{/* We render the Studio in a full viewport container */}
			<div className="h-full pt-14 sm:pt-0">
				<NextStudio config={studioConfig} />
			</div>
		</div>
	);
}
