import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { serverAuth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/sanity-users";
import {
	getAdminLessonContent,
	getCourseRefByIdOrSlug,
	getSanityWriteClient,
	createChallengeDraft,
	createQuizDraft,
} from "@/lib/challenge-content";
import { parseChallengePayload, parseQuizPayload } from "@/lib/admin-content-validation";

type RouteParams = { params: Promise<{ courseId: string; lessonId: string }> };

async function ensureAdmin() {
	const requestHeaders = await headers();
	const session = await serverAuth.api.getSession({ headers: requestHeaders });
	if (!session) {
		return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
	}

	const admin = await isUserAdmin(session.user.id, session.user.email);
	if (!admin) {
		return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
	}

	return { session };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const auth = await ensureAdmin();
	if (auth.error) return auth.error;

	const { courseId, lessonId } = await params;
	const content = await getAdminLessonContent(courseId, lessonId);
	if (!content) {
		return NextResponse.json({ error: "Lesson not found in course" }, { status: 404 });
	}

	return NextResponse.json({ content });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const auth = await ensureAdmin();
	if (auth.error) return auth.error;

	const { courseId, lessonId } = await params;
	const client = getSanityWriteClient();
	if (!client) {
		return NextResponse.json({ error: "Sanity write token not configured" }, { status: 500 });
	}

	const course = await getCourseRefByIdOrSlug(courseId);
	if (!course) {
		return NextResponse.json({ error: "Course not found" }, { status: 404 });
	}

	const lesson =
		course.modules.flatMap((module) => module.lessons).find((item) => item._id === lessonId) ??
		null;

	if (!lesson) {
		return NextResponse.json({ error: "Lesson not found in course" }, { status: 404 });
	}

	const body = (await request.json()) as {
		challenge?: unknown;
		quiz?: unknown;
	};

	const existing = await getAdminLessonContent(course._id, lessonId);
	if (!existing) {
		return NextResponse.json({ error: "Lesson content not available" }, { status: 404 });
	}

	if ("challenge" in body) {
		if (body.challenge === null) {
			if (existing.challenge?._id) {
				await client.delete(existing.challenge._id);
			}
		} else {
			const parsed = parseChallengePayload(body.challenge);
			if (!parsed) {
				return NextResponse.json({ error: "Invalid challenge payload" }, { status: 400 });
			}

			const challengeDoc = {
				...(existing.challenge ??
					createChallengeDraft({
						lessonSlug: lesson.slug?.current ?? lesson._id,
						lessonTitle: lesson.title,
						courseId: course._id,
						lessonId: lesson._id,
					})),
				title: parsed.title,
				description: parsed.description,
				difficulty: parsed.difficulty,
				estimatedTime: parsed.estimatedTime,
				xpReward: parsed.xpReward,
				language: parsed.language,
				starterCode: parsed.starterCode,
				instructions: parsed.instructions,
				objectives: parsed.objectives,
				tests: parsed.tests,
				hints: parsed.hints,
				published: parsed.published,
				slug: {
					_type: "slug" as const,
					current: lesson.slug?.current ?? lesson._id,
				},
				course: { _ref: course._id },
				lesson: { _ref: lesson._id },
			};

			if (existing.challenge?._id) {
				await client.patch(existing.challenge._id).set(challengeDoc).commit();
			} else {
				await client.create(challengeDoc);
			}
		}
	}

	if ("quiz" in body) {
		if (body.quiz === null) {
			if (existing.quiz?._id) {
				await client.delete(existing.quiz._id);
			}
		} else {
			const parsed = parseQuizPayload(body.quiz);
			if (!parsed) {
				return NextResponse.json({ error: "Invalid quiz payload" }, { status: 400 });
			}

			const quizDoc = {
				...(existing.quiz ??
					createQuizDraft({
						lessonSlug: lesson.slug?.current ?? lesson._id,
						lessonTitle: lesson.title,
						courseId: course._id,
						lessonId: lesson._id,
					})),
				title: parsed.title,
				passingScore: parsed.passingScore,
				questions: parsed.questions,
				published: parsed.published,
				slug: {
					_type: "slug" as const,
					current: `${lesson.slug?.current ?? lesson._id}-quiz`,
				},
				course: { _ref: course._id },
				lesson: { _ref: lesson._id },
			};

			if (existing.quiz?._id) {
				await client.patch(existing.quiz._id).set(quizDoc).commit();
			} else {
				await client.create(quizDoc);
			}
		}
	}

	const refreshed = await getAdminLessonContent(course._id, lesson._id);
	return NextResponse.json({ content: refreshed });
}
