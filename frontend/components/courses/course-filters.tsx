"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface CourseFiltersProps {
	categories: string[];
	levels: string[];
	durations: string[];
	onFiltersChange?: (filters: {
		categories: string[];
		levels: string[];
		durations: string[];
	}) => void;
}

export function CourseFilters({
	categories,
	levels,
	durations,
	onFiltersChange,
}: CourseFiltersProps) {
	const t = useTranslations("courses");
	const router = useRouter();
	const searchParams = useSearchParams();

	const [selectedCategories, setSelectedCategories] = useState<string[]>(
		searchParams.get("categories")?.split(",") || []
	);
	const [selectedLevels, setSelectedLevels] = useState<string[]>(
		searchParams.get("levels")?.split(",") || []
	);
	const [selectedDurations, setSelectedDurations] = useState<string[]>(
		searchParams.get("durations")?.split(",") || []
	);

	const updateFilters = (newFilters: {
		categories?: string[];
		levels?: string[];
		durations?: string[];
	}) => {
		const params = new URLSearchParams(searchParams.toString());

		if (newFilters.categories !== undefined) {
			if (newFilters.categories.length > 0) {
				params.set("categories", newFilters.categories.join(","));
			} else {
				params.delete("categories");
			}
		}

		if (newFilters.levels !== undefined) {
			if (newFilters.levels.length > 0) {
				params.set("levels", newFilters.levels.join(","));
			} else {
				params.delete("levels");
			}
		}

		if (newFilters.durations !== undefined) {
			if (newFilters.durations.length > 0) {
				params.set("durations", newFilters.durations.join(","));
			} else {
				params.delete("durations");
			}
		}

		router.push(`?${params.toString()}`);
		onFiltersChange?.({
			categories: newFilters.categories || selectedCategories,
			levels: newFilters.levels || selectedLevels,
			durations: newFilters.durations || selectedDurations,
		});
	};

	const clearAllFilters = () => {
		setSelectedCategories([]);
		setSelectedLevels([]);
		setSelectedDurations([]);
		const params = new URLSearchParams(searchParams.toString());
		params.delete("categories");
		params.delete("levels");
		params.delete("durations");
		router.push(`?${params.toString()}`);
		onFiltersChange?.({
			categories: [],
			levels: [],
			durations: [],
		});
	};

	const hasActiveFilters =
		selectedCategories.length > 0 || selectedLevels.length > 0 || selectedDurations.length > 0;

	return (
		<Sheet>
			<SheetTrigger asChild={true}>
				<Button variant="outline" className="gap-2">
					<Filter className="h-4 w-4" />
					{t("filterSheet.filters")}
					{hasActiveFilters && (
						<span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
							{selectedCategories.length +
								selectedLevels.length +
								selectedDurations.length}
						</span>
					)}
				</Button>
			</SheetTrigger>
			<SheetContent className="w-full sm:max-w-md">
				<SheetHeader>
					<SheetTitle>{t("filterSheet.title")}</SheetTitle>
					<SheetDescription>{t("filterSheet.description")}</SheetDescription>
				</SheetHeader>

				<div className="space-y-6 mt-6">
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-base font-medium">
								{t("filterSheet.categories")}
							</Label>
							{selectedCategories.length > 0 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedCategories([]);
										updateFilters({ categories: [] });
									}}
									className="h-auto p-1 text-muted-foreground hover:text-foreground"
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
						<div className="space-y-2">
							{categories.map((category) => (
								<div key={category} className="flex items-center space-x-2">
									<Checkbox
										id={`category-${category}`}
										checked={selectedCategories.includes(category)}
										onCheckedChange={(checked) => {
											const newCategories = checked
												? [...selectedCategories, category]
												: selectedCategories.filter((c) => c !== category);
											setSelectedCategories(newCategories);
											updateFilters({ categories: newCategories });
										}}
									/>
									<Label
										htmlFor={`category-${category}`}
										className="text-sm font-normal capitalize cursor-pointer"
									>
										{category.replace("-", " ")}
									</Label>
								</div>
							))}
						</div>
					</div>

					<Separator />

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-base font-medium">
								{t("filterSheet.level")}
							</Label>
							{selectedLevels.length > 0 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedLevels([]);
										updateFilters({ levels: [] });
									}}
									className="h-auto p-1 text-muted-foreground hover:text-foreground"
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
						<div className="space-y-2">
							{levels.map((level) => (
								<div key={level} className="flex items-center space-x-2">
									<Checkbox
										id={`level-${level}`}
										checked={selectedLevels.includes(level)}
										onCheckedChange={(checked) => {
											const newLevels = checked
												? [...selectedLevels, level]
												: selectedLevels.filter((l) => l !== level);
											setSelectedLevels(newLevels);
											updateFilters({ levels: newLevels });
										}}
									/>
									<Label
										htmlFor={`level-${level}`}
										className="text-sm font-normal capitalize cursor-pointer"
									>
										{level}
									</Label>
								</div>
							))}
						</div>
					</div>

					<Separator />

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-base font-medium">
								{t("filterSheet.duration")}
							</Label>
							{selectedDurations.length > 0 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedDurations([]);
										updateFilters({ durations: [] });
									}}
									className="h-auto p-1 text-muted-foreground hover:text-foreground"
								>
									<X className="h-4 w-4" />
								</Button>
							)}
						</div>
						<div className="space-y-2">
							{durations.map((duration) => (
								<div key={duration} className="flex items-center space-x-2">
									<Checkbox
										id={`duration-${duration}`}
										checked={selectedDurations.includes(duration)}
										onCheckedChange={(checked) => {
											const newDurations = checked
												? [...selectedDurations, duration]
												: selectedDurations.filter((d) => d !== duration);
											setSelectedDurations(newDurations);
											updateFilters({ durations: newDurations });
										}}
									/>
									<Label
										htmlFor={`duration-${duration}`}
										className="text-sm font-normal cursor-pointer"
									>
										{duration}
									</Label>
								</div>
							))}
						</div>
					</div>

					{hasActiveFilters && (
						<>
							<Separator />
							<Button variant="outline" onClick={clearAllFilters} className="w-full">
								{t("filterSheet.clearAll")}
							</Button>
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
