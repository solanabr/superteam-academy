/**
 * @fileoverview Primary application navigation bar for desktop and mobile.
 * Includes branding, desktop links, theme toggle, user menu, and mobile menu trigger.
 */
"use client";

import {
	ArrowRightIcon,
	BookIcon,
	HouseIcon,
	ListIcon,
	SquaresFourIcon,
	TrophyIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/layout/UserMenu";
import { Logo } from "@/components/shared/logo";
import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/routing";
import { useSession } from "@/lib/auth/client";

export function Navbar() {
	const t = useTranslations("Navbar");
	const pathname = usePathname();
	const { data: session } = useSession();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setMounted(true), 0);
		return () => clearTimeout(t);
	}, []);

	return (
		<nav className="h-16 border-b border-ink-secondary/20 dark:border-border flex items-center justify-between px-6 lg:px-12 bg-bg-surface sticky top-0 z-50">
			{/* Brand Logo */}
			<Link
				href="/"
				className="flex items-center gap-4 hover:opacity-80 transition-opacity"
			>
				<Logo className="h-6 w-auto text-ink-primary" />
				<span className="font-bold uppercase tracking-widest text-[13px] hidden min-[375px]:inline-block">
					{t("brand")}
				</span>
			</Link>

			{/* Desktop Navigation */}
			<div className="hidden lg:flex gap-8">
				{[
					{ label: t("links.catalog"), href: "/courses" },
					{ label: t("links.leaderboard"), href: "/leaderboard" },
					{ label: t("links.community"), href: "/community" },
				].map((item) => (
					<Link
						key={item.label}
						href={item.href}
						className="text-ink-primary text-[11px] font-bold uppercase tracking-widest hover:opacity-60 transition-opacity"
					>
						{item.label}
					</Link>
				))}
			</div>

			{/* Desktop Actions */}
			<div className="hidden lg:flex items-center gap-4">
				{mounted && session && (
					<Button
						asChild
						variant="outline"
						className="rounded-none uppercase text-[11px] font-bold px-4 py-2 h-9 border-ink-secondary/20 hover:bg-ink-primary/5 text-ink-primary gap-2"
					>
						<Link href="/dashboard">
							<SquaresFourIcon size={16} weight="duotone" />
							{t("cta.dashboard")}
						</Link>
					</Button>
				)}
				<ModeToggle />
				{mounted && session ? (
					<UserMenu session={session} />
				) : (
					<div className="flex gap-4">
						<Button
							asChild
							variant="landingPrimary"
							className="rounded-none uppercase text-xs font-bold px-4 py-2 h-auto gap-3"
						>
							<Link href="/courses">{t("cta.start")}</Link>
						</Button>
						<Button
							asChild
							variant="outline"
							className="rounded-none uppercase text-xs font-bold px-4 py-2 h-auto gap-3 border-ink-secondary/20 hover:bg-ink-primary/5 text-ink-primary"
						>
							<Link href="/auth">{t("cta.login")}</Link>
						</Button>
					</div>
				)}
			</div>

			{/* Mobile Menu Trigger */}
			<div className="lg:hidden flex items-center gap-4">
				<Sheet>
					<SheetTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="text-ink-primary"
							aria-label="Open navigation menu"
						>
							<ListIcon size={24} />
						</Button>
					</SheetTrigger>
					<SheetContent
						side="right"
						className="bg-bg-surface border-l border-ink-secondary/20 dark:border-border w-full sm:w-[400px] p-0 flex flex-col"
					>
						<SheetHeader className="p-6 border-b border-ink-secondary/20 dark:border-border">
							<SheetTitle className="sr-only">Menu</SheetTitle>
							<SheetDescription className="sr-only">
								Navigation menu for mobile devices
							</SheetDescription>
							<div className="flex items-center gap-3">
								<Logo className="h-5 w-auto text-ink-primary" />
								<span className="font-bold uppercase tracking-widest text-[11px] text-ink-primary">
									{t("brand")}
								</span>
							</div>
						</SheetHeader>

						<div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
							{/* Mobile Links */}
							<div className="flex flex-col">
								{[
									{ label: "Home", href: "/", icon: HouseIcon },
									{
										label: t("links.catalog"),
										href: "/courses",
										icon: BookIcon,
									},
									{
										label: t("links.leaderboard"),
										href: "/leaderboard",
										icon: TrophyIcon,
									},
									{
										label: t("links.community"),
										href: "/community",
										icon: UsersIcon,
									},
								].map((item) => {
									const isActive =
										item.href === "/"
											? pathname === "/"
											: pathname?.startsWith(item.href);

									return (
										<Link
											key={item.label}
											href={item.href}
											className="flex items-center gap-4 py-3 text-ink-primary group border-b border-ink-secondary/10 last:border-0"
										>
											<div
												className={`w-8 h-8 flex items-center justify-center border border-ink-secondary/20 dark:border-border transition-colors group-hover:border-ink-primary group-hover:bg-ink-primary/5 ${isActive ? "bg-ink-primary/5 border-ink-primary" : "bg-bg-base"}`}
											>
												<item.icon
													size={16}
													weight={isActive ? "duotone" : "regular"}
												/>
											</div>
											<span
												className={`font-bold uppercase tracking-widest text-sm transition-colors ${isActive ? "text-ink-primary" : "group-hover:text-ink-primary/80"}`}
											>
												{item.label}
											</span>
										</Link>
									);
								})}
							</div>

							{/* Mobile Actions */}
							<div className="mt-auto flex flex-col gap-4">
								<div className="flex flex-col gap-3">
									{mounted && session ? (
										<Button
											asChild
											variant="landingSecondary"
											className="w-full rounded-none uppercase text-xs font-bold h-[42px] justify-center gap-2"
										>
											<Link href="/dashboard">
												<SquaresFourIcon size={16} weight="duotone" />
												{t("cta.dashboard")}
											</Link>
										</Button>
									) : (
										<>
											<Button
												asChild
												variant="landingPrimary"
												className="w-full rounded-none uppercase text-xs font-bold h-[42px] justify-center gap-2"
											>
												<Link href="/courses">
													{t("cta.start")}
													<ArrowRightIcon size={14} weight="duotone" />
												</Link>
											</Button>
											<Button
												asChild
												variant="outline"
												className="w-full rounded-none uppercase text-xs font-bold h-[42px] justify-center gap-2 border-ink-secondary/20 hover:bg-ink-primary/5 text-ink-primary"
											>
												<Link href="/auth">{t("cta.login")}</Link>
											</Button>
										</>
									)}
								</div>

								<div className="flex items-center justify-between pt-4 border-t border-ink-secondary/20 dark:border-border">
									<span className="text-[10px] uppercase tracking-widest text-ink-secondary">
										Theme
									</span>
									<ModeToggle />
								</div>
							</div>
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</nav>
	);
}
