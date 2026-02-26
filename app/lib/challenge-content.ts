import { createSanityClient } from "@superteam-academy/cms";
import type {
	LessonChallenge,
	LessonQuiz,
	ChallengeInstruction,
	ChallengeTest,
	ChallengeHint,
	QuizQuestion,
	QuizQuestionOption,
} from "@superteam-academy/cms";

interface CourseLessonRef {
	_id: string;
	title: string;
	slug?: { current: string };
}

interface CourseModuleRef {
	_id: string;
	title: string;
	lessons: CourseLessonRef[];
}

interface CourseRef {
	_id: string;
	title: string;
	slug?: { current: string };
	modules: CourseModuleRef[];
}

export interface ChallengePageData {
	course: CourseRef;
	lesson: CourseLessonRef;
	challenge: LessonChallenge;
}

export interface AdminLessonContent {
	lesson: CourseLessonRef;
	challenge: LessonChallenge | null;
	quiz: LessonQuiz | null;
}

let writeClientCache: ReturnType<typeof createSanityClient> | null | undefined;
let readClientCache: ReturnType<typeof createSanityClient> | null | undefined;

function getSanityReadClient() {
	if (readClientCache !== undefined) {
		return readClientCache;
	}
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_READ_TOKEN;
	if (!projectId || !token) {
		readClientCache = null;
		return readClientCache;
	}
	readClientCache = createSanityClient({ projectId, dataset, token, useCdn: false });
	return readClientCache;
}

export function getSanityWriteClient() {
	if (writeClientCache !== undefined) {
		return writeClientCache;
	}
	const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
	const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
	const token = process.env.SANITY_API_WRITE_TOKEN;
	if (!projectId || !token) {
		writeClientCache = null;
		return writeClientCache;
	}
	writeClientCache = createSanityClient({ projectId, dataset, token, useCdn: false });
	return writeClientCache;
}

export async function getCourseRefByIdOrSlug(courseIdOrSlug: string): Promise<CourseRef | null> {
	const client = getSanityReadClient();
	if (!client) return null;
	return client.fetch<CourseRef | null>(
		`*[_type == "course" && (_id == $courseIdOrSlug || slug.current == $courseIdOrSlug)][0] {
			_id,
			title,
			slug,
			"modules": *[_type == "module" && references(^._id)] | order(order asc) {
				_id,
				title,
				"lessons": *[_type == "lesson" && references(^._id)] | order(order asc) {
					_id,
					title,
					slug
				}
			}
		}`,
		{ courseIdOrSlug }
	);
}

export async function getChallengePageData(
	courseIdOrSlug: string,
	challengeSlug: string
): Promise<ChallengePageData | null> {
	const client = getSanityReadClient();
	if (!client) return null;

	const course = await getCourseRefByIdOrSlug(courseIdOrSlug);
	if (!course) return null;

	const lesson =
		course.modules
			.flatMap((module) => module.lessons)
			.find((item) => item.slug?.current === challengeSlug) ?? null;

	if (!lesson) return null;

	const challenge = await client.fetch<LessonChallenge | null>(
		`*[_type == "lessonChallenge" && references($lessonId) && references($courseId)][0] {
			_id,
			_type,
			_rev,
			_createdAt,
			_updatedAt,
			title,
			slug,
			description,
			difficulty,
			estimatedTime,
			xpReward,
			language,
			starterCode,
			instructions,
			objectives,
			tests,
			hints,
			published,
			course,
			lesson
		}`,
		{ lessonId: lesson._id, courseId: course._id }
	);

	if (!challenge || !challenge.published) return null;

	return { course, lesson, challenge };
}

