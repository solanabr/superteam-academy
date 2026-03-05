/**
 * @fileoverview Main client-side container for the course detail view.
 * Handles data fetching, loading states, and layout of the course header, modules, and reviews.
 */

"use client";

import { CaretRightIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { Link } from "@/i18n/routing";
import { useCourseDetails } from "@/lib/hooks/use-course";
import { CourseHeader } from "./CourseHeader";
import { ModuleList } from "./ModuleList";
import { ReviewsList } from "./ReviewsList";

/**
 * Props for the CourseViewClient component.
 */
interface CourseViewClientProps {
	/** Unique slug for the course to display */
	slug: string;
}

/**
 * Renders the full course detail page with a layout containing navigation,
 * course content, and reviews.
 */
export function CourseViewClient({ slug }: CourseViewClientProps) {
	const t = useTranslations("CourseDetail");
	const { data: course, isLoading, error } = useCourseDetails(slug);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-bg-base flex items-center justify-center">
				<div className="text-ink-secondary animate-pulse uppercase tracking-widest text-xs">
					{t("loading")}
				</div>
			</div>
		);
	}

	if (error || !course) {
		return (
			<div className="min-h-screen bg-bg-base flex items-center justify-center">
				<div className="text-red-500 uppercase tracking-widest text-xs">
					{t("errorLoading")}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-bg-base">
			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_350px] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full">
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>

				<NavRail />

				<main className="px-4 py-6 lg:px-8 lg:py-8 overflow-visible lg:overflow-y-auto">
					<nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-ink-secondary select-none mb-6">
						<Link
							href="/dashboard"
							className="hover:text-ink-primary transition-colors"
						>
							Dashboard
						</Link>
						<CaretRightIcon size={10} className="text-ink-tertiary" />
						<Link
							href="/courses"
							className="hover:text-ink-primary transition-colors"
						>
							Courses
						</Link>
						<CaretRightIcon size={10} className="text-ink-tertiary" />
						<span
							className="text-ink-primary font-bold truncate max-w-[200px]"
							title={course.title}
						>
							{course.title}
						</span>
					</nav>

					<CourseHeader
						courseSlug={course.slug}
						title={course.title}
						courseRef={course.ref}
						category={course.category}
						description={course.description}
						instructor={course.instructor}
						duration={course.duration}
						difficulty={course.difficulty}
						xpBounty={course.xpBounty}
						enrolled={course.enrolled}
						progress={course.progress}
						onChainStatus={course.onChainStatus}
						credentialAsset={course.credentialAsset}
						nextLessonId={
							course.modules.flatMap((m) => m.lessons).find((l) => !l.completed)
								?.id
						}
					/>

					<ModuleList
						modules={course.modules}
						progress={course.progress}
						courseSlug={course.slug}
						enrolled={course.enrolled}
					/>

					<div className="h-12" />
				</main>

				<aside className="bg-bg-base px-6 py-8 border-t lg:border-t-0 border-l-0 lg:border-l border-ink-secondary/20 dark:border-border overflow-visible lg:overflow-y-auto">
					<ReviewsList reviews={course.reviews} />
				</aside>
			</div>
		</div>
	);
}
