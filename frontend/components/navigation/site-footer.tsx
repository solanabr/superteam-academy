"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

const FOOTER_LINKS = {
	learn: [
		{ key: "catalog" as const, href: "/courses" },
		{ key: "topics" as const, href: "/topics" },
		{ key: "learningPaths" as const, href: "/courses?view=paths" },
		{ key: "challenges" as const, href: "/challenges" },
		{ key: "certifications" as const, href: "/certifications" },
	],
	community: [
		{ key: "leaderboard" as const, href: "/leaderboard" },
		{ key: "discord" as const, href: "#" },
		{ key: "forum" as const, href: "/community" },
		{ key: "events" as const, href: "/events" },
		{ key: "blog" as const, href: "/blog" },
	],
	resources: [
		{ key: "documentation" as const, href: "/docs" },
		{ key: "apiReference" as const, href: "/docs/api" },
		{ key: "faqs" as const, href: "/faq" },
		{ key: "helpCenter" as const, href: "/help" },
	],
	company: [
		{ key: "about" as const, href: "/about" },
		{ key: "careers" as const, href: "/careers" },
		{ key: "pricing" as const, href: "/pricing" },
		{ key: "contact" as const, href: "/contact" },
	],
} as const;

const SECTION_KEYS = {
	learn: "learn",
	community: "community",
	resources: "resources",
	company: "company",
} as const;

export function SiteFooter() {
	const t = useTranslations("footer");

	return (
		<footer className="border-t border-border bg-muted/30">
			<div className="mx-auto px-4 sm:px-6">
				<div className="py-12 lg:py-16">
					<div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
						<div className="col-span-2 md:col-span-1 space-y-4">
							<Link href="/" className="inline-block">
								<Image
									src="/logo.svg"
									alt="Superteam Academy"
									width={140}
									height={30}
									className="h-7 w-auto"
								/>
							</Link>
							<p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
								{t("description")}
							</p>
						</div>

						{Object.entries(FOOTER_LINKS).map(([category, links]) => (
							<div key={category}>
								<h3 className="text-sm font-semibold text-foreground mb-3">
									{t(SECTION_KEYS[category as keyof typeof SECTION_KEYS])}
								</h3>
								<ul className="space-y-2">
									{links.map((link) => (
										<li key={link.key}>
											<Link
												href={link.href}
												className="text-sm text-muted-foreground hover:text-foreground transition-colors"
											>
												{t(link.key)}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				<div className="py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
					<p>{t("copyright")}</p>
					<div className="flex items-center gap-6">
						<Link href="/privacy" className="hover:text-foreground transition-colors">
							{t("privacy")}
						</Link>
						<Link href="/terms" className="hover:text-foreground transition-colors">
							{t("terms")}
						</Link>
						<Link href="/cookies" className="hover:text-foreground transition-colors">
							{t("cookies")}
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
