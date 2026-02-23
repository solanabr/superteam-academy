import { Suspense } from "react";
import type { Metadata } from "next";
import { Link } from "@superteam-academy/i18n/navigation";
import { Search, LayoutGrid, List, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseGrid } from "@/components/courses/course-grid";
import { CourseList } from "@/components/courses/course-list";
import { CoursesFilters } from "@/components/courses/courses-filters";
import { Pagination } from "@/components/ui/pagination";
import { getCoursesCMS, isSanityConfigured, resolveCourseImageUrl } from "@/lib/cms";
import { FRONTEND_SEED_COURSES } from "@superteam-academy/cms";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
	title: "Catalog | Superteam Academy",
	description:
		"Browse 50+ courses on Solana development, DeFi, security, and more. Earn XP and verifiable on-chain credentials.",
};

interface CoursesPageProps {
	searchParams: Promise<{
		q?: string;
		category?: string;
		level?: string;
		sort?: string;
		view?: "grid" | "list";
		page?: string;
	}>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
	const {
		q = "",
		category = "all",
		level = "all",
		sort = "popular",
		view = "grid",
		page = "1",
	} = await searchParams;

	const hasFilters = q || category !== "all" || level !== "all";
	const t = await getTranslations("courses");

	return (
		<div className="min-h-screen">
			<div className="border-b border-border/60 noise">
				<div className="mx-auto px-4 sm:px-6 py-10 sm:py-14">
					<h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
						{t("catalog.title")}
					</h1>
					<p className="mt-3 text-lg text-muted-foreground max-w-xl">
						{t("catalog.description")}
					</p>
				</div>
			</div>

			<div className="sticky top-16 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
				<div className="mx-auto px-4 sm:px-6 py-3">
					<div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
						<CoursesFilters q={q} category={category} level={level} sort={sort} />

						<div className="h-5 w-px bg-border/60 hidden lg:block" />

						<div className="flex items-center rounded-lg border border-border/60 overflow-hidden">
							<a
								href={buildFilterUrl({
									q,
									category,
									level,
									sort,
									view: "grid",
								})}
								className={`p-2 transition-colors ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
							>
								<LayoutGrid className="h-3.5 w-3.5" />
							</a>
							<a
								href={buildFilterUrl({
									q,
									category,
									level,
									sort,
									view: "list",
								})}
								className={`p-2 transition-colors border-l border-border/60 ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
							>
								<List className="h-3.5 w-3.5" />
							</a>
						</div>
					</div>

					{hasFilters && (
						<div className="flex items-center gap-2 mt-3 flex-wrap">
							<span className="text-xs text-muted-foreground">
								{t("catalog.filters")}:
							</span>
							{q && (
								<Badge
									variant="secondary"
									className="gap-1 text-xs font-normal pr-1"
								>
									&ldquo;{q}&rdquo;
									<a
										href={buildFilterUrl({ category, level, sort, view })}
										className="ml-0.5 p-0.5 rounded-full hover:bg-muted-foreground/20"
									>
										<X className="h-3 w-3" />
									</a>
								</Badge>
							)}
							{category !== "all" && (
								<Badge
									variant="secondary"
									className="gap-1 text-xs font-normal pr-1"
								>
									{t(`categories.${category}`)}
									<a
										href={buildFilterUrl({ q, level, sort, view })}
										className="ml-0.5 p-0.5 rounded-full hover:bg-muted-foreground/20"
									>
										<X className="h-3 w-3" />
									</a>
								</Badge>
							)}
							{level !== "all" && (
								<Badge
									variant="secondary"
									className="gap-1 text-xs font-normal pr-1"
								>
									{t(`levels.${level}`)}
									<a
										href={buildFilterUrl({ q, category, sort, view })}
										className="ml-0.5 p-0.5 rounded-full hover:bg-muted-foreground/20"
									>
										<X className="h-3 w-3" />
									</a>
								</Badge>
							)}
							<a
								href="/courses"
								className="text-xs text-primary hover:underline ml-1"
							>
								{t("catalog.clearAll")}
							</a>
						</div>
					)}
				</div>
			</div>

			<div className="mx-auto px-4 sm:px-6 py-8">
				<Suspense fallback={<CoursesSkeleton view={view} />}>
					<CoursesContent searchParams={{ q, category, level, sort, view, page }} />
				</Suspense>
			</div>
		</div>
	);
}

function buildFilterUrl(params: Record<string, string | undefined>) {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value && value !== "all" && value !== "popular" && value !== "grid") {
			search.set(key, value);
		}
	}
	const qs = search.toString();
	return `/courses${qs ? `?${qs}` : ""}`;
}

