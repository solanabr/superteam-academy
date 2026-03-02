"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

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
	const t = useTranslations("courses");

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
					placeholder={t("filters.searchPlaceholder")}
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
					<SelectItem value="all">{t("categories.all")}</SelectItem>
					<SelectItem value="solana">{t("categories.solana")}</SelectItem>
					<SelectItem value="anchor">{t("categories.anchor")}</SelectItem>
					<SelectItem value="defi">{t("categories.defi")}</SelectItem>
					<SelectItem value="nft">{t("categories.nft")}</SelectItem>
					<SelectItem value="security">{t("categories.security")}</SelectItem>
					<SelectItem value="frontend">{t("categories.frontend")}</SelectItem>
					<SelectItem value="token">{t("categories.token")}</SelectItem>
				</SelectContent>
			</Select>

			<Select value={level} onValueChange={(value) => updateParam("level", value)}>
				<SelectTrigger className="h-9 w-30 text-sm bg-muted/50 border-border/60 rounded-lg">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("levels.all")}</SelectItem>
					<SelectItem value="beginner">{t("levels.beginner")}</SelectItem>
					<SelectItem value="intermediate">{t("levels.intermediate")}</SelectItem>
					<SelectItem value="advanced">{t("levels.advanced")}</SelectItem>
				</SelectContent>
			</Select>

			<Select value={duration} onValueChange={(value) => updateParam("duration", value)}>
				<SelectTrigger className="h-9 w-32.5 text-sm bg-muted/50 border-border/60 rounded-lg">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("durations.all")}</SelectItem>
					<SelectItem value="short">{t("durations.short")}</SelectItem>
					<SelectItem value="medium">{t("durations.medium")}</SelectItem>
					<SelectItem value="long">{t("durations.long")}</SelectItem>
				</SelectContent>
			</Select>

			<Select value={sort} onValueChange={(value) => updateParam("sort", value)}>
				<SelectTrigger className="h-9 w-32.5 text-sm bg-muted/50 border-border/60 rounded-lg">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="popular">{t("sortOptions.popular")}</SelectItem>
					<SelectItem value="newest">{t("sortOptions.newest")}</SelectItem>
					<SelectItem value="xp">{t("sortOptions.xp")}</SelectItem>
					<SelectItem value="duration">{t("sortOptions.duration")}</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
