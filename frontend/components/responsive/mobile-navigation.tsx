import { useState } from "react";
import { Menu, Home, BookOpen, Code, Trophy, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MobileNavigationItem {
	id: string;
	label: string;
	href: string;
	icon: React.ReactNode;
	badge?: number;
	children?: MobileNavigationItem[];
}

interface MobileNavigationProps {
	user?: {
		name: string;
		avatar?: string;
		level: number;
		notifications: number;
	};
	onSearch?: (query: string) => void;
}

export function MobileNavigation({ user, onSearch: _onSearch }: MobileNavigationProps) {
	const t = useTranslations("navigation");
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

	const navigationItems: MobileNavigationItem[] = [
		{
			id: "home",
			label: t("home"),
			href: "/",
			icon: <Home className="h-5 w-5" />,
		},
		{
			id: "courses",
			label: t("courses"),
			href: "/courses",
			icon: <BookOpen className="h-5 w-5" />,
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
			icon: <Code className="h-5 w-5" />,
		},
		{
			id: "leaderboard",
			label: t("leaderboard"),
			href: "/leaderboard",
			icon: <Trophy className="h-5 w-5" />,
		},
		{
			id: "profile",
			label: t("profile"),
			href: "/profile",
			icon: <User className="h-5 w-5" />,
		},
	];

	const toggleExpanded = (id: string) => {
		const newExpanded = new Set(expandedItems);
		if (newExpanded.has(id)) {
			newExpanded.delete(id);
		} else {
			newExpanded.add(id);
		}
		setExpandedItems(newExpanded);
	};

	const isActive = (href: string) => {
		if (href === "/") return pathname === "/";
		return pathname.startsWith(href);
	};

	const handleLinkClick = () => {
		setIsOpen(false);
		setExpandedItems(new Set());
	};

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild={true}>
				<Button
					variant="ghost"
					size="sm"
					className="md:hidden"
					aria-label={t("toggleMenu")}
				>
					<Menu className="h-5 w-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-80 p-0">
				<div className="flex h-full flex-col">
					<div className="flex items-center justify-between border-b p-4">
						<div className="flex items-center gap-2">
							<div className="h-8 w-8 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
								<BookOpen className="h-5 w-5 text-white" />
							</div>
							<span className="font-bold text-lg">Superteam Academy</span>
						</div>
					</div>

					<nav className="flex-1 overflow-y-auto p-4">
						<div className="space-y-2">
							{navigationItems.map((item) => (
								<div key={item.id}>
									{item.children ? (
										<div>
											<button
												type="button"
												onClick={() => toggleExpanded(item.id)}
												className={cn(
													"flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent",
													isActive(item.href) && "bg-accent"
												)}
											>
												<div className="flex items-center gap-3">
													{item.icon}
													{item.label}
													{item.badge && (
														<Badge variant="secondary" className="ml-2">
															{item.badge}
														</Badge>
													)}
												</div>
												<div
													className={cn(
														"transition-transform",
														expandedItems.has(item.id) && "rotate-180"
													)}
												>
													▼
												</div>
											</button>
											{expandedItems.has(item.id) && (
												<div className="ml-6 mt-1 space-y-1">
													{item.children.map((child) => (
														<Link
															key={child.id}
															href={child.href}
															onClick={handleLinkClick}
															className={cn(
																"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
																isActive(child.href) && "bg-accent"
															)}
														>
															{child.icon}
															{child.label}
														</Link>
													))}
												</div>
											)}
										</div>
									) : (
										<Link
											href={item.href}
											onClick={handleLinkClick}
											className={cn(
												"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
												isActive(item.href) && "bg-accent"
											)}
										>
											{item.icon}
											{item.label}
											{item.badge && (
												<Badge variant="secondary" className="ml-auto">
													{item.badge}
												</Badge>
											)}
										</Link>
									)}
								</div>
							))}
						</div>
					</nav>

					{user && (
						<div className="border-t p-4">
							<div className="flex items-center gap-3 mb-3">
								{user.avatar ? (
									<img
										src={user.avatar}
										alt={user.name}
										className="h-10 w-10 rounded-full"
									/>
								) : (
									<div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center">
										<User className="h-5 w-5 text-white" />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{user.name}</p>
									<p className="text-xs text-muted-foreground">
										{t("level")} {user.level}
									</p>
								</div>
							</div>
							<div className="space-y-1">
								<Link
									href="/profile"
									onClick={handleLinkClick}
									className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
								>
									<User className="h-4 w-4" />
									{t("profile")}
								</Link>
								<Link
									href="/settings"
									onClick={handleLinkClick}
									className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
								>
									<Settings className="h-4 w-4" />
									{t("settings")}
								</Link>
							</div>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
