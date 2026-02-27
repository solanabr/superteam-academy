"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type CoursesFiltersProps = {
	q: string;
	category: string;
	level: string;
	duration: string;
	sort: string;
};

export function CoursesFilters({ q, category, level, duration, sort }: CoursesFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const [query, setQuery] = useState(q);

	const baseParams = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

	const updateParam = useCallback(
		(key: string, value: string) => {
			const params = new URLSearchParams(baseParams.toString());
			if (!value || value === "all" || (key === "sort" && value === "popular")) {
				params.delete(key);
			} else {
				params.set(key, value);
			}
			params.delete("page");

			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`);
			});
		},
		[baseParams, pathname, router]
	);

	const submitSearch = useCallback(() => {
		updateParam("q", query.trim());
	}, [query, updateParam]);

	return (
		<div className="flex items-center gap-2 flex-wrap">
			<div className="relative flex-1 max-w-sm w-full">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search courses"
					className="pl-9 h-9 bg-muted/50 border-border/60 rounded-lg"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") submitSearch();
					}}
					onBlur={submitSearch}
					disabled={isPending}
				/>
			</div>

			<Select value={category} onValueChange={(value) => updateParam("category", value)}>
				<SelectTrigger className="h-9 w-32.5 text-sm bg-muted/50 border-border/60 rounded-lg">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All</SelectItem>
					<SelectItem value="solana">Solana</SelectItem>
					<SelectItem value="anchor">Anchor</SelectItem>
					<SelectItem value="defi">DeFi</SelectItem>
					<SelectItem value="nft">NFT</SelectItem>
					<SelectItem value="security">Security</SelectItem>
					<SelectItem value="frontend">Frontend</SelectItem>
					<SelectItem value="token">Token</SelectItem>
				</SelectContent>
			</Select>

			<Select value={level} onValueChange={(value) => updateParam("level", value)}>
				<SelectTrigger className="h-9 w-30 text-sm bg-muted/50 border-border/60 rounded-lg">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All levels</SelectItem>
					<SelectItem value="beginner">Beginner</SelectItem>
					<SelectItem value="intermediate">Intermediate</SelectItem>
					<SelectItem value="advanced">Advanced</SelectItem>
				</SelectContent>
			</Select>

			<Select value={duration} onValueChange={(value) => updateParam("duration", value)}>
				<SelectTrigger className="h-9 w-32.5 text-sm bg-muted/50 border-border/60 rounded-lg">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Any duration</SelectItem>
					<SelectItem value="short">Short (&lt; 4h)</SelectItem>
					<SelectItem value="medium">Medium (4-8h)</SelectItem>
					<SelectItem value="long">Long (&gt; 8h)</SelectItem>
				</SelectContent>
			</Select>

			<Select value={sort} onValueChange={(value) => updateParam("sort", value)}>
				<SelectTrigger className="h-9 w-32.5 text-sm bg-muted/50 border-border/60 rounded-lg">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="popular">Popular</SelectItem>
					<SelectItem value="newest">Newest</SelectItem>
					<SelectItem value="xp">XP</SelectItem>
					<SelectItem value="duration">Duration</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
