/**
 * @fileoverview Application footer component.
 * Displays brand information, site links, social links, and language selector.
 */
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { LanguageDropdown } from "@/components/LanguageDropdown";
import { Logo } from "@/components/shared/logo";
import { Link } from "@/i18n/routing";

export function Footer() {
	const t = useTranslations("Footer");

	const handleFooterLinkClick = (label: string) => {
		posthog.capture("footer_link_clicked", { link: label });
		sendGAEvent("event", "footer_interaction", { label });
	};

	const handleSocialLinkClick = (label: string) => {
		posthog.capture("social_link_clicked", { platform: label });
		sendGAEvent("event", "social_interaction", { platform: label });
	};

	return (
		<footer className="bg-bg-surface border-t border-ink-secondary/20 dark:border-border">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 px-6 md:px-12 py-12 md:py-20">
				<div className="md:col-span-2 flex flex-col justify-between">
					<div>
						<div className="flex items-center gap-4 mb-6">
							<Logo className="h-6 w-auto text-ink-primary" />
							<span className="font-bold uppercase tracking-widest text-[13px]">
								{t("brand")}
							</span>
						</div>
						<p className="text-ink-secondary text-[11px] max-w-[200px]">
							{t("description")}
						</p>

						<div className="mt-8">
							<LanguageDropdown variant="detailed" />
						</div>
					</div>
					<div className="mt-8 text-[11px] text-ink-secondary uppercase tracking-widest">
						{t("copyright")}
					</div>
				</div>

				<div>
					<h4 className="uppercase tracking-widest text-ink-secondary text-[11px] mb-6">
						{t("headers.platform")}
					</h4>
					<ul className="flex flex-col gap-3">
						{[
							{ label: t("links.catalog"), href: "/courses" },
							{ label: t("links.leaderboard"), href: "/leaderboard" },
							{ label: t("links.dashboard"), href: "/dashboard" },
							{ label: t("links.profile"), href: "/profile" },
							{ label: t("links.terms"), href: "/terms" },
							{ label: t("links.privacy"), href: "/privacy" },
						].map((item) => (
							<li key={item.label}>
								<Link
									href={item.href}
									onClick={() => handleFooterLinkClick(item.label)}
									className="text-ink-secondary text-[11px] hover:text-ink-primary transition-colors"
								>
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</div>

				<div>
					<h4 className="uppercase tracking-widest text-ink-secondary text-[11px] mb-6">
						{t("headers.socials")}
					</h4>
					<ul className="flex flex-col gap-3">
						{["Twitter / X", "Discord", "GitHub", "LinkedIn"].map((item) => (
							<li key={item}>
								<Link
									href="#"
									onClick={() => handleSocialLinkClick(item)}
									className="text-ink-secondary text-[11px] hover:text-ink-primary transition-colors"
								>
									{item}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
		</footer>
	);
}
