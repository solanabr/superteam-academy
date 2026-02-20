import { FRONTEND_SEED_COURSES } from "@superteam/cms";
import type { Course } from "@superteam/cms";
import { resolveCourseImageUrl } from "@/lib/cms";

export type CourseReviewView = {
	id: string;
	user: {
		name: string;
		avatar: string;
	};
	rating: number;
	date: string;
	comment: string;
	helpful: number;
};

export type CourseDetailView = {
	id: string;
	title: string;
	description: string;
	shortDescription: string;
	category: string;
	level: string;
	duration: string;
	rating: number;
	reviewCount: number;
	students: number;
	instructor: {
		name: string;
		title: string;
		avatar: string;
		bio: string;
		courses: number;
		students: number;
		rating: number;
		socialLinks: {
			twitter: string;
			linkedin: string;
			website: string;
		};
	};
	image: string;
	videoPreview: string;
	tags: string[];
	xpReward: number;
	price: number;
	enrolled: boolean;
	progress: {
		percentage: number;
		completedLessons: number;
		totalLessons: number;
		timeSpent: string;
		streak: number;
		xpEarned: number;
		xpTotal: number;
		estimatedCompletion: string;
		lastActivity: string;
	};
	certificate: {
		title: string;
		issuer: string;
		type: string;
		verifiable: boolean;
	};
	learningObjectives: string[];
	requirements: string[];
	skills: string[];
	modules: Array<{
		id: string;
		title: string;
		description: string;
		duration: string;
		lessons: number;
		completed: boolean;
		lessonsList: Array<{
			id: string;
			title: string;
			duration: string;
			type: "video" | "interactive" | "quiz" | "reading";
			completed: boolean;
		}>;
	}>;
	reviews: Array<{
		id: string;
		user: { name: string; avatar: string };
		rating: number;
		date: string;
		comment: string;
		helpful: number;
	}>;
	prerequisites: Array<{ id: string; title: string; completed: boolean }>;
};

export function seedCourseById(id: string) {
	return FRONTEND_SEED_COURSES.find((course) => course.id === id) ?? null;
}

export function mapCourseToDetail(
	id: string,
	course: Course | null,
	onchain: {
		xpPerLesson?: number;
		lessonCount?: number;
		trackId?: number;
		trackLevel?: number;
		prerequisiteLabel?: string | null;
	} | null,
	options?: {
		reviews?: CourseReviewView[];
	}
): CourseDetailView {
	const seed = seedCourseById(id);
	const lessons = course?.modules?.flatMap((module) => module.lessons ?? []) ?? [];
	const lessonCount = onchain?.lessonCount ?? Math.max(1, lessons.length);
	const xpPerLesson =
		onchain?.xpPerLesson ?? Math.max(1, Math.floor((seed?.xpReward ?? 100) / lessonCount));
	const computedXpReward = xpPerLesson * lessonCount;
	const reviews = options?.reviews ?? [];
	const averageRating =
		reviews.length > 0
			? Number(
					(
						reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
					).toFixed(1)
				)
			: 4.7;

	const modules =
		course?.modules?.map((module, moduleIndex) => {
			const moduleLessons = module.lessons ?? [];
			return {
				id: module.slug?.current ?? `${id}-module-${moduleIndex + 1}`,
				title: module.title,
				description: module.description ?? "",
				duration: `${Math.max(1, moduleLessons.length * 10)} min`,
				lessons: moduleLessons.length,
				completed: false,
				lessonsList: moduleLessons.map((lesson, lessonIndex) => {
					const lessonType: "quiz" | "video" = lesson.title.toLowerCase().includes("quiz")
						? "quiz"
						: "video";

					return {
						id:
							lesson.slug?.current ??
							`${id}-lesson-${moduleIndex + 1}-${lessonIndex + 1}`,
						title: lesson.title,
						duration: lesson.duration ?? "10 min",
						type: lessonType,
						completed: false,
					};
				}),
			};
		}) ?? [];

	return {
		id,
		title: course?.title ?? seed?.title ?? id,
		description: course?.description ?? seed?.description ?? "",
		shortDescription: course?.description ?? seed?.description ?? "",
		category: course?.track ?? seed?.category ?? "solana",
		level: course?.level ?? seed?.level ?? "beginner",
		duration: course?.duration ?? seed?.duration ?? "1 hour",
		rating: averageRating,
		reviewCount: reviews.length,
		students: seed?.students ?? 0,
		instructor: {
			name: seed?.instructor ?? "Superteam Instructor",
			title: "Course Instructor",
			avatar: "/instructors/default.jpg",
			bio: "",
			courses: 1,
			students: seed?.students ?? 0,
			rating: 4.7,
			socialLinks: {
				twitter: "",
				linkedin: "",
				website: "",
			},
		},
		image:
			resolveCourseImageUrl(course?.image, 1400, 788) ??
			seed?.image ??
			"/courses/default.jpg",
		videoPreview: "",
		tags: seed?.tags ?? [course?.track ?? "solana"],
		xpReward: computedXpReward,
		price: seed?.price ?? 0,
		enrolled: false,
		progress: {
			percentage: 0,
			completedLessons: 0,
			totalLessons: lessonCount,
			timeSpent: "0 min",
			streak: 0,
			xpEarned: 0,
			xpTotal: computedXpReward,
			estimatedCompletion: course?.duration ?? seed?.duration ?? "",
			lastActivity: "",
		},
		certificate: {
			title: `${course?.title ?? seed?.title ?? "Course"} Credential`,
			issuer: "Superteam Academy",
			type: "completion",
			verifiable: true,
		},
		learningObjectives: lessons.slice(0, 5).map((lesson) => lesson.title) || [
			"Complete all course lessons",
		],
		requirements: ["Solana wallet", "Basic development knowledge"],
		skills: seed?.tags ?? ["solana"],
		modules:
			modules.length > 0
				? modules
				: [
						{
							id: `${id}-module-1`,
							title: "Core Curriculum",
							description: "Course lessons",
							duration: `${lessonCount * 10} min`,
							lessons: lessonCount,
							completed: false,
							lessonsList: Array.from({ length: lessonCount }, (_, index) => ({
								id: `${id}-lesson-${index + 1}`,
								title: `Lesson ${index + 1}`,
								duration: "10 min",
								type: "video" as const,
								completed: false,
							})),
						},
					],
		reviews,
		prerequisites: onchain?.prerequisiteLabel
			? [{ id: "prereq", title: onchain.prerequisiteLabel, completed: false }]
			: [],
	};
}
