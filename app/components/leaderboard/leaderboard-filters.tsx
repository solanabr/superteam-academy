"use client";

import { Search, X, SlidersHorizontal, CalendarDays } from "lucide-react";
import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface LeaderboardFiltersProps {
	filters?: FilterState;
}

export interface FilterState {
	search: string;
	country: string;
	level: string;
	sortBy: string;
	timePeriod: string;
}

export const DEFAULT_FILTERS: FilterState = {
	search: "",
	country: "",
	level: "",
	sortBy: "score",
	timePeriod: "all-time",
};

const COUNTRIES = [
	{ value: "BR", label: "Brazil" },
	{ value: "AR", label: "Argentina" },
	{ value: "MX", label: "Mexico" },
	{ value: "CO", label: "Colombia" },
	{ value: "CL", label: "Chile" },
	{ value: "PE", label: "Peru" },
	{ value: "PT", label: "Portugal" },
	{ value: "ES", label: "Spain" },
	{ value: "US", label: "United States" },
	{ value: "CA", label: "Canada" },
	{ value: "NG", label: "Nigeria" },
	{ value: "IN", label: "India" },
	{ value: "DE", label: "Germany" },
	{ value: "GB", label: "United Kingdom" },
	{ value: "TR", label: "Turkey" },
	{ value: "VN", label: "Vietnam" },
];

const LEVELS = [
	{ value: "1-5", label: "1 - 5" },
	{ value: "6-10", label: "6 - 10" },
	{ value: "11-15", label: "11 - 15" },
	{ value: "16-20", label: "16 - 20" },
	{ value: "21-25", label: "21 - 25" },
	{ value: "26+", label: "26+" },
];

const SORTS = [
	{ value: "score", label: "XP Score" },
	{ value: "level", label: "Level" },
	{ value: "achievements", label: "Achievements" },
	{ value: "streak", label: "Streak" },
];

const TIME_PERIODS = [
	{ value: "all-time", label: "All Time" },
	{ value: "monthly", label: "This Month" },
	{ value: "weekly", label: "This Week" },
];

export function LeaderboardFilters({ filters = DEFAULT_FILTERS }: LeaderboardFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const baseParams = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

	const setUrlParams = useCallback(
		(nextFilters: FilterState) => {
			const params = new URLSearchParams(baseParams.toString());

			if (nextFilters.search.trim()) {
				params.set("q", nextFilters.search.trim());
			} else {
				params.delete("q");
			}

			if (nextFilters.country) {
				params.set("country", nextFilters.country);
			} else {
				params.delete("country");
			}

			if (nextFilters.level) {
				params.set("level", nextFilters.level);
			} else {
				params.delete("level");
			}

			if (nextFilters.sortBy !== "score") {
				params.set("sort", nextFilters.sortBy);
			} else {
				params.delete("sort");
			}

			if (nextFilters.timePeriod !== "all-time") {
				params.set("time", nextFilters.timePeriod);
			} else {
				params.delete("time");
			}

			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`);
			});
		},
		[baseParams, pathname, router]
	);

	const handleFilterChange = (key: keyof FilterState, value: string) => {
		const newFilters = { ...filters, [key]: value };
		setUrlParams(newFilters);
	};

	const clearFilter = (key: keyof FilterState) => {
		handleFilterChange(
			key,
			key === "sortBy" ? "score" : key === "timePeriod" ? "all-time" : ""
		);
	};

	const clearAll = () => {
		setUrlParams(DEFAULT_FILTERS);
	};

	const activeFilters = [
		filters.search && { key: "search" as const, label: `"${filters.search}"` },
		filters.country && {
			key: "country" as const,
			label: COUNTRIES.find((c) => c.value === filters.country)?.label ?? filters.country,
		},
		filters.level && { key: "level" as const, label: `Lvl ${filters.level}` },
		filters.timePeriod !== "all-time" && {
			key: "timePeriod" as const,
			label:
				TIME_PERIODS.find((tp) => tp.value === filters.timePeriod)?.label ??
				filters.timePeriod,
		},
	].filter(Boolean) as { key: keyof FilterState; label: string }[];

	return (
		<div className="space-y-3">
			<div className="flex flex-col sm:flex-row gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
					<input
						type="text"
						placeholder="Search learners..."
						value={filters.search}
						onChange={(e) => handleFilterChange("search", e.target.value)}
						disabled={isPending}
						className="w-full h-9 pl-9 pr-3 rounded-lg border border-border/60 bg-muted/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
					/>
					{filters.search && (
						<button
							type="button"
							onClick={() => clearFilter("search")}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					)}
				</div>

				<div className="flex items-center gap-2">
					<SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />

					<Select
						value={filters.timePeriod}
						onValueChange={(value) => handleFilterChange("timePeriod", value)}
						disabled={isPending}
					>
						<SelectTrigger className="w-32 h-9 bg-muted/40 border-border/60 text-sm">
							<CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TIME_PERIODS.map((tp) => (
								<SelectItem key={tp.value} value={tp.value}>
									{tp.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={filters.country || "all"}
						onValueChange={(value: string) =>
							handleFilterChange("country", value === "all" ? "" : value)
						}
						disabled={isPending}
					>
						<SelectTrigger className="w-36 h-9 bg-muted/40 border-border/60 text-sm">
							<SelectValue placeholder="Country" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Country</SelectItem>
							{COUNTRIES.map((c) => (
								<SelectItem key={c.value} value={c.value}>
									{c.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={filters.level || "all"}
						onValueChange={(value: string) =>
							handleFilterChange("level", value === "all" ? "" : value)
						}
						disabled={isPending}
					>
						<SelectTrigger className="w-28 h-9 bg-muted/40 border-border/60 text-sm">
							<SelectValue placeholder="Level" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Level</SelectItem>
							{LEVELS.map((l) => (
								<SelectItem key={l.value} value={l.value}>
									{l.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={filters.sortBy}
						onValueChange={(value) => handleFilterChange("sortBy", value)}
						disabled={isPending}
					>
						<SelectTrigger className="w-32 h-9 bg-muted/40 border-border/60 text-sm">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							{SORTS.map((s) => (
								<SelectItem key={s.value} value={s.value}>
									{s.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{activeFilters.length > 0 && (
				<div className="flex flex-wrap items-center gap-1.5">
					{activeFilters.map((f) => (
						<button
							key={f.key}
							type="button"
							onClick={() => clearFilter(f.key)}
							className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
						>
							{f.label}
							<X className="h-3 w-3" />
						</button>
					))}
					<button
						type="button"
						onClick={clearAll}
						className="text-xs text-muted-foreground hover:text-foreground ml-1"
					>
						Clear all
					</button>
				</div>
			)}
		</div>
	);
}
