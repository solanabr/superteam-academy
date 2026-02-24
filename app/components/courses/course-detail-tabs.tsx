"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@superteam-academy/i18n/navigation";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseModules } from "./course-modules";
import { CourseReviews } from "./course-reviews";
import { CourseInstructor } from "./course-instructor";
import type { CourseDetailView } from "@/lib/course-data";

const VALID_TABS = ["overview", "curriculum", "reviews", "instructor"] as const;

type CourseDetailTab = (typeof VALID_TABS)[number];

function normalizeTab(value: string | null | undefined): CourseDetailTab {
	if (!value) return "overview";
	return (VALID_TABS as readonly string[]).includes(value)
		? (value as CourseDetailTab)
		: "overview";
}

interface CourseDetailTabsProps {
	course: CourseDetailView;
	courseId: string;
	initialTab?: string;
}

export function CourseDetailTabs({ course, courseId, initialTab }: CourseDetailTabsProps) {
	const t = useTranslations("courses");
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState<CourseDetailTab>(() =>
		normalizeTab(initialTab ?? searchParams.get("tab"))
	);

	const syncTab = useMemo(() => normalizeTab(searchParams.get("tab")), [searchParams]);

	useEffect(() => {
		if (syncTab !== activeTab) {
			setActiveTab(syncTab);
		}
	}, [syncTab, activeTab]);

	const handleTabChange = useCallback(
		(value: string) => {
			const nextTab = normalizeTab(value);
			setActiveTab(nextTab);
			const params = new URLSearchParams(searchParams.toString());
			if (nextTab === "overview") {
				params.delete("tab");
			} else {
				params.set("tab", nextTab);
			}
			const query = params.toString();
			router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
		},
		[router, pathname, searchParams]
	);

	return (
		<Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
			<TabsList className="grid w-full grid-cols-4">
				<TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
				<TabsTrigger value="curriculum">{t("tabs.curriculum")}</TabsTrigger>
				<TabsTrigger value="reviews">{t("tabs.reviews")}</TabsTrigger>
				<TabsTrigger value="instructor">{t("tabs.instructor")}</TabsTrigger>
			</TabsList>

			<TabsContent value="overview" className="space-y-6">
				<div className="prose prose-gray dark:prose-invert max-w-none">
					<h2>{t("overview.title")}</h2>
					<p className="text-lg leading-relaxed">{course.description}</p>

					<h3>{t("overview.whatYouWillLearn")}</h3>
					<ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
						{course.learningObjectives.map((objective, index) => (
							<li key={index} className="flex items-start gap-2">
								<CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
								<span>{objective}</span>
							</li>
						))}
					</ul>

					<h3>{t("overview.requirements")}</h3>
					<ul>
						{course.requirements.map((requirement, index) => (
							<li key={index}>{requirement}</li>
						))}
					</ul>

					<h3>{t("overview.skills")}</h3>
					<div className="flex flex-wrap gap-2">
						{course.skills.map((skill) => (
							<Badge key={skill} variant="secondary">
								{skill}
							</Badge>
						))}
					</div>
				</div>
			</TabsContent>

			<TabsContent value="curriculum" className="space-y-6">
				<CourseModules
					courseId={courseId}
					modules={course.modules}
					isEnrolled={course.enrolled}
				/>
			</TabsContent>

			<TabsContent value="reviews" className="space-y-6">
				<CourseReviews
					courseId={courseId}
					reviews={course.reviews}
					averageRating={course.rating}
					totalReviews={course.reviewCount}
				/>
			</TabsContent>

			<TabsContent value="instructor" className="space-y-6">
				<CourseInstructor
					instructor={course.instructor}
					otherCourses={course.otherCourses}
				/>
			</TabsContent>
		</Tabs>
	);
}
