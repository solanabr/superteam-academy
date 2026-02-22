"use client";

import { useState } from "react";
import {
	Filter,
	SortAsc,
	SortDesc,
	X,
	ChevronDown,
	Calendar,
	Clock,
	Star,
	BookOpen,
	Tag,
	Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export interface FilterOptions {
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
	status?: string[];
	price?: string[];
}

export interface SortOption {
	id: string;
	label: string;
	field: string;
	direction: "asc" | "desc";
}

interface FilteringAndSortingProps {
	filters: FilterOptions;
	sortBy: string;
	onFiltersChange: (filters: FilterOptions) => void;
	onSortChange: (sortBy: string) => void;
	onClearFilters: () => void;
	availableCategories?: Array<{ id: string; label: string }>;
	availableTags?: string[];
	className?: string;
}

export function FilteringAndSorting({
	filters,
	sortBy,
	onFiltersChange,
	onSortChange,
	onClearFilters,
	availableCategories = [],
	availableTags = [],
	className,
}: FilteringAndSortingProps) {
	const t = useTranslations("filters");
	const { toast: _toast } = useToast();

	const [isFiltersOpen, setIsFiltersOpen] = useState(false);
	const [dateRange, setDateRange] = useState<{
		start?: Date | undefined;
		end?: Date | undefined;
	}>(filters.dateRange ?? {});

	const categories =
		availableCategories.length > 0
			? availableCategories
			: [
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

	const statuses = [
		{ id: "active", label: t("statuses.active") },
		{ id: "completed", label: t("statuses.completed") },
		{ id: "upcoming", label: t("statuses.upcoming") },
		{ id: "draft", label: t("statuses.draft") },
	];

	const prices = [
		{ id: "free", label: t("prices.free") },
		{ id: "paid", label: t("prices.paid") },
		{ id: "premium", label: t("prices.premium") },
	];

	const sortOptions: SortOption[] = [
		{ id: "relevance", label: t("sort.relevance"), field: "relevance", direction: "desc" },
		{ id: "newest", label: t("sort.newest"), field: "createdAt", direction: "desc" },
		{ id: "oldest", label: t("sort.oldest"), field: "createdAt", direction: "asc" },
		{ id: "rating-desc", label: t("sort.ratingHigh"), field: "rating", direction: "desc" },
		{ id: "rating-asc", label: t("sort.ratingLow"), field: "rating", direction: "asc" },
		{
			id: "participants-desc",
			label: t("sort.mostPopular"),
			field: "participants",
			direction: "desc",
		},
		{
			id: "participants-asc",
			label: t("sort.leastPopular"),
			field: "participants",
			direction: "asc",
		},
		{ id: "duration-asc", label: t("sort.shortest"), field: "duration", direction: "asc" },
		{ id: "duration-desc", label: t("sort.longest"), field: "duration", direction: "desc" },
		{ id: "title-asc", label: t("sort.titleAZ"), field: "title", direction: "asc" },
		{ id: "title-desc", label: t("sort.titleZA"), field: "title", direction: "desc" },
	];

	const handleFilterChange = (key: keyof FilterOptions, value: unknown) => {
		const newFilters = { ...filters, [key]: value };
		onFiltersChange(newFilters);
	};

	const handleDateRangeChange = (range: { start?: Date | undefined; end?: Date | undefined }) => {
		setDateRange(range);
		if (range.start && range.end) {
			handleFilterChange("dateRange", { start: range.start, end: range.end });
		} else if (!range.start && !range.end) {
			const { dateRange: _dr, ...rest } = filters;
			const newFilters = { ...rest };
			onFiltersChange(newFilters);
		}
	};

	const activeFiltersCount = Object.values(filters).reduce(
		(count: number, value: FilterOptions[keyof FilterOptions]) => {
			if (Array.isArray(value) && value.length > 0) return count + 1;
			if (typeof value === "object" && value !== null) return count + 1;
			if (typeof value === "number" && value > 0) return count + 1;
			return count;
		},
		0
	);

	const getActiveFilterLabels = () => {
		const labels: string[] = [];

		if ((filters.categories?.length ?? 0) > 0) {
			labels.push(`${t("categories.title")}: ${filters.categories?.length}`);
		}
		if ((filters.difficulty?.length ?? 0) > 0) {
			labels.push(`${t("difficulty")}: ${filters.difficulty?.length}`);
		}
		if (filters.duration) {
			labels.push(`${t("duration")}: ${filters.duration[0]}-${filters.duration[1]}min`);
		}
		if (filters.rating) {
			labels.push(`${t("rating")}: ${filters.rating}+`);
		}
		if ((filters.language?.length ?? 0) > 0) {
			labels.push(`${t("language")}: ${filters.language?.length}`);
		}
		if ((filters.tags?.length ?? 0) > 0) {
			labels.push(`${t("tags")}: ${filters.tags?.length}`);
		}
		if (filters.dateRange) {
			labels.push(t("dateRange"));
		}
		if ((filters.status?.length ?? 0) > 0) {
			labels.push(`${t("status")}: ${filters.status?.length}`);
		}
		if ((filters.price?.length ?? 0) > 0) {
			labels.push(`${t("price")}: ${filters.price?.length}`);
		}

		return labels;
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
			{activeFiltersCount > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm text-muted-foreground">{t("activeFilters")}:</span>
					{getActiveFilterLabels().map((label, index) => (
						<Badge key={index} variant="secondary" className="text-xs">
							{label}
						</Badge>
					))}
					<Button variant="ghost" size="sm" onClick={onClearFilters}>
						<X className="mr-1 h-3 w-3" />
						{t("clearAll")}
					</Button>
				</div>
			)}

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
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<h4 className="font-medium">{t("filters")}</h4>
									{activeFiltersCount > 0 && (
										<Button variant="ghost" size="sm" onClick={onClearFilters}>
											{t("clearAll")}
										</Button>
									)}
								</div>

								<div>
									<label className="text-sm font-medium flex items-center gap-2">
										<BookOpen className="h-4 w-4" />
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
									<label className="text-sm font-medium flex items-center gap-2">
										<Clock className="h-4 w-4" />
										{t("duration")}
									</label>
									<div className="mt-2 px-2">
										<Slider
											value={filters.duration || [0, 480]}
											onValueChange={(value: number[]) =>
												handleFilterChange(
													"duration",
													value as [number, number]
												)
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
									<label className="text-sm font-medium flex items-center gap-2">
										<Star className="h-4 w-4" />
										{t("minRating")}
									</label>
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
									<label className="text-sm font-medium flex items-center gap-2">
										<Globe className="h-4 w-4" />
										{t("language")}
									</label>
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

								{availableTags.length > 0 && (
									<div>
										<label className="text-sm font-medium flex items-center gap-2">
											<Tag className="h-4 w-4" />
											{t("tags")}
										</label>
										<DropdownMenu>
											<DropdownMenuTrigger asChild={true}>
												<Button
													variant="outline"
													size="sm"
													className="w-full justify-between mt-1"
												>
													{(filters.tags?.length ?? 0) > 0
														? `${filters.tags?.length} ${t("selected")}`
														: t("selectTags")}
													<ChevronDown className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent className="w-56">
												<DropdownMenuLabel>{t("tags")}</DropdownMenuLabel>
												<DropdownMenuSeparator />
												{availableTags.map((tag) => (
													<DropdownMenuCheckboxItem
														key={tag}
														checked={
															filters.tags?.includes(tag) || false
														}
														onCheckedChange={(checked: boolean) => {
															const current = filters.tags || [];
															const updated = checked
																? [...current, tag]
																: current.filter(
																		(tg) => tg !== tag
																	);
															handleFilterChange("tags", updated);
														}}
													>
														{tag}
													</DropdownMenuCheckboxItem>
												))}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								)}

								<div>
									<label className="text-sm font-medium flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										{t("dateRange")}
									</label>
									<div className="mt-2">
										<Popover>
											<PopoverTrigger asChild={true}>
												<Button
													variant="outline"
													size="sm"
													className="w-full justify-start"
												>
													<Calendar className="mr-2 h-4 w-4" />
													{dateRange.start && dateRange.end
														? `${format(dateRange.start, "PPP")} - ${format(dateRange.end, "PPP")}`
														: t("selectDateRange")}
												</Button>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<CalendarComponent
													mode="range"
													selected={{
														from: dateRange.start,
														to: dateRange.end,
													}}
													onSelect={(range: DateRange | undefined) => {
														handleDateRangeChange({
															start: range?.from,
															end: range?.to,
														});
													}}
													numberOfMonths={2}
												/>
											</PopoverContent>
										</Popover>
									</div>
								</div>

								<div>
									<label className="text-sm font-medium">{t("status")}</label>
									<DropdownMenu>
										<DropdownMenuTrigger asChild={true}>
											<Button
												variant="outline"
												size="sm"
												className="w-full justify-between mt-1"
											>
												{(filters.status?.length ?? 0) > 0
													? `${filters.status?.length} ${t("selected")}`
													: t("selectStatus")}
												<ChevronDown className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-56">
											<DropdownMenuLabel>{t("status")}</DropdownMenuLabel>
											<DropdownMenuSeparator />
											{statuses.map((status) => (
												<DropdownMenuCheckboxItem
													key={status.id}
													checked={
														filters.status?.includes(status.id) || false
													}
													onCheckedChange={(checked: boolean) => {
														const current = filters.status || [];
														const updated = checked
															? [...current, status.id]
															: current.filter(
																	(id) => id !== status.id
																);
														handleFilterChange("status", updated);
													}}
												>
													{status.label}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								<div>
									<label className="text-sm font-medium">{t("price")}</label>
									<DropdownMenu>
										<DropdownMenuTrigger asChild={true}>
											<Button
												variant="outline"
												size="sm"
												className="w-full justify-between mt-1"
											>
												{(filters.price?.length ?? 0) > 0
													? `${filters.price?.length} ${t("selected")}`
													: t("selectPrice")}
												<ChevronDown className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-56">
											<DropdownMenuLabel>{t("price")}</DropdownMenuLabel>
											<DropdownMenuSeparator />
											{prices.map((price) => (
												<DropdownMenuCheckboxItem
													key={price.id}
													checked={
														filters.price?.includes(price.id) || false
													}
													onCheckedChange={(checked: boolean) => {
														const current = filters.price || [];
														const updated = checked
															? [...current, price.id]
															: current.filter(
																	(id) => id !== price.id
																);
														handleFilterChange("price", updated);
													}}
												>
													{price.label}
												</DropdownMenuCheckboxItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">{t("sortBy")}:</span>
					<Select value={sortBy} onValueChange={onSortChange}>
						<SelectTrigger className="w-[180px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{sortOptions.map((option) => (
								<SelectItem key={option.id} value={option.id}>
									<div className="flex items-center gap-2">
										{option.direction === "desc" ? (
											<SortDesc className="h-3 w-3" />
										) : (
											<SortAsc className="h-3 w-3" />
										)}
										{option.label}
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}
