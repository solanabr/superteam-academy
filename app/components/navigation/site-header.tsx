"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Link } from "@superteam-academy/i18n/navigation";
import { usePathname } from "next/navigation";
import {
	Trophy,
	Search,
	Menu,
	X,
	Layers,
	Users,
	Compass,
	Sun,
	Moon,
	User,
	Settings,
	LogOut,
	ShieldCheck,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import Logo from "@/public/logo.svg";

const SearchModal = dynamic(
	() => import("@/components/search/search-modal").then((m) => ({ default: m.SearchModal })),
	{ ssr: false }
);
const LoginModal = dynamic(
	() => import("@/components/auth/login-modal").then((m) => ({ default: m.LoginModal })),
	{ ssr: false }
);

const NAV_ITEMS = [
	{
		key: "catalog" as const,
		href: "/courses",
		icon: Compass,
	},
	{
		key: "topics" as const,
		href: "/topics",
		icon: Layers,
	},
	{
		key: "leaderboard" as const,
		href: "/leaderboard",
		icon: Trophy,
	},
	{
		key: "community" as const,
		href: "/community",
		icon: Users,
	},
];

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

function getClusterBadge(endpoint: string): { label: string; className: string } {
	const normalized = endpoint.toLowerCase();
	if (normalized.includes("mainnet")) {
		return { label: "MAIN", className: "bg-rose-500 text-white" };
	}
	if (normalized.includes("testnet")) {
		return { label: "TEST", className: "bg-amber-500 text-black" };
	}
	return { label: "DEV", className: "bg-emerald-500 text-white" };
}

const CLUSTER_BADGE = getClusterBadge(RPC_ENDPOINT);

export function SiteHeader() {
	const pathname = usePathname();
	const t = useTranslations("navigation");
	const { resolvedTheme, setTheme } = useTheme();
	const { isAuthenticated, isAdmin, user, wallet, signOut } = useAuth();
	const [mounted, setMounted] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [loginOpen, setLoginOpen] = useState(false);

	useEffect(() => setMounted(true), []);

	const isActive = (href: string) => {
		if (href === "/") return pathname === "/";
		return pathname.startsWith(href.split("?")[0]);
	};

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "/" && !searchOpen && !loginOpen) {
				const target = e.target as HTMLElement;
				if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
				e.preventDefault();
				setSearchOpen(true);
			}
		},
		[searchOpen, loginOpen]
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	const walletAddress = wallet.publicKey?.toBase58();
	const displayName =
		user?.name ??
		(walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "Learner");
	const displayMeta = user?.email ?? walletAddress ?? "";

	const handleSignOut = async () => {
		await signOut();
	};

	const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

	return (
		<>
			<header className="sticky top-0 z-50 w-full glass border-b border-border/40">
				<div className="mx-auto px-4 sm:px-6">
					<div className="flex h-16 items-center gap-4">
						<Link
							href="/"
							className="cursor-pointer"
							aria-label="Superteam Academy home"
						>
							<Logo
								width={150}
								height={32}
								className="text-brand dark:text-white"
								aria-hidden="true"
							/>
						</Link>

						<nav className="hidden lg:flex items-center gap-1">
							{NAV_ITEMS.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"relative px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
										"hover:bg-muted hover:text-foreground",
										isActive(item.href)
											? "text-foreground bg-muted"
											: "text-muted-foreground"
									)}
								>
									{t(item.key)}
									{isActive(item.href) && (
										<span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
									)}
								</Link>
							))}
						</nav>

						<div className="hidden lg:flex w-full items-center justify-end gap-3">
							<button
								type="button"
								onClick={() => setSearchOpen(true)}
								className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground rounded-lg border border-border/60 bg-muted/50 hover:bg-muted transition-colors min-w-50"
							>
								<Search className="h-3.5 w-3.5" />
								<span>{t("searchPlaceholder")}</span>
								<kbd className="ml-auto text-[10px] font-mono bg-background rounded px-1.5 py-0.5 border border-border/50">
									/
								</kbd>
							</button>

							<button
								type="button"
								onClick={toggleTheme}
								className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
								aria-label={t("toggleTheme")}
							>
								{mounted && resolvedTheme === "light" ? (
									<Moon className="h-4 w-4" />
								) : (
									<Sun className="h-4 w-4" />
								)}
							</button>

							{isAuthenticated ? (
								<DropdownMenu>
									<DropdownMenuTrigger asChild={true}>
										<Button
											variant="ghost"
											size="icon"
											className="h-9 w-9 rounded-full"
											aria-label="Open account menu"
										>
											<div className="relative h-9 w-9">
												{user?.image ? (
													<img
														src={user.image}
														alt={displayName}
														className="h-9 w-9 rounded-full object-cover ring-2 ring-border/60"
													/>
												) : (
													<div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-2 ring-border/60">
														<User className="h-4 w-4" />
													</div>
												)}
												<span
													className={cn(
														"absolute -right-1 -bottom-1 h-4 min-w-4 px-1 rounded-full text-[9px] font-bold leading-4 text-center ring-2 ring-background",
														CLUSTER_BADGE.className
													)}
													title={`Active cluster: ${CLUSTER_BADGE.label}`}
												>
													{CLUSTER_BADGE.label}
												</span>
											</div>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-64">
										<DropdownMenuLabel className="font-normal">
											<div className="flex flex-col">
												<span className="text-sm font-medium">
													{displayName}
												</span>
												{displayMeta ? (
													<span className="text-xs text-muted-foreground truncate">
														{displayMeta}
													</span>
												) : null}
											</div>
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild={true}>
											<Link href="/profile">
												<User className="h-4 w-4 mr-2" />
												Profile
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild={true}>
											<Link href="/settings">
												<Settings className="h-4 w-4 mr-2" />
												Settings
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild={true}>
											<Link href="/courses?following=true">
												<Compass className="h-4 w-4 mr-2" />
												My Courses
											</Link>
										</DropdownMenuItem>
										{isAdmin && (
											<DropdownMenuItem asChild={true}>
												<Link href="/admin">
													<ShieldCheck className="h-4 w-4 mr-2" />
													Admin
												</Link>
											</DropdownMenuItem>
										)}
										<DropdownMenuSeparator />
										<DropdownMenuItem onSelect={handleSignOut}>
											<LogOut className="h-4 w-4 mr-2" />
											Logout
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							) : (
								<>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setLoginOpen(true)}
									>
										{t("login")}
									</Button>
									<Button
										size="sm"
										className="font-semibold"
										onClick={() => setLoginOpen(true)}
									>
										{t("signUpFree")}
									</Button>
								</>
							)}
						</div>

						<div className="flex w-full lg:hidden items-center justify-end gap-2">
							<button
								type="button"
								onClick={toggleTheme}
								className="p-2 rounded-lg hover:bg-muted transition-colors"
								aria-label={t("toggleTheme")}
							>
								{mounted && resolvedTheme === "dark" ? (
									<Sun className="h-5 w-5 text-muted-foreground" />
								) : (
									<Moon className="h-5 w-5 text-muted-foreground" />
								)}
							</button>
							<button
								type="button"
								onClick={() => setSearchOpen(true)}
								className="p-2 rounded-lg hover:bg-muted transition-colors"
								aria-label={t("searchPlaceholder")}
							>
								<Search className="h-5 w-5 text-muted-foreground" />
							</button>
							<button
								type="button"
								onClick={() => setMobileOpen(!mobileOpen)}
								className="p-2 rounded-lg hover:bg-muted transition-colors"
								aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
							>
								{mobileOpen ? (
									<X className="h-5 w-5" />
								) : (
									<Menu className="h-5 w-5" />
								)}
							</button>
						</div>
					</div>
				</div>

				{mobileOpen && (
					<>
						<div
							className="lg:hidden fixed inset-0 top-16 bg-black/20 z-40"
							onClick={() => setMobileOpen(false)}
							role="presentation"
						/>
						<div className="lg:hidden absolute left-0 right-0 top-full border-t border-border bg-background/95 backdrop-blur-xl animate-fade-in shadow-lg z-50">
							<nav className="mx-auto px-4 py-4 space-y-1">
								{NAV_ITEMS.map((item) => {
									const Icon = item.icon;
									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setMobileOpen(false)}
											className={cn(
												"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
												isActive(item.href)
													? "bg-primary/10 text-primary"
													: "text-muted-foreground hover:bg-muted hover:text-foreground"
											)}
										>
											<Icon className="h-4 w-4" />
											{t(item.key)}
										</Link>
									);
								})}
								<div className="pt-4 space-y-2 border-t border-border">
									{isAuthenticated ? (
										<>
											<Link
												href="/profile"
												onClick={() => setMobileOpen(false)}
												className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
											>
												<User className="h-4 w-4" />
												Profile
											</Link>
											<Link
												href="/settings"
												onClick={() => setMobileOpen(false)}
												className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
											>
												<Settings className="h-4 w-4" />
												Settings
											</Link>
											<Link
												href="/courses?following=true"
												onClick={() => setMobileOpen(false)}
												className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
											>
												<Compass className="h-4 w-4" />
												My Courses
											</Link>
											{isAdmin && (
												<Link
													href="/admin"
													onClick={() => setMobileOpen(false)}
													className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
												>
													<ShieldCheck className="h-4 w-4" />
													Admin
												</Link>
											)}
											<Button
												variant="outline"
												className="w-full"
												onClick={async () => {
													await handleSignOut();
													setMobileOpen(false);
												}}
											>
												<LogOut className="h-4 w-4 mr-2" />
												Logout
											</Button>
										</>
									) : (
										<>
											<Button
												variant="outline"
												className="w-full"
												onClick={() => {
													setMobileOpen(false);
													setLoginOpen(true);
												}}
											>
												{t("login")}
											</Button>
											<Button
												className="w-full font-semibold"
												onClick={() => {
													setMobileOpen(false);
													setLoginOpen(true);
												}}
											>
												{t("signUpFree")}
											</Button>
										</>
									)}
								</div>
							</nav>
						</div>
					</>
				)}
			</header>

			<SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
			{loginOpen && <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />}
		</>
	);
}