export async function getLessonQuizPageData(courseIdOrSlug: string, lessonSlug: string) {
	const client = getSanityReadClient();
	if (!client) return null;

	const course = await getCourseRefByIdOrSlug(courseIdOrSlug);
	if (!course) return null;

	const lesson =
		course.modules
			.flatMap((module) => module.lessons)
			.find((item) => item.slug?.current === lessonSlug) ?? null;

	if (!lesson) return null;

	const quiz = await client.fetch<LessonQuiz | null>(
		`*[_type == "lessonQuiz" && references($lessonId) && references($courseId) && published == true][0] {
			_id,
			_type,
			_rev,
			_createdAt,
			_updatedAt,
			title,
			slug,
			passingScore,
			questions,
			published,
			course,
			lesson
		}`,
		{ lessonId: lesson._id, courseId: course._id }
	);

	if (!quiz) return null;

	return { course, lesson, quiz };
}

export async function getAdminLessonContent(
	courseIdOrSlug: string,
	lessonId: string
): Promise<AdminLessonContent | null> {
	const client = getSanityReadClient();
	if (!client) return null;

	const course = await getCourseRefByIdOrSlug(courseIdOrSlug);
	if (!course) return null;

	const lesson =
		course.modules.flatMap((module) => module.lessons).find((item) => item._id === lessonId) ??
		null;

	if (!lesson) return null;

	const challenge = await client.fetch<LessonChallenge | null>(
		`*[_type == "lessonChallenge" && references($lessonId) && references($courseId)][0] {
			_id,
			_type,
			_rev,
			_createdAt,
			_updatedAt,
			title,
			slug,
			description,
			difficulty,
			estimatedTime,
			xpReward,
			language,
			starterCode,
			instructions,
			objectives,
			tests,
			hints,
			published,
			course,
			lesson
		}`,
		{ lessonId, courseId: course._id }
	);

	const quiz = await client.fetch<LessonQuiz | null>(
		`*[_type == "lessonQuiz" && references($lessonId) && references($courseId)][0] {
			_id,
			_type,
			_rev,
			_createdAt,
			_updatedAt,
			title,
			slug,
			passingScore,
			questions,
			published,
			course,
			lesson
		}`,
		{ lessonId, courseId: course._id }
	);

	return { lesson, challenge, quiz };
}

export function createChallengeDraft(params: {
	lessonSlug: string;
	lessonTitle: string;
	courseId: string;
	lessonId: string;
}): Omit<
	LessonChallenge,
	keyof { _id: string; _rev: string; _createdAt: string; _updatedAt: string }
> {
	return {
		_type: "lessonChallenge",
		title: `${params.lessonTitle} Challenge`,
		slug: { _type: "slug", current: params.lessonSlug },
		description: "",
		difficulty: "beginner",
		estimatedTime: "30 min",
		xpReward: 100,
		language: "rust",
		starterCode: "// Write your solution here\n",
		instructions: [],
		objectives: [],
		tests: [],
		hints: [],
		published: false,
		course: { _ref: params.courseId },
		lesson: { _ref: params.lessonId },
	};
}

export function createQuizDraft(params: {
	lessonSlug: string;
	lessonTitle: string;
	courseId: string;
	lessonId: string;
}): Omit<LessonQuiz, keyof { _id: string; _rev: string; _createdAt: string; _updatedAt: string }> {
	return {
		_type: "lessonQuiz",
		title: `${params.lessonTitle} Quiz`,
		slug: { _type: "slug", current: `${params.lessonSlug}-quiz` },
		passingScore: 70,
		questions: [],
		published: false,
		course: { _ref: params.courseId },
		lesson: { _ref: params.lessonId },
	};
}

export type ChallengePayload = {
	title: string;
	description: string;
	difficulty: "beginner" | "intermediate" | "advanced";
	estimatedTime: string;
	xpReward: number;
	language: string;
	starterCode: string;
	instructions: ChallengeInstruction[];
	objectives: string[];
	tests: ChallengeTest[];
	hints: ChallengeHint[];
	published: boolean;
};

export type QuizPayload = {
	title: string;
	passingScore: number;
	questions: QuizQuestion[];
	published: boolean;
};

export type {
	ChallengeInstruction,
	ChallengeTest,
	ChallengeHint,
	QuizQuestion,
	QuizQuestionOption,
};
