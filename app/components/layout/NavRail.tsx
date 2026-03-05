/**
 * @fileoverview Left-side navigation rail for desktop view.
 * Provides a vertical set of icon-based links for quick access to core sections.
 */
"use client";

import { useState } from "react";
import {
	BookIcon,
	CaretLeft,
	CaretRight,
	ChalkboardTeacherIcon,
	Gear,
	ShieldCheckIcon,
	SquaresFourIcon,
	SwordIcon,
	TrophyIcon,
	UserIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import { Link, usePathname } from "@/i18n/routing";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export function NavRail() {
	const pathname = usePathname();
	const { data: session, isPending } = useSession();
	const [isPinned, setIsPinned] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const expanded = isPinned || isHovered;

	const navItems = [
		{
			icon: SquaresFourIcon,
			label: "Dashboard",
			href: "/dashboard",
			active: pathname === "/dashboard",
		},
		{
			icon: BookIcon,
			label: "Courses",
			href: "/courses",
			active: pathname?.includes("/courses"),
		},
		{
			icon: SwordIcon,
			label: "Challenges",
			href: "/challenges",
			active: pathname?.includes("/challenges"),
		},
		{
			icon: TrophyIcon,
			label: "Leaderboard",
			href: "/leaderboard",
			active: pathname === "/leaderboard",
		},
		{
			icon: UsersIcon,
			label: "Community",
			href: "/community",
			active: pathname === "/community",
		},
	];

	return (
		<aside
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={cn(
				"border-r border-ink-secondary/20 dark:border-border hidden lg:flex flex-col pt-6 bg-bg-struct gap-5 sticky top-12 h-[calc(100vh-48px)] transition-all duration-300 z-30",
				expanded
					? "w-56 px-4 items-stretch"
					: "w-[72px] items-center px-0 overflow-hidden",
			)}
		>
			{/* Navigation Items */}
			<div className="flex flex-col gap-5">
				{navItems.map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.label}
							href={item.href}
							className={cn(
								"flex items-center relative transition-colors border border-transparent hover:bg-ink-primary/5",
								expanded
									? "h-10 px-3 w-full justify-start gap-4"
									: "w-8 h-8 justify-center rounded-none",
								item.active && "border-ink-secondary/20 bg-ink-primary/5",
							)}
							title={expanded ? undefined : item.label}
						>
							<Icon
								size={18}
								className="text-ink-primary shrink-0"
								weight={item.active ? "duotone" : "regular"}
							/>
							{expanded && (
								<span className="font-bold uppercase tracking-widest text-xs text-ink-primary whitespace-nowrap overflow-hidden">
									{item.label}
								</span>
							)}
						</Link>
					);
				})}
			</div>

			{/* Authenticated Links (Profile, Creator, Admin) */}
			<div className="mt-auto flex flex-col gap-5 mb-2">
				{isPending ? (
					<>
						<div
							className={cn(
								"bg-ink-primary/5 animate-pulse border border-ink-secondary/10",
								expanded ? "h-10 w-full" : "w-8 h-8",
							)}
						/>
						<div
							className={cn(
								"bg-ink-primary/5 animate-pulse border border-ink-secondary/10",
								expanded ? "h-10 w-full" : "w-8 h-8",
							)}
						/>
						<div
							className={cn(
								"bg-ink-primary/5 animate-pulse border border-ink-secondary/10",
								expanded ? "h-10 w-full" : "w-8 h-8",
							)}
						/>
					</>
				) : session ? (
					<>
						<Link
							href="/profile"
							className={cn(
								"flex items-center relative transition-colors border border-transparent hover:bg-ink-primary/5",
								expanded
									? "h-10 px-3 w-full justify-start gap-4"
									: "w-8 h-8 justify-center rounded-none",
								pathname?.includes("/profile") &&
									"border-ink-secondary/20 bg-ink-primary/5",
							)}
							title={expanded ? undefined : "Profile"}
						>
							<UserIcon
								size={18}
								className="text-ink-primary shrink-0"
								weight={pathname?.includes("/profile") ? "duotone" : "regular"}
							/>
							{expanded && (
								<span className="font-bold uppercase tracking-widest text-xs text-ink-primary whitespace-nowrap overflow-hidden">
									Profile
								</span>
							)}
						</Link>

						<Link
							href="/creator"
							className={cn(
								"flex items-center relative transition-colors border border-transparent hover:bg-ink-primary/5",
								expanded
									? "h-10 px-3 w-full justify-start gap-4"
									: "w-8 h-8 justify-center rounded-none",
								pathname === "/creator" &&
									"border-ink-secondary/20 bg-ink-primary/5",
							)}
							title={expanded ? undefined : "Creator Studio"}
						>
							<ChalkboardTeacherIcon
								size={18}
								className="text-ink-primary shrink-0"
								weight={pathname === "/creator" ? "duotone" : "regular"}
							/>
							{expanded && (
								<span className="font-bold uppercase tracking-widest text-xs text-ink-primary whitespace-nowrap overflow-hidden">
									Creator Studio
								</span>
							)}
						</Link>

						{/* Admin Dashboard (Admins Only) */}
						{(session.user as { role?: string }).role === "admin" && (
							<Link
								href="/admin"
								className={cn(
									"flex items-center relative transition-colors border border-transparent hover:bg-ink-primary/5",
									expanded
										? "h-10 px-3 w-full justify-start gap-4"
										: "w-8 h-8 justify-center rounded-none",
									pathname === "/admin" &&
										"border-ink-secondary/20 bg-ink-primary/5",
								)}
								title={expanded ? undefined : "Admin Dashboard"}
							>
								<ShieldCheckIcon
									size={18}
									className="text-ink-primary shrink-0"
									weight={pathname === "/admin" ? "duotone" : "regular"}
								/>
								{expanded && (
									<span className="font-bold uppercase tracking-widest text-xs text-ink-primary whitespace-nowrap overflow-hidden">
										Admin Dashboard
									</span>
								)}
							</Link>
						)}

						<Link
							href="/settings"
							className={cn(
								"flex items-center relative transition-colors border border-transparent hover:bg-ink-primary/5",
								expanded
									? "h-10 px-3 w-full justify-start gap-4"
									: "w-8 h-8 justify-center rounded-none",
								pathname?.includes("/settings") &&
									"border-ink-secondary/20 bg-ink-primary/5",
							)}
							title={expanded ? undefined : "Settings"}
						>
							<Gear
								size={18}
								className="text-ink-primary shrink-0"
								weight={pathname?.includes("/settings") ? "duotone" : "regular"}
							/>
							{expanded && (
								<span className="font-bold uppercase tracking-widest text-xs text-ink-primary whitespace-nowrap overflow-hidden">
									Settings
								</span>
							)}
						</Link>
					</>
				) : null}

				{/* Toggle Expand/Collapse */}
				<button
					onClick={() => setIsPinned(!isPinned)}
					className={cn(
						"flex items-center relative transition-colors border border-transparent hover:bg-ink-primary/5 text-ink-secondary hover:text-ink-primary mt-2",
						expanded
							? "h-10 px-3 w-full justify-start gap-4"
							: "w-8 h-8 justify-center rounded-none",
					)}
					title={isPinned ? "Unpin Nav" : "Pin Nav"}
				>
					{isPinned ? (
						<CaretLeft size={18} className="shrink-0" />
					) : (
						<CaretRight size={18} className="shrink-0" />
					)}
					{expanded && (
						<span className="font-bold uppercase tracking-widest text-[10px] whitespace-nowrap overflow-hidden">
							{isPinned ? "Unpin" : "Pin Open"}
						</span>
					)}
				</button>
			</div>
		</aside>
	);
}
