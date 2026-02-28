"use client";

import { Link } from "@superteam-academy/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GitHubIcon, DiscordIcon, XIcon } from "@/components/ui/social-icons";
import Logo from "@/public/logo.svg";

const SOCIAL_LINKS = [
	{ href: "https://github.com/superteambr", label: "GitHub", icon: GitHubIcon },
	{ href: "https://discord.gg/superteambrasil", label: "Discord", icon: DiscordIcon },
	{ href: "https://x.com/superteambr", label: "Twitter", icon: XIcon },
] as const;

const FOOTER_LINKS = {
	learn: [
		{ key: "catalog" as const, href: "/courses" },
		{ key: "topics" as const, href: "/topics" },
		{ key: "challenges" as const, href: "/courses" },
	],
	community: [
		{ key: "leaderboard" as const, href: "/leaderboard" },
		{ key: "discord" as const, href: "https://discord.gg/superteambrasil" },
		{ key: "forum" as const, href: "/community/discussions" },
		{ key: "events" as const, href: "/community/events" },
		{ key: "projects" as const, href: "/community/projects" },
	],
	resources: [
		{ key: "documentation" as const, href: "/courses" },
		{ key: "apiReference" as const, href: "/topics" },
		{ key: "faqs" as const, href: "/pricing" },
		{ key: "helpCenter" as const, href: "/settings" },
	],
} as const;

const SECTION_KEYS = {
	learn: "learn",
	community: "community",
	resources: "resources",
} as const;

export function SiteFooter() {
	const t = useTranslations("footer");

	return (
		<footer className="border-t border-border bg-muted/30">
			<div className="mx-auto px-4 sm:px-6">
				<div className="py-12 lg:py-16">
					<div className="grid grid-cols-3 md:grid-cols-5 gap-8 lg:gap-12">
						<div className="col-span-3 md:col-span-2 space-y-4">
							<Link href="/" className="cursor-pointer inline-block">
								<Logo
									width={150}
									height={32}
									className="text-brand dark:text-white"
								/>
							</Link>
							<p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
								{t("description")}
							</p>
							<div className="flex items-center gap-3 pt-1">
								{SOCIAL_LINKS.map((social) => {
									const Icon = social.icon;

									return (
										<a
											key={social.label}
											href={social.href}
											target="_blank"
											rel="noreferrer"
											aria-label={social.label}
											className="text-muted-foreground hover:text-foreground transition-colors"
										>
											<Icon className="h-4 w-4" />
										</a>
									);
								})}
							</div>
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
						<Link href="/settings" className="hover:text-foreground transition-colors">
							{t("privacy")}
						</Link>
						<Link href="/settings" className="hover:text-foreground transition-colors">
							{t("terms")}
						</Link>
						<Link href="/settings" className="hover:text-foreground transition-colors">
							{t("cookies")}
						</Link>{" "}
						<LanguageSwitcher />
					</div>
				</div>
			</div>
		</footer>
	);
}