async function CoursesContent({
	searchParams,
}: {
	searchParams: Awaited<CoursesPageProps["searchParams"]>;
}) {
	const courses = await getCourses(searchParams);
	const totalPages = Math.ceil(courses.length / 12);
	const t = await getTranslations("courses");

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{courses.length === 1
						? t("catalog.count", { count: courses.length })
						: t("catalog.countPlural", { count: courses.length })}
				</p>
			</div>

			{searchParams.view === "list" ? (
				<CourseList courses={courses} />
			) : (
				<CourseGrid courses={courses} />
			)}

			{totalPages > 1 && (
				<div className="flex justify-center pt-4">
					<Pagination
						currentPage={parseInt(searchParams.page || "1", 10)}
						totalPages={totalPages}
						baseUrl="/courses"
						searchParams={searchParams}
					/>
				</div>
			)}

			{courses.length === 0 && (
				<div className="text-center py-16 space-y-4">
					<div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
						<Search className="h-7 w-7 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-semibold">{t("empty.title")}</h3>
					<p className="text-muted-foreground max-w-sm mx-auto text-sm">
						{t("empty.description")}
					</p>
					<Button variant="outline" size="sm" asChild>
						<Link href="/courses">{t("empty.clearFilters")}</Link>
					</Button>
				</div>
			)}
		</div>
	);
}

function CoursesSkeleton({ view }: { view: string }) {
	if (view === "list") {
		return (
			<div className="space-y-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className="flex gap-5 p-5 rounded-2xl bg-muted/30 border border-border/40"
					>
						<Skeleton className="h-20 w-28 rounded-xl shrink-0" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-5 w-2/3" />
							<Skeleton className="h-4 w-full" />
							<div className="flex gap-2 pt-1">
								<Skeleton className="h-5 w-14 rounded-full" />
								<Skeleton className="h-5 w-18 rounded-full" />
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{Array.from({ length: 6 }).map((_, i) => (
				<div
					key={i}
					className="rounded-2xl bg-muted/30 border border-border/40 overflow-hidden"
				>
					<Skeleton className="h-40 w-full" />
					<div className="p-5 space-y-3">
						<Skeleton className="h-5 w-3/4" />
						<Skeleton className="h-4 w-full" />
						<div className="flex gap-3 pt-1">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-14" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

async function getCourses(searchParams: Awaited<CoursesPageProps["searchParams"]>) {
	// When Sanity is configured, fetch from CMS; otherwise use seed data
	let baseCourses: typeof FRONTEND_SEED_COURSES;
	if (isSanityConfigured) {
		const cmsCourses = await getCoursesCMS();
		baseCourses = cmsCourses.map((c) => ({
			id: c.slug?.current ?? c._id,
			title: c.title,
			description: c.description ?? "",
			category: c.track ?? "solana",
			level: c.level,
			duration: c.duration ?? "",
			students: 0,
			instructor: "",
			image: resolveCourseImageUrl(c.image, 960, 540) ?? "/courses/default.jpg",
			tags: [c.track ?? "solana"],
			topics: [],
			xpReward: c.xpReward,
			price: 0,
			featured: false,
			gradient: "from-green to-forest",
		}));
		if (baseCourses.length === 0) baseCourses = FRONTEND_SEED_COURSES;
	} else {
		baseCourses = FRONTEND_SEED_COURSES;
	}

	let filtered = [...baseCourses];

	if (searchParams.q) {
		const query = searchParams.q.toLowerCase();
		filtered = filtered.filter(
			(course) =>
				course.title.toLowerCase().includes(query) ||
				course.description.toLowerCase().includes(query) ||
				course.tags.some((tag) => tag.includes(query))
		);
	}

	if (searchParams.category && searchParams.category !== "all") {
		filtered = filtered.filter((course) => course.category === searchParams.category);
	}

	if (searchParams.level && searchParams.level !== "all") {
		filtered = filtered.filter((course) => course.level === searchParams.level);
	}

	if (searchParams.sort === "xp") {
		filtered.sort((a, b) => b.xpReward - a.xpReward);
	} else if (searchParams.sort === "newest") {
		filtered.reverse();
	} else if (searchParams.sort === "duration") {
		filtered.sort((a, b) => parseInt(a.duration, 10) - parseInt(b.duration, 10));
	} else {
		filtered.sort((a, b) => b.students - a.students);
	}

	return filtered;
}
