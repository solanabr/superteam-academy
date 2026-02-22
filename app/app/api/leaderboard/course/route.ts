import { NextResponse } from "next/server";
import type { PublicKey } from "@solana/web3.js";
import { getAcademyClient } from "@/lib/academy";

export async function GET() {
	const academyClient = getAcademyClient();
	const courses = await academyClient.fetchAllCourses();
	const fetchAllEnrollments = (
		academyClient as unknown as {
			fetchAllEnrollments?: () => Promise<
				Array<{
					pubkey: PublicKey;
					account: { course: PublicKey; lessonFlags: [bigint, bigint, bigint, bigint] };
				}>
			>;
		}
	).fetchAllEnrollments;

	const enrollments =
		typeof fetchAllEnrollments === "function"
			? await fetchAllEnrollments.call(academyClient)
			: [];

	const byCourse = new Map<string, Map<string, number>>();
	for (const enrollment of enrollments) {
		const courseKey = enrollment.account.course.toBase58();
		const course = courses.find(
			(entry: (typeof courses)[number]) => entry.pubkey.toBase58() === courseKey
		);
		if (!course) continue;

		const completedLessons = enrollment.account.lessonFlags.reduce(
			(sum: number, word: bigint) => {
				let value = word;
				let bits = 0;
				while (value > 0n) {
					bits += Number(value & 1n);
					value >>= 1n;
				}
				return sum + bits;
			},
			0
		);
		const score = completedLessons * course.account.xpPerLesson;
		const userId = enrollment.pubkey.toBase58();

		if (!byCourse.has(course.account.courseId)) {
			byCourse.set(course.account.courseId, new Map());
		}
		const users = byCourse.get(course.account.courseId)!;
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
				level: Math.max(1, Math.floor(score / 500) + 1),
				achievements: 0,
				streak: 0,
				change: 0,
			})),
	}));

	return NextResponse.json({ leaderboards });
}
