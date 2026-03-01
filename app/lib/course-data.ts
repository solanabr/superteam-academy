import type { Course, CourseAuthor } from "@superteam-academy/cms";
import { resolveCourseImageUrl } from "@/lib/cms";
import { getGravatarUrl } from "@/lib/utils";
import { getUserByWallet } from "@/lib/sanity-users";

type CourseReviewView = {
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
	otherCourses: Array<{ title: string; slug: string; rating: string; students: string }>;
};

export async function mapCourseToDetail(
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
		otherCourses?: Array<{ title: string; slug: string; rating: string; students: string }>;
	}
): Promise<CourseDetailView> {
	const lessons = course?.modules?.flatMap((module) => module.lessons ?? []) ?? [];
	const lessonCount = onchain?.lessonCount ?? Math.max(1, lessons.length);
	const xpPerLesson = onchain?.xpPerLesson ?? 100;
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

	const expandedAuthor =
		course?.author && "name" in course.author ? (course.author as CourseAuthor) : null;
	const authorBio =
		expandedAuthor?.bio
			?.flatMap((block) => block.children?.map((c) => c.text) ?? [])
			.join(" ") ?? "";
	const instructorUser = expandedAuthor?.walletAddress
		? await getUserByWallet(expandedAuthor.walletAddress)
		: null;

	const lessonStates = options?.enrollment?.lessonStates ?? [];
	let lessonIndexPointer = 0;

	const modules =
		course?.modules?.map((module, moduleIndex) => {
			const moduleLessons = module.lessons ?? [];
			const lessonsList = moduleLessons.map((lesson, lessonIndex) => {
				const lessonType: "video" | "interactive" | "quiz" | "reading" = lesson.title
					.toLowerCase()
					.includes("quiz")
					? "quiz"
					: lesson.title.toLowerCase().includes("challenge") ||
							lesson.title.toLowerCase().includes("interactive")
						? "interactive"
						: "video";
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

	const instructorName = instructorUser?.name ?? expandedAuthor?.name ?? "Superteam Instructor";

	let instructorAvatar = expandedAuthor?.image
		? resolveCourseImageUrl(expandedAuthor.image, 256, 256)
		: null;
	if (!instructorAvatar) {
		instructorAvatar = instructorUser?.image ?? null;
	}
	if (!instructorAvatar) {
		instructorAvatar = getGravatarUrl(instructorUser?.email ?? instructorName);
	}

	return {
		id,
		title: course?.title ?? id,
		description: course?.description ?? "",
		shortDescription: course?.description ?? "",
		category: course?.track ?? "solana",
		level: course?.level ?? "beginner",
		duration: course?.duration ?? "1 hour",
		rating: averageRating,
		reviewCount: reviews.length,
		students: onchain?.totalEnrollments ?? 0,
		instructor: {
			name: instructorName,
			title: instructorUser?.title ?? "Course Instructor",
			avatar: instructorAvatar,
			bio: instructorUser?.bio ?? authorBio,
			courses: 1,
			students: onchain?.totalEnrollments ?? 0,
			rating: averageRating,
			socialLinks: {
				twitter: instructorUser?.twitter ?? "",
				linkedin: instructorUser?.linkedin ?? "",
				website: instructorUser?.portfolio ?? instructorUser?.website ?? "",
			},
		},
		image: resolveCourseImageUrl(course?.image, 1400, 788) ?? "/courses/default.jpg",
		videoPreview: "",
		tags: [course?.track ?? "solana"],
		xpReward: computedXpReward,
		price: 0,
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
			estimatedCompletion: course?.duration ?? "",
			lastActivity: "",
		},
		certificate: {
			title: `${course?.title ?? "Course"} Credential`,
			issuer: "Superteam Academy",
			type: "completion",
			verifiable: true,
		},
		learningObjectives: lessons.slice(0, 5).map((lesson) => lesson.title) || [
			"Complete all course lessons",
		],
		requirements: ["Solana wallet", "Basic development knowledge"],
		skills: [course?.track ?? "solana"],
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
		otherCourses: options?.otherCourses ?? [],
	};
}
