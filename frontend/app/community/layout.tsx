import { getTranslations } from "next-intl/server";
import { CommunityNav } from "@/components/community/community-nav";

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
	const t = await getTranslations("community");

	const navItems = [
		{ href: "/community", label: t("nav.discussions") },
		{ href: "/community/events", label: t("nav.events") },
		{ href: "/community/members", label: t("nav.members") },
		{ href: "/community/projects", label: t("nav.projects") },
	];

	return (
		<div className="min-h-screen">
			<div className="border-b border-border/60 noise">
				<div className="mx-auto px-4 sm:px-6 py-10 sm:py-14">
					<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("title")}</h1>
					<p className="mt-3 text-lg text-muted-foreground max-w-xl">
						{t("description")}
					</p>
				</div>
			</div>

			<CommunityNav items={navItems} />

			<div className="mx-auto px-4 sm:px-6 py-8">{children}</div>
		</div>
	);
}
