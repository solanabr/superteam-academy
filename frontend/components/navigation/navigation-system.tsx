"use client";

import { useState } from "react";
import Image from "next/image";
import {
	Home,
	BookOpen,
	Code,
	Trophy,
	User,
	Settings,
	Search,
	Menu,
	Bell,
	MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationItem {
	id: string;
	label: string;
	href: string;
	icon: React.ReactNode;
	badge?: number;
	children?: NavigationItem[];
}

interface NavigationSystemProps {
	user?: {
		name: string;
		avatar?: string;
		level: number;
		notifications: number;
	};
	onSearch?: (query: string) => void;
}

export function NavigationSystem({ user, onSearch }: NavigationSystemProps) {
	const t = useTranslations("navigation");
	const { toast } = useToast();
	const pathname = usePathname();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [_isSearchFocused, setIsSearchFocused] = useState(false);

	const navigationItems: NavigationItem[] = [
		{
			id: "home",
			label: t("home"),
			href: "/",
			icon: <Home className="h-4 w-4" />,
		},
		{
			id: "courses",
			label: t("courses"),
			href: "/courses",
			icon: <BookOpen className="h-4 w-4" />,
			children: [
				{
					id: "all-courses",
					label: t("allCourses"),
					href: "/courses",
					icon: <BookOpen className="h-4 w-4" />,
				},
				{
					id: "my-courses",
					label: t("myCourses"),
					href: "/courses/my",
					icon: <BookOpen className="h-4 w-4" />,
				},
				{
					id: "certificates",
					label: t("certificates"),
					href: "/certificates",
					icon: <Trophy className="h-4 w-4" />,
				},
			],
		},
		{
			id: "challenges",
			label: t("challenges"),
			href: "/challenges",
			icon: <Code className="h-4 w-4" />,
		},
		{
			id: "leaderboard",
			label: t("leaderboard"),
			href: "/leaderboard",
			icon: <Trophy className="h-4 w-4" />,
		},
		{
			id: "profile",
			label: t("profile"),
			href: "/profile",
			icon: <User className="h-4 w-4" />,
		},
	];

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			onSearch?.(searchQuery);
			toast({
				title: t("searching"),
				description: t("searchingFor", { query: searchQuery }),
			});
		}
	};

	const isActive = (href: string) => {
		if (href === "/") return pathname === "/";
		return pathname.startsWith(href);
	};

	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center">
				<div className="mr-4 hidden md:flex">
					<Link href="/" className="mr-6 flex items-center space-x-2">
						<Image
							src="/logo.svg"
							alt="Superteam Academy"
							width={160}
							height={35}
							priority={true}
						/>
					</Link>
				</div>

				<NavigationMenu className="hidden md:flex">
					<NavigationMenuList>
						{navigationItems.map((item) => (
							<NavigationMenuItem key={item.id}>
								{item.children ? (
									<>
										<NavigationMenuTrigger
											className={isActive(item.href) ? "bg-accent" : ""}
										>
											<div className="flex items-center gap-2">
												{item.icon}
												{item.label}
												{item.badge && (
													<Badge variant="secondary" className="ml-1">
														{item.badge}
													</Badge>
												)}
											</div>
										</NavigationMenuTrigger>
										<NavigationMenuContent>
											<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
												{item.children.map((child) => (
													<li key={child.id}>
														<NavigationMenuLink asChild={true}>
															<Link
																href={child.href}
																className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
															>
																<div className="flex items-center gap-2">
																	{child.icon}
																	<div className="text-sm font-medium leading-none">
																		{child.label}
																	</div>
																</div>
															</Link>
														</NavigationMenuLink>
													</li>
												))}
											</ul>
										</NavigationMenuContent>
									</>
								) : (
									<NavigationMenuLink asChild={true}>
										<Link
											href={item.href}
											className={`group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 ${
												isActive(item.href) ? "bg-accent" : ""
											}`}
										>
											<div className="flex items-center gap-2">
												{item.icon}
												{item.label}
												{item.badge && (
													<Badge variant="secondary" className="ml-1">
														{item.badge}
													</Badge>
												)}
											</div>
										</Link>
									</NavigationMenuLink>
								)}
							</NavigationMenuItem>
						))}
					</NavigationMenuList>
				</NavigationMenu>

				<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
					<div className="w-full flex-1 md:w-auto md:flex-none">
						<form onSubmit={handleSearch} className="relative">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder={t("search")}
								className="pl-8 md:w-[300px] lg:w-[400px]"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onFocus={() => setIsSearchFocused(true)}
								onBlur={() => setIsSearchFocused(false)}
							/>
						</form>
					</div>

					{user ? (
						<div className="flex items-center gap-2">
							<Button variant="ghost" size="sm" className="relative">
								<Bell className="h-4 w-4" />
								{user.notifications > 0 && (
									<Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
										{user.notifications}
									</Badge>
								)}
							</Button>

							<Button variant="ghost" size="sm">
								<MessageSquare className="h-4 w-4" />
							</Button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild={true}>
									<Button
										variant="ghost"
										className="relative h-8 w-8 rounded-full"
									>
										{user.avatar ? (
											<img
												src={user.avatar}
												alt={user.name}
												className="h-8 w-8 rounded-full"
											/>
										) : (
											<div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center">
												<User className="h-4 w-4 text-white" />
											</div>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-56" align="end" forceMount={true}>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1">
											<p className="text-sm font-medium leading-none">
												{user.name}
											</p>
											<p className="text-xs leading-none text-muted-foreground">
												{t("level")} {user.level}
											</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild={true}>
										<Link href="/profile">
											<User className="mr-2 h-4 w-4" />
											<span>{t("profile")}</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild={true}>
										<Link href="/settings">
											<Settings className="mr-2 h-4 w-4" />
											<span>{t("settings")}</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem>
										<span>{t("logout")}</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					) : (
						<div className="flex items-center gap-2">
							<Button variant="ghost" asChild={true}>
								<Link href="/login">{t("login")}</Link>
							</Button>
							<Button asChild={true}>
								<Link href="/register">{t("register")}</Link>
							</Button>
						</div>
					)}
				</div>

				<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
					<SheetTrigger asChild={true}>
						<Button
							variant="ghost"
							className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
						>
							<Menu className="h-5 w-5" />
							<span className="sr-only">{t("toggleMenu")}</span>
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="pr-0">
						<div className="flex items-center gap-2 pb-4">
							<div className="h-8 w-8 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
								<BookOpen className="h-5 w-5 text-white" />
							</div>
							<span className="font-bold">Superteam Academy</span>
						</div>
						<div className="space-y-2">
							{navigationItems.map((item) => (
								<div key={item.id}>
									<Link
										href={item.href}
										className={`flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-accent ${
											isActive(item.href) ? "bg-accent" : ""
										}`}
										onClick={() => setIsMobileMenuOpen(false)}
									>
										{item.icon}
										{item.label}
										{item.badge && (
											<Badge variant="secondary" className="ml-auto">
												{item.badge}
											</Badge>
										)}
									</Link>
									{item.children && (
										<div className="ml-6 space-y-1">
											{item.children.map((child) => (
												<Link
													key={child.id}
													href={child.href}
													className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground rounded-md hover:bg-accent"
													onClick={() => setIsMobileMenuOpen(false)}
												>
													{child.icon}
													{child.label}
												</Link>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</header>
	);
}
