import { NextResponse } from "next/server";
import { getAcademyClient } from "@/lib/academy";
import { countCompletedLessons } from "@superteam-academy/anchor";
import { calculateLevelFromXP } from "@superteam-academy/gamification";

export async function GET() {
	const academyClient = getAcademyClient();
	const [courses, enrollments] = await Promise.all([
		academyClient.fetchAllCourses(),
		academyClient.fetchAllEnrollments(),
	]);

	const byCourse = new Map<string, Map<string, number>>();
	for (const enrollment of enrollments) {
		const courseKey = enrollment.account.course.toBase58();
		const course = courses.find((entry) => entry.pubkey.toBase58() === courseKey);
		if (!course) continue;

		const completed = countCompletedLessons(enrollment.account.lessonFlags);
		const score = completed * course.account.xpPerLesson;
		const userId = enrollment.pubkey.toBase58();

		const existing = byCourse.get(course.account.courseId);
		const users = existing ?? new Map<string, number>();
		if (!existing) byCourse.set(course.account.courseId, users);
		users.set(userId, Math.max(users.get(userId) ?? 0, score));
	}

	const leaderboards = Array.from(byCourse.entries()).map(([courseId, users]) => ({
		courseId,
		entries: Array.from(users.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 20)
			.map(([userId, score], index) => ({
				rank: index + 1,
				user: {
					id: userId,
					name: `${userId.slice(0, 4)}...${userId.slice(-4)}`,
					avatar: "",
					country: "--",
				},
				score,
				level: calculateLevelFromXP(score),
				achievements: 0,
				streak: 0,
				change: 0,
			})),
	}));

	return NextResponse.json({ leaderboards });
}
