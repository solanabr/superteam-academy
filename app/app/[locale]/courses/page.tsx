/**
 * @fileoverview Main Course Catalog page.
 * Fetches course data and dashboard stats server-side and renders the catalog view.
 */
import { CourseCatalogView } from "@/components/courses/CourseCatalogView";
import { CuratedPaths } from "@/components/courses/CuratedPaths";
import { LastAccessed } from "@/components/courses/LastAccessed";
import { SessionStats } from "@/components/courses/SessionStats";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { DotGrid } from "@/components/shared/DotGrid";
import { getCoursesDashboardData } from "@/lib/actions/gamification";
import { getSessionServer } from "@/lib/auth/server";
import { Course, mockLearningPaths } from "@/lib/data/courses";
import { getPostHogClient } from "@/lib/posthog-server";
import { ALL_COURSES_QUERY, client } from "@/sanity/client";

/**
 * CoursesPage (Server Component)
 * The primary entry point for the courses directory, handling initial data fetching and tracking.
 */
export default async function CoursesPage() {
	// Track course catalog view server-side
	const session = await getSessionServer();
	if (session) {
		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: session.user.id,
			event: "courses_viewed",
			properties: {
				user_email: session.user.email,
			},
		});
		await posthog.shutdown();
	}

	// Fetch dashboard data parallel with Sanity course content
	const [dashboardData, sanityDataResult] = await Promise.allSettled([
		getCoursesDashboardData(),
		client.fetch<Course[]>(ALL_COURSES_QUERY, {}, { cache: "no-store" }),
	]);

	const { stats, lastAccessed } =
		dashboardData.status === "fulfilled"
			? dashboardData.value
			: {
					stats: {
						totalXP: 0,
						coursesActive: 0,
						completionRate: 0,
						certificates: 0,
						currentStreak: 0,
						level: 1,
					},
					lastAccessed: null,
				};

	const sanityData =
		sanityDataResult.status === "fulfilled" ? sanityDataResult.value : [];

	// Only show real Sanity courses in the main grid
	const activeCourses = [...sanityData];

	return (
		<div className="min-h-screen bg-bg-base">
			{/* App Shell Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full">
				{/* Top Bar - spans all columns */}
				<div className="col-span-1 lg:col-span-2">
					<TopBar />
				</div>

				{/* Nav Rail */}
				<NavRail />

				{/* Main Content Area */}
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] overflow-visible lg:overflow-hidden relative">
					<DotGrid />
					{/* Left: Course Catalog */}
					<main className="px-4 py-6 lg:px-8 lg:py-8 overflow-visible lg:overflow-y-auto relative z-10">
						{/* Header */}
						<div className="mb-8 lg:mb-12">
							<div className="mb-6 border-b border-ink-secondary/20 dark:border-border pb-4 relative">
								<span className="bg-ink-primary text-bg-base px-3 py-1 text-[10px] uppercase tracking-widest inline-block mb-3">
									DATABASE ACCESS
								</span>
								<h1 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[32px] sm:text-[36px] lg:text-[48px]">
									COURSE CATALOG
								</h1>
								<div className="absolute bottom-[-3px] right-0 w-full h-px border-b border-dashed border-ink-secondary/20 dark:border-border" />
							</div>

							{/* Course Catalog (Filtering + Search) */}
							<CourseCatalogView initialCourses={activeCourses} />
						</div>

						{/* Divider/Spacer */}
						<div className="h-24" />

						{/* Curated Paths */}
						<CuratedPaths paths={mockLearningPaths} />

						{/* Bottom spacing */}
						<div className="h-12" />
					</main>

					{/* Right: Context Panel */}
					<aside className="bg-bg-base px-6 py-8 flex flex-col gap-12 border-t lg:border-t-0 border-l-0 lg:border-l border-ink-secondary/20 dark:border-border overflow-visible lg:overflow-y-auto relative z-10">
						<SessionStats initialStats={stats} />
						<LastAccessed initialCourse={lastAccessed} />
					</aside>
				</div>
			</div>
		</div>
	);
}
