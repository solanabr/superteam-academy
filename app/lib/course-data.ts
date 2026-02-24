import { FRONTEND_SEED_COURSES, ONCHAIN_COURSE_STUBS } from "@superteam-academy/cms";
import type { Course } from "@superteam-academy/cms";
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
	finalized: boolean;
	prerequisiteCourseId?: string;
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
		prerequisite?: { id: string; title: string; completed: boolean } | null;
		totalEnrollments?: number;
	} | null,
	options?: {
		reviews?: CourseReviewView[];
		enrollment?: {
			enrolled: boolean;
			completedLessons: number;
			xpEarned: number;
			finalized: boolean;
			lessonStates?: boolean[];
		} | null;
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

	const lessonStates = options?.enrollment?.lessonStates ?? [];
	let lessonIndexPointer = 0;

	const modules =
		course?.modules?.map((module, moduleIndex) => {
			const moduleLessons = module.lessons ?? [];
			const lessonsList = moduleLessons.map((lesson, lessonIndex) => {
				const stub = ONCHAIN_COURSE_STUBS.find((s) => s.courseId === id);
				const stubLesson = stub?.lessons.find(
					(sl) => sl.title.toLowerCase() === lesson.title.toLowerCase()
				);
				const lessonType: "video" | "interactive" | "quiz" | "reading" =
					stubLesson?.kind ??
					(lesson.title.toLowerCase().includes("quiz") ? "quiz" : "video");
				const completed = lessonStates[lessonIndexPointer] ?? false;
				lessonIndexPointer += 1;

				return {
					id:
						lesson.slug?.current ??
						`${id}-lesson-${moduleIndex + 1}-${lessonIndex + 1}`,
					title: lesson.title,
					duration: lesson.duration ?? "10 min",
					type: lessonType,
					completed,
				};
			});

			return {
				id: module.slug?.current ?? `${id}-module-${moduleIndex + 1}`,
				title: module.title,
				description: module.description ?? "",
				duration: `${Math.max(1, moduleLessons.length * 10)} min`,
				lessons: moduleLessons.length,
				completed:
					lessonsList.length > 0 && lessonsList.every((lesson) => lesson.completed),
				lessonsList,
			};
		}) ?? [];

	const enrollmentData = options?.enrollment;
	const enrolled = enrollmentData?.enrolled ?? false;
	const finalized = enrollmentData?.finalized ?? false;
	const completedLessonsCount = enrollmentData?.completedLessons ?? 0;
	const xpEarned = enrollmentData?.xpEarned ?? 0;
	const progressPercent =
		lessonCount > 0 ? Math.round((completedLessonsCount / lessonCount) * 100) : 0;

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
		students: onchain?.totalEnrollments ?? seed?.students ?? 0,
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
		enrolled,
		finalized,
		prerequisiteCourseId: onchain?.prerequisite?.id,
		progress: {
			percentage: progressPercent,
			completedLessons: completedLessonsCount,
			totalLessons: lessonCount,
			timeSpent: `${completedLessonsCount * 10} min`,
			streak: 0,
			xpEarned,
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
							completed: lessonStates.length > 0 && lessonStates.every(Boolean),
							lessonsList: Array.from({ length: lessonCount }, (_, index) => ({
								id: `${id}-lesson-${index + 1}`,
								title: `Lesson ${index + 1}`,
								duration: "10 min",
								type: "video" as const,
								completed: lessonStates[index] ?? false,
							})),
						},
					],
		reviews,
		prerequisites: onchain?.prerequisite
			? [onchain.prerequisite]
			: onchain?.prerequisiteLabel
				? [
						{
							id: onchain.prerequisiteLabel,
							title: onchain.prerequisiteLabel,
							completed: false,
						},
					]
				: [],
	};
}
