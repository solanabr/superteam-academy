"use client";

import { useState, useMemo } from "react";
import {
	Search,
	Filter,
	X,
	ChevronDown,
	Calendar,
	Clock,
	Star,
	Users,
	BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuCheckboxItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface SearchFilters {
	categories?: string[];
	difficulty?: string[];
	duration?: [number, number];
	rating?: number;
	language?: string[];
	tags?: string[];
	dateRange?: {
		start: Date;
		end: Date;
	};
}

export interface SearchResult {
	id: string;
	title: string;
	description: string;
	type: "course" | "challenge" | "user" | "post";
	category?: string;
	difficulty?: string;
	rating?: number;
	participants?: number;
	duration?: number;
	tags?: string[];
	createdAt: Date;
	author?: {
		name: string;
		avatar?: string;
	};
}

interface SearchFunctionalityProps {
	onSearch: (query: string, filters: SearchFilters, sortBy: string) => void;
	results?: SearchResult[];
	isLoading?: boolean;
	totalResults?: number;
	className?: string;
}

export function SearchFunctionality({
	onSearch,
	results = [],
	isLoading = false,
	totalResults = 0,
	className,
}: SearchFunctionalityProps) {
	const t = useTranslations("search");
	const { toast: _toast } = useToast();

	const [query, setQuery] = useState("");
	const [filters, setFilters] = useState<SearchFilters>({});
	const [sortBy, setSortBy] = useState("relevance");
	const [isFiltersOpen, setIsFiltersOpen] = useState(false);

	const categories = [
		{ id: "web-development", label: t("categories.webDevelopment") },
		{ id: "blockchain", label: t("categories.blockchain") },
		{ id: "ai-ml", label: t("categories.aiMl") },
		{ id: "mobile", label: t("categories.mobile") },
		{ id: "design", label: t("categories.design") },
		{ id: "data-science", label: t("categories.dataScience") },
	];

	const difficulties = [
		{ id: "beginner", label: t("difficulties.beginner") },
		{ id: "intermediate", label: t("difficulties.intermediate") },
		{ id: "advanced", label: t("difficulties.advanced") },
	];

	const languages = [
		{ id: "en", label: t("languages.english") },
		{ id: "pt", label: t("languages.portuguese") },
		{ id: "es", label: t("languages.spanish") },
	];

	const sortOptions = [
		{ id: "relevance", label: t("sort.relevance") },
		{ id: "newest", label: t("sort.newest") },
		{ id: "oldest", label: t("sort.oldest") },
		{ id: "rating", label: t("sort.rating") },
		{ id: "participants", label: t("sort.participants") },
		{ id: "duration", label: t("sort.duration") },
	];

	const handleSearch = () => {
		if (query.trim() || Object.keys(filters).length > 0) {
			onSearch(query, filters, sortBy);
		}
	};

	const handleFilterChange = (key: keyof SearchFilters, value: unknown) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const clearFilters = () => {
		setFilters({});
		setQuery("");
		onSearch("", {}, "relevance");
	};

	const activeFiltersCount = useMemo(() => {
		let count = 0;
		if ((filters.categories?.length ?? 0) > 0) count++;
		if ((filters.difficulty?.length ?? 0) > 0) count++;
		if (filters.duration) count++;
		if (filters.rating) count++;
		if ((filters.language?.length ?? 0) > 0) count++;
		if ((filters.tags?.length ?? 0) > 0) count++;
		if (filters.dateRange) count++;
		return count;
	}, [filters]);

	const getResultIcon = (type: SearchResult["type"]) => {
		switch (type) {
			case "course":
				return <BookOpen className="h-4 w-4" />;
			case "challenge":
				return <Star className="h-4 w-4" />;
			case "user":
				return <Users className="h-4 w-4" />;
			case "post":
				return <Calendar className="h-4 w-4" />;
			default:
				return <Search className="h-4 w-4" />;
		}
	};

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	};

	return (
		<div className={cn("space-y-4", className)}>
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("searchPlaceholder")}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleSearch} disabled={isLoading}>
					{isLoading ? t("searching") : t("search")}
				</Button>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
						<PopoverTrigger asChild={true}>
							<Button variant="outline" size="sm">
								<Filter className="mr-2 h-4 w-4" />
								{t("filters")}
								{activeFiltersCount > 0 && (
									<Badge variant="secondary" className="ml-2">
										{activeFiltersCount}
									</Badge>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80" align="start">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="font-medium">{t("filters")}</h4>
									{activeFiltersCount > 0 && (
										<Button variant="ghost" size="sm" onClick={clearFilters}>
											{t("clearAll")}
										</Button>
									)}
								</div>

								<div>
									<label className="text-sm font-medium">
										{t("categories.title")}
									</label>
									<DropdownMenu>
										<DropdownMenuTrigger asChild={true}>
											<Button
												variant="outline"
												size="sm"
												className="w-full justify-between mt-1"
											>
												{(filters.categories?.length ?? 0) > 0
													? `${filters.categories?.length} ${t("selected")}`
													: t("categories.select")}
												<ChevronDown className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-56">
											<DropdownMenuLabel>
												{t("categories.title")}
											</DropdownMenuLabel>
											<DropdownMenuSeparator />
											{categories.map((category) => (
												<DropdownMenuCheckboxItem
													key={category.id}
													checked={
														filters.categories?.includes(category.id) ||
														false
													}
													onCheckedChange={(checked: boolean) => {
														const current = filters.categories || [];
														const updated = checked
															? [...current, category.id]
															: current.filter(
																	(id) => id !== category.id
																);
														handleFilterChange("categories", updated);
													}}
												>
													{category.label}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								<div>
									<label className="text-sm font-medium">{t("difficulty")}</label>
									<DropdownMenu>
										<DropdownMenuTrigger asChild={true}>
											<Button
												variant="outline"
												size="sm"
												className="w-full justify-between mt-1"
											>
												{(filters.difficulty?.length ?? 0) > 0
													? `${filters.difficulty?.length} ${t("selected")}`
													: t("selectDifficulty")}
												<ChevronDown className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-56">
											<DropdownMenuLabel>{t("difficulty")}</DropdownMenuLabel>
											<DropdownMenuSeparator />
											{difficulties.map((difficulty) => (
												<DropdownMenuCheckboxItem
													key={difficulty.id}
													checked={
														filters.difficulty?.includes(
															difficulty.id
														) || false
													}
													onCheckedChange={(checked: boolean) => {
														const current = filters.difficulty || [];
														const updated = checked
															? [...current, difficulty.id]
															: current.filter(
																	(id) => id !== difficulty.id
																);
														handleFilterChange("difficulty", updated);
													}}
												>
													{difficulty.label}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								<div>
									<label className="text-sm font-medium">{t("duration")}</label>
									<div className="mt-2 px-2">
										<Slider
											value={filters.duration || [0, 480]}
											onValueChange={(value: number[]) =>
												handleFilterChange("duration", value)
											}
											max={480}
											min={0}
											step={15}
											className="w-full"
										/>
										<div className="flex justify-between text-xs text-muted-foreground mt-1">
											<span>0h</span>
											<span>
												{formatDuration(filters.duration?.[0] || 0)} -{" "}
												{formatDuration(filters.duration?.[1] || 480)}
											</span>
											<span>8h</span>
										</div>
									</div>
								</div>

								<div>
									<label className="text-sm font-medium">{t("minRating")}</label>
									<div className="mt-2 px-2">
										<Slider
											value={[filters.rating || 0]}
											onValueChange={(value: number[]) =>
												handleFilterChange("rating", value[0])
											}
											max={5}
											min={0}
											step={0.5}
											className="w-full"
										/>
										<div className="flex justify-between text-xs text-muted-foreground mt-1">
											<span>0</span>
											<span>{filters.rating || 0}</span>
											<span>5</span>
										</div>
									</div>
								</div>

								<div>
									<label className="text-sm font-medium">{t("language")}</label>
									<DropdownMenu>
										<DropdownMenuTrigger asChild={true}>
											<Button
												variant="outline"
												size="sm"
												className="w-full justify-between mt-1"
											>
												{(filters.language?.length ?? 0) > 0
													? `${filters.language?.length} ${t("selected")}`
													: t("selectLanguage")}
												<ChevronDown className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-56">
											<DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
											<DropdownMenuSeparator />
											{languages.map((language) => (
												<DropdownMenuCheckboxItem
													key={language.id}
													checked={
														filters.language?.includes(language.id) ||
														false
													}
													onCheckedChange={(checked: boolean) => {
														const current = filters.language || [];
														const updated = checked
															? [...current, language.id]
															: current.filter(
																	(id) => id !== language.id
																);
														handleFilterChange("language", updated);
													}}
												>
													{language.label}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</PopoverContent>
					</Popover>

					{activeFiltersCount > 0 && (
						<Button variant="ghost" size="sm" onClick={clearFilters}>
							<X className="mr-2 h-4 w-4" />
							{t("clearFilters")}
						</Button>
					)}
				</div>

				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">{t("sortBy")}:</span>
					<Select value={sortBy} onValueChange={setSortBy}>
						<SelectTrigger className="w-[140px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{sortOptions.map((option) => (
								<SelectItem key={option.id} value={option.id}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{results.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							{t("results", { count: totalResults, query })}
						</p>
					</div>

					<div className="space-y-2">
						{results.map((result) => (
							<div
								key={result.id}
								className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
							>
								<div className="shrink-0 mt-1">{getResultIcon(result.type)}</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between">
										<div>
											<h3 className="font-medium text-sm truncate">
												{result.title}
											</h3>
											<p className="text-sm text-muted-foreground line-clamp-2">
												{result.description}
											</p>
										</div>
										{result.rating && (
											<div className="flex items-center gap-1 text-sm text-muted-foreground">
												<Star className="h-3 w-3 fill-current" />
												{result.rating}
											</div>
										)}
									</div>

									<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
										{result.category && (
											<span className="flex items-center gap-1">
												<BookOpen className="h-3 w-3" />
												{result.category}
											</span>
										)}
										{result.difficulty && <span>{result.difficulty}</span>}
										{result.duration && (
											<span className="flex items-center gap-1">
												<Clock className="h-3 w-3" />
												{formatDuration(result.duration)}
											</span>
										)}
										{result.participants && (
											<span className="flex items-center gap-1">
												<Users className="h-3 w-3" />
												{result.participants}
											</span>
										)}
									</div>

									{result.tags && result.tags.length > 0 && (
										<div className="flex flex-wrap gap-1 mt-2">
											{result.tags.slice(0, 3).map((tag) => (
												<Badge
													key={tag}
													variant="secondary"
													className="text-xs"
												>
													{tag}
												</Badge>
											))}
											{result.tags.length > 3 && (
												<Badge variant="secondary" className="text-xs">
													+{result.tags.length - 3}
												</Badge>
											)}
										</div>
									)}

									{result.author && (
										<div className="flex items-center gap-2 mt-2">
											{result.author.avatar ? (
												<img
													src={result.author.avatar}
													alt={result.author.name}
													className="h-4 w-4 rounded-full"
												/>
											) : (
												<div className="h-4 w-4 rounded-full bg-muted" />
											)}
											<span className="text-xs text-muted-foreground">
												{result.author.name}
											</span>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{results.length === 0 && query && !isLoading && (
				<div className="text-center py-8">
					<Search className="mx-auto h-12 w-12 text-muted-foreground" />
					<h3 className="mt-2 text-sm font-semibold">{t("noResults")}</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{t("noResultsDescription")}
					</p>
				</div>
			)}
		</div>
	);
}
