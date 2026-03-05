/**
 * @fileoverview Mobile navigation sheet component.
 * Provides a slide-out menu with links for small screens.
 */
"use client";

import {
	BookIcon,
	ChalkboardTeacherIcon,
	ListIcon,
	ShieldCheckIcon,
	SquaresFourIcon,
	TrophyIcon,
	UserIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { LanguageDropdown } from "@/components/LanguageDropdown";
import { CustomAvatar } from "@/components/shared/CustomAvatar";
import { Logo } from "@/components/shared/logo";
import { WalletButton } from "@/components/shared/WalletButton";
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
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export function MobileNav() {
	const t = useTranslations("Navbar");
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const { data: session } = useSession();
	const user = session?.user;

	const navItems = [
		{
			icon: SquaresFourIcon,
			label: t("cta.dashboard"),
			href: "/dashboard",
			active: pathname === "/dashboard",
		},
		{
			icon: BookIcon,
			label: t("links.catalog"),
			href: "/courses",
			active: pathname?.includes("/courses"),
		},
		{
			icon: TrophyIcon,
			label: t("links.leaderboard"),
			href: "/leaderboard",
			active: pathname === "/leaderboard",
		},
		{
			icon: UsersIcon,
			label: t("links.community"),
			href: "/community",
			active: pathname === "/community",
		},
	];

	const bottomItems = [
		{
			icon: UserIcon,
			label: "Profile",
			href: "/profile",
			active: pathname?.includes("/profile"),
		},
		{
			icon: ChalkboardTeacherIcon,
			label: "Creator",
			href: "/creator",
			active: pathname === "/creator",
		},
		{
			icon: ShieldCheckIcon,
			label: "Admin",
			href: "/admin",
			active: pathname === "/admin",
		},
	];

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="lg:hidden text-ink-primary ml-2"
				>
					<ListIcon size={24} />
					<span className="sr-only">Menu</span>
				</Button>
			</SheetTrigger>
			<SheetContent
				side="right"
				className="bg-bg-surface border-l border-ink-secondary/20 dark:border-border w-[300px] p-0 flex flex-col"
			>
				<SheetHeader className="p-6 border-b border-ink-secondary/20 dark:border-border text-left">
					<SheetTitle className="sr-only">Navigation Menu</SheetTitle>
					<SheetDescription className="sr-only">
						Mobile navigation for the application
					</SheetDescription>

					{user ? (
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 shrink-0 overflow-hidden relative border border-ink-primary/20 bg-ink-secondary/5">
								{user.image ? (
									<Image
										src={user.image}
										alt="Avatar"
										fill
										className="object-cover"
									/>
								) : (
									<CustomAvatar
										seed={user.id}
										size={40}
										className="border-none"
									/>
								)}
							</div>
							<div className="flex flex-col">
								<span className="font-bold uppercase tracking-widest text-xs text-ink-primary leading-tight">
									{user.name || "Operator"}
								</span>
								<span className="text-[10px] text-ink-secondary font-mono truncate max-w-[150px]">
									{user.email || "Academy Member"}
								</span>
							</div>
						</div>
					) : (
						<div className="flex items-center gap-3">
							<Logo className="h-5 w-auto text-ink-primary" />
							<span className="font-bold uppercase tracking-widest text-[11px] text-ink-primary">
								SUPERTEAM ACADEMY
							</span>
						</div>
					)}
				</SheetHeader>

				<div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
					<div className="flex flex-col gap-1">
						<span className="text-[10px] uppercase tracking-widest text-ink-secondary px-4 mb-2">
							Menu
						</span>
						{navItems.map((item) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.label}
									href={item.href}
									onClick={() => setOpen(false)}
									className={cn(
										"flex items-center gap-3 px-4 py-2 rounded-none border border-transparent transition-colors hover:bg-ink-primary/5 hover:border-ink-primary/20",
										item.active &&
											"bg-ink-primary/5 border-ink-primary text-ink-primary",
									)}
								>
									<Icon
										size={18}
										weight={item.active ? "fill" : "regular"}
										className={cn(
											item.active ? "text-ink-primary" : "text-ink-primary/70",
										)}
									/>
									<span
										className={cn(
											"font-bold uppercase tracking-widest text-xs",
											item.active ? "text-ink-primary" : "text-ink-primary/70",
										)}
									>
										{item.label}
									</span>
								</Link>
							);
						})}
					</div>

					<div className="mt-auto flex flex-col gap-1 pt-4 border-t border-ink-secondary/10">
						<div className="px-4 mb-2">
							<WalletButton />
						</div>
						<span className="text-[10px] uppercase tracking-widest text-ink-secondary px-4 mb-1">
							Account
						</span>
						{bottomItems.map((item) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.label}
									href={item.href}
									onClick={() => setOpen(false)}
									className={cn(
										"flex items-center gap-3 px-4 py-2 rounded-none border border-transparent transition-colors hover:bg-ink-primary/5 hover:border-ink-primary/20",
										item.active &&
											"bg-ink-primary/5 border-ink-primary text-ink-primary",
									)}
								>
									<Icon
										size={18}
										weight={item.active ? "fill" : "regular"}
										className={cn(
											item.active ? "text-ink-primary" : "text-ink-primary/70",
										)}
									/>
									<span
										className={cn(
											"font-bold uppercase tracking-widest text-xs",
											item.active ? "text-ink-primary" : "text-ink-primary/70",
										)}
									>
										{item.label}
									</span>
								</Link>
							);
						})}
						<div className="px-4 py-4 flex flex-col gap-4 border-t border-ink-secondary/10">
							<div className="flex flex-col gap-2">
								<span className="text-[10px] uppercase tracking-widest text-ink-secondary font-bold">
									Language
								</span>
								<LanguageDropdown variant="detailed" />
							</div>
							<div className="flex flex-col gap-2">
								<span className="text-[10px] uppercase tracking-widest text-ink-secondary font-bold">
									Appearance
								</span>
								<ModeToggle />
							</div>
						</div>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
