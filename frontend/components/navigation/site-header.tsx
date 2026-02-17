"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Search, Menu, X, Layers, Users, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchModal } from "@/components/search/search-modal";
import { LoginModal } from "@/components/auth/login-modal";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{
		label: "Catalog",
		href: "/courses",
		icon: Compass,
	},
	{
		label: "Topics",
		href: "/topics",
		icon: Layers,
	},
	{
		label: "Leaderboard",
		href: "/leaderboard",
		icon: Trophy,
	},
	{
		label: "Community",
		href: "/community",
		icon: Users,
	},
];

export function SiteHeader() {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [loginOpen, setLoginOpen] = useState(false);

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

	return (
		<>
			<header className="sticky top-0 z-50 w-full glass border-b border-border/40">
				<div className="mx-auto px-4 sm:px-6">
					<div className="flex h-16 items-center gap-4">
						<Link href="/" className="flex items-center gap-2 shrink-0">
							<Image
								src="/logo.svg"
								alt="Superteam Academy"
								width={150}
								height={32}
								priority
								className="h-8 w-auto"
							/>
						</Link>

						<nav className="hidden lg:flex items-center gap-1">
							{NAV_ITEMS.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"relative px-3 py-2 text-sm font-medium rounded-lg transition-colors",
										"hover:bg-muted hover:text-foreground",
										isActive(item.href)
											? "text-foreground bg-muted"
											: "text-muted-foreground"
									)}
								>
									{item.label}
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
								<span>Search courses...</span>
								<kbd className="ml-auto text-[10px] font-mono bg-background rounded px-1.5 py-0.5 border border-border/50">
									/
								</kbd>
							</button>

							<Button
								variant="ghost"
								size="sm"
								onClick={() => setLoginOpen(true)}
							>
								Log in
							</Button>
							<Button
								size="sm"
								className="font-semibold"
								onClick={() => setLoginOpen(true)}
							>
								Sign up free
							</Button>
						</div>

						<div className="flex lg:hidden items-center gap-2">
							<button
								type="button"
								onClick={() => setSearchOpen(true)}
								className="p-2 rounded-lg hover:bg-muted transition-colors"
							>
								<Search className="h-5 w-5 text-muted-foreground" />
							</button>
							<button
								type="button"
								onClick={() => setMobileOpen(!mobileOpen)}
								className="p-2 rounded-lg hover:bg-muted transition-colors"
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
					<div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl animate-fade-in">
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
										{item.label}
									</Link>
								);
							})}
							<div className="pt-4 space-y-2 border-t border-border">
								<Button
									variant="outline"
									className="w-full"
									onClick={() => {
										setMobileOpen(false);
										setLoginOpen(true);
									}}
								>
									Log in
								</Button>
								<Button
									className="w-full font-semibold"
									onClick={() => {
										setMobileOpen(false);
										setLoginOpen(true);
									}}
								>
									Sign up free
								</Button>
							</div>
						</nav>
					</div>
				)}
			</header>

			<SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
			<LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
		</>
	);
}
