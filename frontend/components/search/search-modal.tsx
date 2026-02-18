"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Layers, Users, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface SearchModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const RECENT_SEARCHES_KEY = "academy_recent_searches";

const QUICK_LINKS = [
	{ key: "browseCourses" as const, href: "/courses", icon: BookOpen },
	{ key: "exploreTopics" as const, href: "/topics", icon: Layers },
	{ key: "leaderboard" as const, href: "/leaderboard", icon: Users },
];

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
	const router = useRouter();
	const t = useTranslations("searchModal");
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [recentSearches, setRecentSearches] = useState<string[]>([]);

	useEffect(() => {
		if (open) {
			const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
			if (stored) {
				try {
					setRecentSearches(JSON.parse(stored));
				} catch {
					setRecentSearches([]);
				}
			}
			setTimeout(() => inputRef.current?.focus(), 0);
		} else {
			setQuery("");
		}
	}, [open]);

	const handleSearch = (searchQuery: string) => {
		const trimmed = searchQuery.trim();
		if (!trimmed) return;

		const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
		setRecentSearches(updated);
		localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));

		onOpenChange(false);
		router.push(`/courses?q=${encodeURIComponent(trimmed)}`);
	};

	const handleNavigate = (href: string) => {
		onOpenChange(false);
		router.push(href);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
				<VisuallyHidden.Root>
					<DialogTitle>{t("title")}</DialogTitle>
				</VisuallyHidden.Root>
				<div className="flex items-center border-b border-border px-4">
					<Search className="h-4 w-4 text-muted-foreground shrink-0" />
					<input
						ref={inputRef}
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSearch(query);
						}}
						placeholder={t("placeholder")}
						className="flex-1 px-3 py-4 text-sm bg-transparent border-0 outline-none placeholder:text-muted-foreground"
					/>
					<kbd className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5 border border-border/50">
						ESC
					</kbd>
				</div>

				<div className="max-h-80 overflow-y-auto p-2">
					{recentSearches.length > 0 && !query && (
						<div className="mb-2">
							<p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
								{t("recent")}
							</p>
							{recentSearches.map((search) => (
								<button
									key={search}
									type="button"
									onClick={() => handleSearch(search)}
									className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
								>
									<Clock className="h-3.5 w-3.5 text-muted-foreground" />
									{search}
								</button>
							))}
						</div>
					)}

					{!query && (
						<div>
							<p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
								{t("quickLinks")}
							</p>
							{QUICK_LINKS.map((link) => {
								const Icon = link.icon;
								return (
									<button
										key={link.href}
										type="button"
										onClick={() => handleNavigate(link.href)}
										className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
									>
										<Icon className="h-3.5 w-3.5 text-muted-foreground" />
										{t(link.key)}
									</button>
								);
							})}
						</div>
					)}

					{query && (
						<button
							type="button"
							onClick={() => handleSearch(query)}
							className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
						>
							<Search className="h-3.5 w-3.5 text-muted-foreground" />
						{t("searchFor", { query })}
						</button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
